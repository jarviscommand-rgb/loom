import OpenAI from 'openai';
import type { TemporalGraph } from '../graph/temporal-graph.js';
import { NARRATIVE_EXTRACTION_PROMPT } from './prompts.js';
import { ExtractionError } from '../errors/index.js';
import {
  extractNarrative,
  chunkText,
  mergeExtractions,
  deduplicateEntities,
  resolveAndAddToGraph,
  parseJsonResponse,
  type ExtractionResult,
  type RawExtraction,
} from './narrative-extractor.js';

// ============================================================
// LOOM — Streaming Narrative Extraction
//
// Wraps the OpenAI call with streaming enabled and delivers
// partial results via an onChunk callback. Falls back to
// the standard extractNarrative when streaming is unavailable.
// ============================================================

/** Stages of streaming extraction progress. */
export type StreamingStage = 'entities' | 'events' | 'tensions' | 'arcs';

/** Chunk delivered during streaming extraction. */
export interface StreamingChunk {
  stage: StreamingStage;
  partial: Partial<RawExtraction>;
  done: boolean;
}

/** Callback invoked for each streaming chunk. */
export type OnStreamingChunk = (chunk: StreamingChunk) => void;

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

/**
 * Extract narrative structure from text using OpenAI streaming.
 * Delivers partial results via onChunk as JSON accumulates.
 * Falls back to non-streaming extractNarrative on failure.
 */
export async function extractNarrativeStreaming(
  text: string,
  graph: TemporalGraph,
  onChunk: OnStreamingChunk
): Promise<ExtractionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallbackExtraction(text, graph, onChunk);
  }

  const openai = new OpenAI({ apiKey });
  const chunks = chunkText(text);

  try {
    const rawExtractions = [];
    for (let i = 0; i < chunks.length; i++) {
      const raw = await streamChunkWithRetry(openai, chunks[i], onChunk);
      rawExtractions.push(raw);
    }

    const merged = mergeExtractions(rawExtractions);
    const deduplicated = deduplicateEntities(merged);
    const result = resolveAndAddToGraph(deduplicated, graph);

    return result;
  } catch {
    return fallbackExtraction(text, graph, onChunk);
  }
}

/**
 * Stream a single chunk from OpenAI, accumulating JSON and
 * firing onChunk as each stage's data becomes parseable.
 */
async function streamChunkWithRetry(
  openai: OpenAI,
  text: string,
  onChunk: OnStreamingChunk
): Promise<RawExtraction> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await streamChunk(openai, text, onChunk);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_RETRIES) {
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw new ExtractionError(
    `Streaming extraction failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`
  );
}

/**
 * Stream a single chunk from OpenAI and emit progress chunks.
 */
async function streamChunk(
  openai: OpenAI,
  text: string,
  onChunk: OnStreamingChunk
): Promise<RawExtraction> {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: NARRATIVE_EXTRACTION_PROMPT },
      { role: 'user', content: text },
    ],
    temperature: 0.3,
    max_tokens: 4096,
    stream: true,
  });

  let accumulated = '';
  const emittedStages = new Set<StreamingStage>();

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (!delta) continue;

    accumulated += delta;

    // Try to detect and emit stage progress as JSON accumulates
    emitStageProgress(accumulated, emittedStages, onChunk);
  }

  const parsed = parseJsonResponse<RawExtraction>(accumulated);

  // Emit final chunks for any stages not yet emitted
  const stages: StreamingStage[] = ['entities', 'events', 'tensions', 'arcs'];
  for (const stage of stages) {
    if (!emittedStages.has(stage)) {
      onChunk({ stage, partial: parsed, done: true });
    }
  }

  return parsed;
}

/**
 * Detect completed JSON sections in the accumulated stream
 * and emit progress for each stage.
 */
function emitStageProgress(
  accumulated: string,
  emittedStages: Set<StreamingStage>,
  onChunk: OnStreamingChunk
): void {
  const stageKeys: Array<{ stage: StreamingStage; key: string }> = [
    { stage: 'entities', key: 'characters' },
    { stage: 'events', key: 'events' },
    { stage: 'tensions', key: 'tensions' },
    { stage: 'arcs', key: 'arcs' },
  ];

  for (const { stage, key } of stageKeys) {
    if (emittedStages.has(stage)) continue;

    // Check if this key's array has started appearing in the stream
    const keyPattern = new RegExp(`"${key}"\\s*:\\s*\\[`);
    if (keyPattern.test(accumulated)) {
      emittedStages.add(stage);
      onChunk({
        stage,
        partial: tryPartialParse(accumulated),
        done: false,
      });
    }
  }
}

/**
 * Attempt to parse accumulated JSON, returning whatever we can.
 * Incomplete JSON returns empty arrays for missing fields.
 */
function tryPartialParse(accumulated: string): Partial<RawExtraction> {
  try {
    return parseJsonResponse<RawExtraction>(accumulated);
  } catch {
    return {
      characters: [],
      events: [],
      tensions: [],
      arcs: [],
    };
  }
}

/**
 * Fallback to non-streaming extraction, still emitting
 * stage progress via onChunk for consistent UX.
 */
async function fallbackExtraction(
  text: string,
  graph: TemporalGraph,
  onChunk: OnStreamingChunk
): Promise<ExtractionResult> {
  const result = await extractNarrative(text, graph, (progress) => {
    const stageMap: Record<string, StreamingStage | undefined> = {
      extracting: 'entities',
      merging: 'events',
      deduplicating: 'tensions',
      done: 'arcs',
    };
    const stage = stageMap[progress.stage];
    if (stage) {
      onChunk({ stage, partial: {}, done: progress.stage === 'done' });
    }
  });

  return result;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

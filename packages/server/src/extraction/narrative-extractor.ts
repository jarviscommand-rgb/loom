import OpenAI from 'openai';
import { v4 as uuid } from 'uuid';
import type { Entity, NarrativeEvent, Tension, NarrativeArc } from '../graph/types.js';
import type { TemporalGraph } from '../graph/temporal-graph.js';
import { NARRATIVE_EXTRACTION_PROMPT } from './prompts.js';

// ============================================================
// LOOM — Narrative Extraction Pipeline
//
// Extracts structured narrative data from text with:
// - Input chunking for long documents
// - Retry logic with exponential backoff
// - Entity deduplication and fuzzy merging
// - Confidence scoring on all elements
// - Incremental extraction (merge with existing graph)
// - Streaming progress callbacks
// ============================================================

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

/** Approximate token limit per chunk (conservative estimate: 1 token ≈ 4 chars). */
const CHUNK_CHAR_LIMIT = 12_000;

/** Minimum overlap between chunks to maintain context. */
const CHUNK_OVERLAP_CHARS = 500;

/** Threshold for fuzzy name matching during deduplication. */
const FUZZY_MATCH_THRESHOLD = 0.8;

// ============================================================
// Types
// ============================================================

interface RawExtraction {
  characters: Array<{
    name: string;
    type: string;
    motivation: string;
    capability: string;
    alliances: string[];
    description: string;
    confidence?: number;
  }>;
  events: Array<{
    title: string;
    description: string;
    timestamp: string;
    participants: string[];
    causalPredecessors: string[];
    impact: number;
    sentiment: number;
    confidence?: number;
  }>;
  tensions: Array<{
    name: string;
    description: string;
    parties: [string, string];
    status: string;
    intensity: number;
    relatedEvents: string[];
    confidence?: number;
  }>;
  arcs: Array<{
    name: string;
    description: string;
    phase: string;
    characters: string[];
    events: string[];
    tensions: string[];
    confidence?: number;
  }>;
}

export interface ExtractionResult {
  entities: Entity[];
  events: NarrativeEvent[];
  tensions: Tension[];
  arcs: NarrativeArc[];
}

/** Progress callback for streaming extraction status. */
export type ExtractionProgressCallback = (progress: {
  stage: 'chunking' | 'extracting' | 'merging' | 'deduplicating' | 'done';
  chunkIndex?: number;
  totalChunks?: number;
  message: string;
}) => void;

// ============================================================
// Public API — backward-compatible
// ============================================================

/**
 * Extract narrative structure from text and merge into the graph.
 * Backward-compatible signature.
 */
export async function extractNarrative(
  text: string,
  graph: TemporalGraph,
  onProgress?: ExtractionProgressCallback
): Promise<ExtractionResult> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Step 1: Chunk input
  onProgress?.({ stage: 'chunking', message: 'Splitting text into chunks...' });
  const chunks = chunkText(text);

  // Step 2: Extract from each chunk
  const rawExtractions: RawExtraction[] = [];
  for (let i = 0; i < chunks.length; i++) {
    onProgress?.({
      stage: 'extracting',
      chunkIndex: i,
      totalChunks: chunks.length,
      message: `Extracting from chunk ${i + 1}/${chunks.length}...`,
    });

    const raw = await extractChunkWithRetry(openai, chunks[i]);
    rawExtractions.push(raw);
  }

  // Step 3: Merge chunk results
  onProgress?.({ stage: 'merging', message: 'Merging chunk extractions...' });
  const merged = mergeExtractions(rawExtractions);

  // Step 4: Deduplicate entities
  onProgress?.({ stage: 'deduplicating', message: 'Deduplicating entities...' });
  const deduplicated = deduplicateEntities(merged);

  // Step 5: Resolve references and add to graph
  const result = resolveAndAddToGraph(deduplicated, graph);

  onProgress?.({ stage: 'done', message: 'Extraction complete.' });
  return result;
}

// ============================================================
// Text chunking
// ============================================================

/**
 * Split text into chunks at paragraph boundaries.
 * Each chunk stays under the character limit with overlap
 * to maintain context across boundaries.
 */
function chunkText(text: string): string[] {
  if (text.length <= CHUNK_CHAR_LIMIT) return [text];

  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';
  let overlapBuffer = '';

  for (const paragraph of paragraphs) {
    const candidate = currentChunk ? currentChunk + '\n\n' + paragraph : overlapBuffer + paragraph;

    if (candidate.length > CHUNK_CHAR_LIMIT && currentChunk.length > 0) {
      chunks.push(currentChunk);
      // Keep tail of current chunk as overlap context
      overlapBuffer = currentChunk.slice(-CHUNK_OVERLAP_CHARS) + '\n\n';
      currentChunk = overlapBuffer + paragraph;
    } else {
      currentChunk = candidate;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

// ============================================================
// LLM extraction with retry
// ============================================================

async function extractChunkWithRetry(openai: OpenAI, text: string): Promise<RawExtraction> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: NARRATIVE_EXTRACTION_PROMPT },
          { role: 'user', content: text },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from LLM');

      return parseJsonResponse<RawExtraction>(content);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES) {
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw new Error(`Extraction failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`);
}

// ============================================================
// Multi-chunk merging
// ============================================================

/**
 * Merge extractions from multiple chunks into a single extraction.
 * Deduplicates characters and events across chunks.
 */
function mergeExtractions(extractions: RawExtraction[]): RawExtraction {
  if (extractions.length === 1) return extractions[0];

  const merged: RawExtraction = {
    characters: [],
    events: [],
    tensions: [],
    arcs: [],
  };

  const seenCharacters = new Map<string, number>(); // name → index
  const seenEvents = new Map<string, number>(); // title → index
  const seenTensions = new Map<string, number>(); // name → index

  for (const extraction of extractions) {
    // Merge characters
    for (const char of extraction.characters) {
      const key = char.name.toLowerCase();
      const existingIdx = seenCharacters.get(key);
      if (existingIdx !== undefined) {
        // Merge: keep higher confidence version, combine alliances
        const existing = merged.characters[existingIdx];
        if ((char.confidence || 0) > (existing.confidence || 0)) {
          merged.characters[existingIdx] = {
            ...char,
            alliances: [...new Set([...existing.alliances, ...char.alliances])],
          };
        } else {
          existing.alliances = [...new Set([...existing.alliances, ...char.alliances])];
        }
      } else {
        seenCharacters.set(key, merged.characters.length);
        merged.characters.push({ ...char });
      }
    }

    // Merge events (deduplicate by title)
    for (const event of extraction.events) {
      const key = event.title.toLowerCase();
      if (!seenEvents.has(key)) {
        seenEvents.set(key, merged.events.length);
        merged.events.push({ ...event });
      }
    }

    // Merge tensions (deduplicate by name)
    for (const tension of extraction.tensions) {
      const key = tension.name.toLowerCase();
      const existingIdx = seenTensions.get(key);
      if (existingIdx !== undefined) {
        // Keep higher intensity version
        const existing = merged.tensions[existingIdx];
        if (tension.intensity > existing.intensity) {
          merged.tensions[existingIdx] = {
            ...tension,
            relatedEvents: [...new Set([...existing.relatedEvents, ...tension.relatedEvents])],
          };
        } else {
          existing.relatedEvents = [
            ...new Set([...existing.relatedEvents, ...tension.relatedEvents]),
          ];
        }
      } else {
        seenTensions.set(key, merged.tensions.length);
        merged.tensions.push({ ...tension });
      }
    }

    // Merge arcs (take the most complete version)
    for (const arc of extraction.arcs) {
      const existing = merged.arcs.find((a) => a.name.toLowerCase() === arc.name.toLowerCase());
      if (existing) {
        existing.events = [...new Set([...existing.events, ...arc.events])];
        existing.characters = [...new Set([...existing.characters, ...arc.characters])];
        existing.tensions = [...new Set([...existing.tensions, ...arc.tensions])];
      } else {
        merged.arcs.push({ ...arc });
      }
    }
  }

  return merged;
}

// ============================================================
// Entity deduplication
// ============================================================

/**
 * Deduplicate entities using fuzzy name matching.
 * Handles cases like "Sam Altman" vs "Altman" vs "Samuel Altman".
 */
function deduplicateEntities(raw: RawExtraction): RawExtraction {
  const nameGroups = groupSimilarNames(raw.characters.map((c) => c.name));

  if (nameGroups.size === 0) return raw;

  // Build canonical name map
  const canonicalMap = new Map<string, string>(); // original → canonical

  for (const [canonical, variants] of nameGroups) {
    for (const variant of variants) {
      canonicalMap.set(variant, canonical);
    }
  }

  // Apply canonical names to characters
  const deduplicatedChars: typeof raw.characters = [];
  const seenCanonical = new Set<string>();

  for (const char of raw.characters) {
    const canonical = canonicalMap.get(char.name) || char.name;

    if (seenCanonical.has(canonical)) {
      // Merge with existing
      const existing = deduplicatedChars.find((c) => c.name === canonical);
      if (existing) {
        existing.alliances = [...new Set([...existing.alliances, ...char.alliances])];
        // Keep longer description
        if (char.description.length > existing.description.length) {
          existing.description = char.description;
        }
      }
    } else {
      seenCanonical.add(canonical);
      deduplicatedChars.push({ ...char, name: canonical });
    }
  }

  // Update all references to use canonical names
  const replaceNames = (names: string[]): string[] => names.map((n) => canonicalMap.get(n) || n);

  return {
    characters: deduplicatedChars.map((c) => ({
      ...c,
      alliances: replaceNames(c.alliances),
    })),
    events: raw.events.map((e) => ({
      ...e,
      participants: replaceNames(e.participants),
    })),
    tensions: raw.tensions.map((t) => ({
      ...t,
      parties: [
        canonicalMap.get(t.parties[0]) || t.parties[0],
        canonicalMap.get(t.parties[1]) || t.parties[1],
      ] as [string, string],
    })),
    arcs: raw.arcs.map((a) => ({
      ...a,
      characters: replaceNames(a.characters),
    })),
  };
}

/**
 * Group names that likely refer to the same entity.
 * Returns a map of canonical name → list of all variants.
 */
function groupSimilarNames(names: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  const assigned = new Set<string>();

  for (let i = 0; i < names.length; i++) {
    if (assigned.has(names[i])) continue;

    const group = [names[i]];
    assigned.add(names[i]);

    for (let j = i + 1; j < names.length; j++) {
      if (assigned.has(names[j])) continue;

      if (namesMatch(names[i], names[j])) {
        group.push(names[j]);
        assigned.add(names[j]);
      }
    }

    if (group.length > 1) {
      // Canonical name = longest version
      const canonical = group.reduce((a, b) => (a.length >= b.length ? a : b));
      groups.set(canonical, group);
    }
  }

  return groups;
}

/**
 * Check if two names likely refer to the same entity.
 * Handles: substring matching, last-name matching, and Jaccard similarity.
 */
function namesMatch(a: string, b: string): boolean {
  const aLower = a.toLowerCase().trim();
  const bLower = b.toLowerCase().trim();

  // Exact match
  if (aLower === bLower) return true;

  // One is a substring of the other (e.g., "Altman" in "Sam Altman")
  if (aLower.includes(bLower) || bLower.includes(aLower)) return true;

  // Last name matching for person names
  const aParts = aLower.split(/\s+/);
  const bParts = bLower.split(/\s+/);
  if (aParts.length > 1 && bParts.length > 1) {
    const aLast = aParts[aParts.length - 1];
    const bLast = bParts[bParts.length - 1];
    if (aLast === bLast && aLast.length > 2) return true;
  }

  // Jaccard similarity on word tokens
  const aWords = new Set(aParts);
  const bWords = new Set(bParts);
  let intersection = 0;
  for (const w of aWords) {
    if (bWords.has(w)) intersection++;
  }
  const union = new Set([...aWords, ...bWords]).size;
  const jaccard = union > 0 ? intersection / union : 0;

  return jaccard >= FUZZY_MATCH_THRESHOLD;
}

// ============================================================
// Reference resolution and graph integration
// ============================================================

function resolveAndAddToGraph(raw: RawExtraction, graph: TemporalGraph): ExtractionResult {
  const nameToEntityId = new Map<string, string>();
  const titleToEventId = new Map<string, string>();
  const nameToTensionId = new Map<string, string>();

  // Process entities — check for existing in graph
  const entities: Entity[] = raw.characters.map((c) => {
    // Try exact match first, then fuzzy
    let existing = graph.findEntityByName(c.name);
    if (!existing) {
      const fuzzyMatches = graph.findEntitiesFuzzy(c.name, 2);
      if (fuzzyMatches.length > 0) {
        existing = fuzzyMatches[0];
      }
    }

    const id = existing?.id || uuid();
    nameToEntityId.set(c.name, id);

    return graph.addEntity({
      id,
      name: c.name,
      type: c.type as Entity['type'],
      motivation: c.motivation,
      capability: c.capability,
      alliances: c.alliances,
      description: c.description,
      firstSeen: existing?.firstSeen || new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      confidence: c.confidence,
    });
  });

  // Resolve alliance references to entity IDs
  for (const entity of entities) {
    entity.alliances = entity.alliances.map((a) => nameToEntityId.get(a) || a);
  }

  // Process events
  const events: NarrativeEvent[] = raw.events.map((e) => {
    const id = uuid();
    titleToEventId.set(e.title, id);
    return graph.addEvent({
      id,
      title: e.title,
      description: e.description,
      timestamp: e.timestamp,
      participants: e.participants.map((p) => nameToEntityId.get(p) || p),
      causalPredecessors: e.causalPredecessors.map((p) => titleToEventId.get(p) || p),
      impact: clamp(e.impact, 0, 1),
      sentiment: clamp(e.sentiment, -1, 1),
      confidence: e.confidence,
    });
  });

  // Re-resolve causal predecessors now that all events have IDs
  for (const event of events) {
    event.causalPredecessors = event.causalPredecessors.map((p) => titleToEventId.get(p) || p);
  }

  // Process tensions
  const tensions: Tension[] = raw.tensions.map((t) => {
    const id = uuid();
    nameToTensionId.set(t.name, id);

    const firstEvent = t.relatedEvents[0];
    const firstEventObj = firstEvent ? raw.events.find((e) => e.title === firstEvent) : undefined;
    const lastEvent = t.relatedEvents[t.relatedEvents.length - 1];
    const lastEventObj = lastEvent ? raw.events.find((e) => e.title === lastEvent) : undefined;

    const validFrom = firstEventObj?.timestamp || new Date().toISOString();
    const duration =
      firstEventObj && lastEventObj
        ? Math.max(
            1,
            Math.round(
              (new Date(lastEventObj.timestamp).getTime() -
                new Date(firstEventObj.timestamp).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : 1;

    return graph.addTension({
      id,
      name: t.name,
      description: t.description,
      parties: [
        nameToEntityId.get(t.parties[0]) || t.parties[0],
        nameToEntityId.get(t.parties[1]) || t.parties[1],
      ],
      status: t.status as Tension['status'],
      intensity: clamp(t.intensity, 0, 1),
      duration,
      relatedEvents: t.relatedEvents.map((e) => titleToEventId.get(e) || e),
      validFrom,
      validTo: t.status === 'resolved' ? lastEventObj?.timestamp : undefined,
      confidence: t.confidence,
      statusHistory: [{ status: t.status as Tension['status'], timestamp: validFrom }],
    });
  });

  // Process arcs
  const arcs: NarrativeArc[] = raw.arcs.map((a) => {
    const arcEvents = a.events.map((e) => titleToEventId.get(e) || e);
    const firstEventTitle = a.events[0];
    const firstEvent = firstEventTitle
      ? raw.events.find((e) => e.title === firstEventTitle)
      : undefined;

    return graph.addArc({
      id: uuid(),
      name: a.name,
      description: a.description,
      phase: a.phase as NarrativeArc['phase'],
      characters: a.characters.map((c) => nameToEntityId.get(c) || c),
      events: arcEvents,
      tensions: a.tensions.map((t) => nameToTensionId.get(t) || t),
      startDate: firstEvent?.timestamp || new Date().toISOString(),
      confidence: a.confidence,
    });
  });

  return { entities, events, tensions, arcs };
}

// ============================================================
// Utility functions
// ============================================================

/** Parse JSON from LLM output, handling markdown code blocks. */
function parseJsonResponse<T>(content: string): T {
  try {
    return JSON.parse(content) as T;
  } catch {
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      return JSON.parse(match[1]) as T;
    }
    throw new Error('Failed to parse LLM response as JSON');
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

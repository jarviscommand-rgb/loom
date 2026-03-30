import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractNarrativeStreaming, type StreamingChunk } from './streaming-extractor.js';

// ============================================================
// Mock OpenAI
// ============================================================

const mockCreate = vi.fn();

vi.mock('openai', () => {
  const MockOpenAI = function (this: Record<string, unknown>) {
    this.chat = {
      completions: {
        create: mockCreate,
      },
    };
  };
  return { default: MockOpenAI };
});

// ============================================================
// Mock uuid
// ============================================================

let uuidCounter = 0;
vi.mock('uuid', () => ({
  v4: () => `uuid-${++uuidCounter}`,
}));

// ============================================================
// Helpers
// ============================================================

function makeMockGraph() {
  return {
    findEntityByName: vi.fn().mockReturnValue(undefined),
    findEntitiesFuzzy: vi.fn().mockReturnValue([]),
    addEntity: vi.fn().mockImplementation((e: Record<string, unknown>) => ({ ...e })),
    addEvent: vi.fn().mockImplementation((e: Record<string, unknown>) => ({ ...e })),
    addTension: vi.fn().mockImplementation((t: Record<string, unknown>) => ({ ...t })),
    addArc: vi.fn().mockImplementation((a: Record<string, unknown>) => ({ ...a })),
    getSnapshot: vi.fn().mockReturnValue({}),
  };
}

function makeExtraction() {
  return {
    characters: [
      {
        name: 'Alice',
        type: 'person',
        motivation: 'testing',
        capability: 'none',
        alliances: [],
        description: 'Test character',
        confidence: 0.9,
      },
    ],
    events: [
      {
        title: 'Arrival',
        description: 'Alice arrived',
        timestamp: '2026-01-15T00:00:00Z',
        participants: ['Alice'],
        causalPredecessors: [],
        impact: 0.5,
        sentiment: 0.0,
        confidence: 0.8,
      },
    ],
    tensions: [],
    arcs: [],
  };
}

/**
 * Create an async iterable that simulates OpenAI streaming response.
 * Splits the JSON string into chunks and yields them as delta objects.
 */
function makeStreamResponse(jsonStr: string) {
  const chunkSize = 20;
  const parts: string[] = [];
  for (let i = 0; i < jsonStr.length; i += chunkSize) {
    parts.push(jsonStr.slice(i, i + chunkSize));
  }

  return {
    async *[Symbol.asyncIterator]() {
      for (const part of parts) {
        yield {
          choices: [{ delta: { content: part } }],
        };
      }
    },
  };
}

// ============================================================
// Tests
// ============================================================

beforeEach(() => {
  uuidCounter = 0;
  mockCreate.mockReset();
  process.env.OPENAI_API_KEY = 'test-key';
});

describe('extractNarrativeStreaming', () => {
  it('streams extraction and returns complete result', async () => {
    const extraction = makeExtraction();
    const jsonStr = JSON.stringify(extraction);
    mockCreate.mockResolvedValueOnce(makeStreamResponse(jsonStr));

    const chunks: StreamingChunk[] = [];
    const onChunk = (chunk: StreamingChunk) => chunks.push({ ...chunk });

    const graph = makeMockGraph();
    const result = await extractNarrativeStreaming('Alice arrived.', graph as never, onChunk);

    expect(result.entities).toHaveLength(1);
    expect(result.entities[0].name).toBe('Alice');
    expect(result.events).toHaveLength(1);
    expect(chunks.length).toBeGreaterThan(0);
  });

  it('emits progress chunks for each stage', async () => {
    const extraction = makeExtraction();
    const jsonStr = JSON.stringify(extraction);
    mockCreate.mockResolvedValueOnce(makeStreamResponse(jsonStr));

    const stages: string[] = [];
    const onChunk = (chunk: StreamingChunk) => {
      if (!stages.includes(chunk.stage)) {
        stages.push(chunk.stage);
      }
    };

    const graph = makeMockGraph();
    await extractNarrativeStreaming('Alice arrived.', graph as never, onChunk);

    // Should have emitted at least entities stage
    expect(stages).toContain('entities');
  });

  it('falls back to non-streaming when OPENAI_API_KEY is missing', async () => {
    delete process.env.OPENAI_API_KEY;

    // Mock for the fallback non-streaming path
    const extraction = makeExtraction();
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(extraction) } }],
    });

    const chunks: StreamingChunk[] = [];
    const onChunk = (chunk: StreamingChunk) => chunks.push({ ...chunk });

    const graph = makeMockGraph();
    const result = await extractNarrativeStreaming('Alice arrived.', graph as never, onChunk);

    expect(result.entities).toHaveLength(1);
    // Fallback still emits progress chunks
    expect(chunks.length).toBeGreaterThan(0);
  });

  it('falls back to non-streaming when streaming fails', async () => {
    vi.useFakeTimers();

    // Make streaming fail (all retries)
    mockCreate
      .mockRejectedValueOnce(new Error('stream error'))
      .mockRejectedValueOnce(new Error('stream error'))
      .mockRejectedValueOnce(new Error('stream error'))
      .mockRejectedValueOnce(new Error('stream error'))
      // Fallback non-streaming call succeeds
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(makeExtraction()) } }],
      });

    const chunks: StreamingChunk[] = [];
    const onChunk = (chunk: StreamingChunk) => chunks.push({ ...chunk });

    const graph = makeMockGraph();
    const promise = extractNarrativeStreaming('Test fallback.', graph as never, onChunk);

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.entities).toHaveLength(1);

    vi.useRealTimers();
  }, 15000);

  it('retries on streaming failure before falling back', async () => {
    vi.useFakeTimers();

    const extraction = makeExtraction();
    const jsonStr = JSON.stringify(extraction);

    // First attempt fails, second succeeds
    mockCreate
      .mockRejectedValueOnce(new Error('transient error'))
      .mockResolvedValueOnce(makeStreamResponse(jsonStr));

    const chunks: StreamingChunk[] = [];
    const onChunk = (chunk: StreamingChunk) => chunks.push({ ...chunk });

    const graph = makeMockGraph();
    const promise = extractNarrativeStreaming('Retry test.', graph as never, onChunk);

    await vi.advanceTimersByTimeAsync(1500);
    const result = await promise;

    expect(result.entities).toHaveLength(1);
    expect(mockCreate).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('calls OpenAI with stream: true', async () => {
    const extraction = makeExtraction();
    const jsonStr = JSON.stringify(extraction);
    mockCreate.mockResolvedValueOnce(makeStreamResponse(jsonStr));

    const graph = makeMockGraph();
    await extractNarrativeStreaming('Check params.', graph as never, () => {});

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        stream: true,
        model: 'gpt-4o',
        temperature: 0.3,
      })
    );
  });

  it('handles empty extraction result', async () => {
    const emptyExtraction = { characters: [], events: [], tensions: [], arcs: [] };
    const jsonStr = JSON.stringify(emptyExtraction);
    mockCreate.mockResolvedValueOnce(makeStreamResponse(jsonStr));

    const graph = makeMockGraph();
    const result = await extractNarrativeStreaming('Nothing here.', graph as never, () => {});

    expect(result.entities).toHaveLength(0);
    expect(result.events).toHaveLength(0);
    expect(result.tensions).toHaveLength(0);
    expect(result.arcs).toHaveLength(0);
  });
});

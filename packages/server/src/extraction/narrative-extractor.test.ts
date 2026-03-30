import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  chunkText,
  mergeExtractions,
  deduplicateEntities,
  groupSimilarNames,
  namesMatch,
  resolveAndAddToGraph,
  parseJsonResponse,
  clamp,
  extractNarrative,
} from './narrative-extractor.js';
import { ExtractionError } from '../errors/index.js';

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
// Mock uuid to produce deterministic IDs
// ============================================================

let uuidCounter = 0;
vi.mock('uuid', () => ({
  v4: () => `uuid-${++uuidCounter}`,
}));

// ============================================================
// Helpers
// ============================================================

function makeRawExtraction(overrides: Partial<Parameters<typeof mergeExtractions>[0][0]> = {}) {
  return {
    characters: [],
    events: [],
    tensions: [],
    arcs: [],
    ...overrides,
  };
}

function makeChar(name: string, overrides: Record<string, unknown> = {}) {
  return {
    name,
    type: 'person',
    motivation: 'testing',
    capability: 'none',
    alliances: [] as string[],
    description: `Description of ${name}`,
    confidence: 0.9,
    ...overrides,
  };
}

function makeEvent(title: string, overrides: Record<string, unknown> = {}) {
  return {
    title,
    description: `Description of ${title}`,
    timestamp: '2026-01-15T00:00:00Z',
    participants: [] as string[],
    causalPredecessors: [] as string[],
    impact: 0.5,
    sentiment: 0.0,
    confidence: 0.8,
    ...overrides,
  };
}

function makeTension(name: string, overrides: Record<string, unknown> = {}) {
  return {
    name,
    description: `Tension: ${name}`,
    parties: ['Alice', 'Bob'] as [string, string],
    status: 'escalating',
    intensity: 0.6,
    relatedEvents: [] as string[],
    confidence: 0.7,
    ...overrides,
  };
}

function makeArc(name: string, overrides: Record<string, unknown> = {}) {
  return {
    name,
    description: `Arc: ${name}`,
    phase: 'rising_action',
    characters: [] as string[],
    events: [] as string[],
    tensions: [] as string[],
    confidence: 0.8,
    ...overrides,
  };
}

function makeMockGraph() {
  return {
    findEntityByName: vi.fn().mockReturnValue(undefined),
    findEntitiesFuzzy: vi.fn().mockReturnValue([]),
    addEntity: vi.fn().mockImplementation((e: Record<string, unknown>) => ({ ...e })),
    addEvent: vi.fn().mockImplementation((e: Record<string, unknown>) => ({ ...e })),
    addTension: vi.fn().mockImplementation((t: Record<string, unknown>) => ({ ...t })),
    addArc: vi.fn().mockImplementation((a: Record<string, unknown>) => ({ ...a })),
  };
}

// ============================================================
// Tests
// ============================================================

beforeEach(() => {
  uuidCounter = 0;
  mockCreate.mockReset();
});

// ---------- clamp ----------

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });

  it('clamps to min', () => {
    expect(clamp(-5, 0, 1)).toBe(0);
  });

  it('clamps to max', () => {
    expect(clamp(10, 0, 1)).toBe(1);
  });

  it('handles negative range', () => {
    expect(clamp(-0.5, -1, 1)).toBe(-0.5);
    expect(clamp(-2, -1, 1)).toBe(-1);
  });

  it('handles boundary values exactly', () => {
    expect(clamp(0, 0, 1)).toBe(0);
    expect(clamp(1, 0, 1)).toBe(1);
  });
});

// ---------- parseJsonResponse ----------

describe('parseJsonResponse', () => {
  it('parses valid JSON directly', () => {
    const result = parseJsonResponse<{ a: number }>('{"a": 1}');
    expect(result).toEqual({ a: 1 });
  });

  it('parses JSON from markdown code block', () => {
    const input = 'Here is the result:\n```json\n{"a": 2}\n```\nDone.';
    expect(parseJsonResponse<{ a: number }>(input)).toEqual({ a: 2 });
  });

  it('parses JSON from untagged code block', () => {
    const input = '```\n{"key": "value"}\n```';
    expect(parseJsonResponse<{ key: string }>(input)).toEqual({ key: 'value' });
  });

  it('throws ExtractionError for invalid JSON without code block', () => {
    expect(() => parseJsonResponse('not json at all')).toThrow(ExtractionError);
    expect(() => parseJsonResponse('not json at all')).toThrow(
      'Failed to parse LLM response as JSON'
    );
  });

  it('throws on malformed JSON inside code block', () => {
    const input = '```json\n{broken json}\n```';
    expect(() => parseJsonResponse(input)).toThrow();
  });

  it('handles empty object', () => {
    expect(parseJsonResponse('{}')).toEqual({});
  });

  it('handles arrays', () => {
    expect(parseJsonResponse<number[]>('[1,2,3]')).toEqual([1, 2, 3]);
  });
});

// ---------- chunkText ----------

describe('chunkText', () => {
  it('returns single chunk for short text', () => {
    const result = chunkText('Short text.');
    expect(result).toEqual(['Short text.']);
  });

  it('returns single chunk for text at exactly the limit', () => {
    const text = 'a'.repeat(12_000);
    expect(chunkText(text)).toEqual([text]);
  });

  it('splits long text into multiple chunks', () => {
    // Build text with paragraphs that exceed CHUNK_CHAR_LIMIT (12000)
    const paragraph = 'A'.repeat(3000);
    const text = [paragraph, paragraph, paragraph, paragraph, paragraph].join('\n\n');
    const chunks = chunkText(text);

    expect(chunks.length).toBeGreaterThan(1);
    // Each chunk should be non-empty
    for (const chunk of chunks) {
      expect(chunk.length).toBeGreaterThan(0);
    }
  });

  it('maintains overlap between chunks', () => {
    const paragraphs = Array.from({ length: 10 }, (_, i) => `Paragraph ${i}: ${'x'.repeat(2500)}`);
    const text = paragraphs.join('\n\n');
    const chunks = chunkText(text);

    expect(chunks.length).toBeGreaterThan(1);

    // Second chunk should contain some content from the end of the first chunk
    const firstChunkTail = chunks[0].slice(-200);
    expect(chunks[1]).toContain(firstChunkTail);
  });

  it('returns empty array content for empty text', () => {
    const result = chunkText('');
    expect(result).toEqual(['']);
  });

  it('handles text without paragraph breaks', () => {
    const text = 'a'.repeat(20_000);
    const chunks = chunkText(text);
    // Without paragraph breaks there's nothing to split on, so it stays as one chunk
    expect(chunks).toEqual([text]);
  });

  it('handles single paragraph exceeding limit', () => {
    const bigParagraph = 'x'.repeat(15_000);
    const text = bigParagraph + '\n\n' + 'small paragraph';
    const chunks = chunkText(text);
    // Should still produce chunks (the big paragraph becomes its own chunk)
    expect(chunks.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------- namesMatch ----------

describe('namesMatch', () => {
  it('matches exact names', () => {
    expect(namesMatch('Alice', 'Alice')).toBe(true);
  });

  it('matches case-insensitively', () => {
    expect(namesMatch('alice', 'ALICE')).toBe(true);
  });

  it('matches substring (last name only)', () => {
    expect(namesMatch('Sam Altman', 'Altman')).toBe(true);
    expect(namesMatch('Altman', 'Sam Altman')).toBe(true);
  });

  it('matches by shared last name for multi-word names', () => {
    expect(namesMatch('Samuel Altman', 'Sam Altman')).toBe(true);
  });

  it('does not match completely different names', () => {
    expect(namesMatch('Alice Johnson', 'Bob Smith')).toBe(false);
  });

  it('does not match short shared last names (length <= 2)', () => {
    // "Li" has length 2 — should NOT match via last-name rule alone
    expect(namesMatch('Wang Li', 'Zhang Li')).toBe(false);
  });

  it('handles whitespace trimming', () => {
    expect(namesMatch('  Alice  ', 'Alice')).toBe(true);
  });

  it('matches via high Jaccard similarity', () => {
    // Same words, just reordered — Jaccard = 1.0
    expect(namesMatch('The Quick Fox', 'Quick Fox The')).toBe(true);
  });

  it('does not match low Jaccard similarity', () => {
    expect(namesMatch('Alpha Beta Gamma', 'Delta Epsilon Zeta')).toBe(false);
  });
});

// ---------- groupSimilarNames ----------

describe('groupSimilarNames', () => {
  it('returns empty map when no duplicates', () => {
    const result = groupSimilarNames(['Alice', 'Bob', 'Charlie']);
    expect(result.size).toBe(0);
  });

  it('groups similar names together', () => {
    const result = groupSimilarNames(['Sam Altman', 'Altman', 'Bob']);
    expect(result.size).toBe(1);
    // Canonical = longest name
    expect(result.has('Sam Altman')).toBe(true);
    expect(result.get('Sam Altman')).toContain('Altman');
  });

  it('picks longest name as canonical', () => {
    const result = groupSimilarNames(['Altman', 'Samuel Altman', 'Sam Altman']);
    // "Samuel Altman" is longest
    expect(result.has('Samuel Altman')).toBe(true);
    const group = result.get('Samuel Altman')!;
    expect(group).toHaveLength(3);
  });

  it('handles empty input', () => {
    expect(groupSimilarNames([]).size).toBe(0);
  });

  it('handles single name', () => {
    expect(groupSimilarNames(['Alice']).size).toBe(0);
  });
});

// ---------- mergeExtractions ----------

describe('mergeExtractions', () => {
  it('returns the single extraction when given one', () => {
    const single = makeRawExtraction({
      characters: [makeChar('Alice')],
    });
    const result = mergeExtractions([single]);
    expect(result).toBe(single);
  });

  it('merges characters from multiple extractions', () => {
    const e1 = makeRawExtraction({ characters: [makeChar('Alice')] });
    const e2 = makeRawExtraction({ characters: [makeChar('Bob')] });
    const result = mergeExtractions([e1, e2]);
    expect(result.characters).toHaveLength(2);
  });

  it('deduplicates characters by name (case-insensitive)', () => {
    const e1 = makeRawExtraction({
      characters: [makeChar('Alice', { confidence: 0.8, alliances: ['Bob'] })],
    });
    const e2 = makeRawExtraction({
      characters: [makeChar('alice', { confidence: 0.9, alliances: ['Charlie'] })],
    });
    const result = mergeExtractions([e1, e2]);
    expect(result.characters).toHaveLength(1);
    // Higher confidence version wins, alliances merged
    expect(result.characters[0].confidence).toBe(0.9);
    expect(result.characters[0].alliances).toContain('Bob');
    expect(result.characters[0].alliances).toContain('Charlie');
  });

  it('keeps lower confidence version but merges alliances when existing has higher confidence', () => {
    const e1 = makeRawExtraction({
      characters: [makeChar('Alice', { confidence: 0.95, alliances: ['Bob'] })],
    });
    const e2 = makeRawExtraction({
      characters: [makeChar('alice', { confidence: 0.5, alliances: ['Dave'] })],
    });
    const result = mergeExtractions([e1, e2]);
    expect(result.characters).toHaveLength(1);
    expect(result.characters[0].confidence).toBe(0.95);
    expect(result.characters[0].alliances).toContain('Bob');
    expect(result.characters[0].alliances).toContain('Dave');
  });

  it('deduplicates events by title', () => {
    const e1 = makeRawExtraction({ events: [makeEvent('Launch')] });
    const e2 = makeRawExtraction({ events: [makeEvent('Launch'), makeEvent('Crash')] });
    const result = mergeExtractions([e1, e2]);
    expect(result.events).toHaveLength(2);
  });

  it('deduplicates tensions by name and keeps higher intensity', () => {
    const e1 = makeRawExtraction({
      tensions: [makeTension('Rivalry', { intensity: 0.3, relatedEvents: ['ev1'] })],
    });
    const e2 = makeRawExtraction({
      tensions: [makeTension('rivalry', { intensity: 0.8, relatedEvents: ['ev2'] })],
    });
    const result = mergeExtractions([e1, e2]);
    expect(result.tensions).toHaveLength(1);
    expect(result.tensions[0].intensity).toBe(0.8);
    expect(result.tensions[0].relatedEvents).toContain('ev1');
    expect(result.tensions[0].relatedEvents).toContain('ev2');
  });

  it('merges arcs by combining events, characters, tensions', () => {
    const e1 = makeRawExtraction({
      arcs: [makeArc('Rise', { events: ['e1'], characters: ['Alice'] })],
    });
    const e2 = makeRawExtraction({
      arcs: [makeArc('Rise', { events: ['e2'], characters: ['Bob'] })],
    });
    const result = mergeExtractions([e1, e2]);
    expect(result.arcs).toHaveLength(1);
    expect(result.arcs[0].events).toEqual(['e1', 'e2']);
    expect(result.arcs[0].characters).toEqual(['Alice', 'Bob']);
  });

  it('handles empty extractions', () => {
    const result = mergeExtractions([makeRawExtraction(), makeRawExtraction()]);
    expect(result.characters).toHaveLength(0);
    expect(result.events).toHaveLength(0);
    expect(result.tensions).toHaveLength(0);
    expect(result.arcs).toHaveLength(0);
  });
});

// ---------- deduplicateEntities ----------

describe('deduplicateEntities', () => {
  it('returns raw extraction unchanged when no similar names', () => {
    const raw = makeRawExtraction({
      characters: [makeChar('Alice'), makeChar('Bob')],
    });
    const result = deduplicateEntities(raw);
    expect(result.characters).toHaveLength(2);
  });

  it('merges similar character names under canonical form', () => {
    const raw = makeRawExtraction({
      characters: [
        makeChar('Sam Altman', { description: 'CEO of OpenAI' }),
        makeChar('Altman', { description: 'Short' }),
      ],
    });
    const result = deduplicateEntities(raw);
    expect(result.characters).toHaveLength(1);
    expect(result.characters[0].name).toBe('Sam Altman');
    // Keeps longer description
    expect(result.characters[0].description).toBe('CEO of OpenAI');
  });

  it('updates participant references in events', () => {
    const raw = makeRawExtraction({
      characters: [makeChar('Sam Altman'), makeChar('Altman')],
      events: [makeEvent('Meeting', { participants: ['Altman'] })],
    });
    const result = deduplicateEntities(raw);
    expect(result.events[0].participants).toEqual(['Sam Altman']);
  });

  it('updates tension party references', () => {
    const raw = makeRawExtraction({
      characters: [makeChar('Sam Altman'), makeChar('Altman')],
      tensions: [makeTension('Conflict', { parties: ['Altman', 'Bob'] as [string, string] })],
    });
    const result = deduplicateEntities(raw);
    expect(result.tensions[0].parties[0]).toBe('Sam Altman');
  });

  it('updates arc character references', () => {
    const raw = makeRawExtraction({
      characters: [makeChar('Sam Altman'), makeChar('Altman')],
      arcs: [makeArc('Story', { characters: ['Altman'] })],
    });
    const result = deduplicateEntities(raw);
    expect(result.arcs[0].characters).toEqual(['Sam Altman']);
  });

  it('handles empty characters', () => {
    const raw = makeRawExtraction({ characters: [] });
    const result = deduplicateEntities(raw);
    expect(result.characters).toHaveLength(0);
  });
});

// ---------- resolveAndAddToGraph ----------

describe('resolveAndAddToGraph', () => {
  it('adds entities, events, tensions, and arcs to the graph', () => {
    const graph = makeMockGraph();
    const raw = makeRawExtraction({
      characters: [makeChar('Alice')],
      events: [makeEvent('Launch', { participants: ['Alice'] })],
      tensions: [
        makeTension('Conflict', {
          parties: ['Alice', 'Bob'] as [string, string],
          relatedEvents: ['Launch'],
        }),
      ],
      arcs: [makeArc('Story', { characters: ['Alice'], events: ['Launch'] })],
    });

    const result = resolveAndAddToGraph(raw, graph as never);

    expect(graph.addEntity).toHaveBeenCalledTimes(1);
    expect(graph.addEvent).toHaveBeenCalledTimes(1);
    expect(graph.addTension).toHaveBeenCalledTimes(1);
    expect(graph.addArc).toHaveBeenCalledTimes(1);

    expect(result.entities).toHaveLength(1);
    expect(result.events).toHaveLength(1);
    expect(result.tensions).toHaveLength(1);
    expect(result.arcs).toHaveLength(1);
  });

  it('resolves participant names to entity IDs', () => {
    const graph = makeMockGraph();
    const raw = makeRawExtraction({
      characters: [makeChar('Alice')],
      events: [makeEvent('Launch', { participants: ['Alice'] })],
    });

    const result = resolveAndAddToGraph(raw, graph as never);

    // Alice got uuid-1, so event participants should reference uuid-1
    const eventCall = graph.addEvent.mock.calls[0][0];
    expect(eventCall.participants).toEqual(['uuid-1']);
    expect(result.events[0].participants).toEqual(['uuid-1']);
  });

  it('reuses existing entity ID from graph when found by name', () => {
    const graph = makeMockGraph();
    graph.findEntityByName.mockReturnValue({ id: 'existing-id', name: 'Alice' });

    const raw = makeRawExtraction({
      characters: [makeChar('Alice')],
    });

    resolveAndAddToGraph(raw, graph as never);

    const entityCall = graph.addEntity.mock.calls[0][0];
    expect(entityCall.id).toBe('existing-id');
  });

  it('falls back to fuzzy match when exact name not found', () => {
    const graph = makeMockGraph();
    graph.findEntityByName.mockReturnValue(undefined);
    graph.findEntitiesFuzzy.mockReturnValue([{ id: 'fuzzy-id', name: 'Alicia' }]);

    const raw = makeRawExtraction({
      characters: [makeChar('Alice')],
    });

    resolveAndAddToGraph(raw, graph as never);

    expect(graph.findEntitiesFuzzy).toHaveBeenCalledWith('Alice', 2);
    const entityCall = graph.addEntity.mock.calls[0][0];
    expect(entityCall.id).toBe('fuzzy-id');
  });

  it('clamps impact and sentiment values', () => {
    const graph = makeMockGraph();
    const raw = makeRawExtraction({
      events: [makeEvent('Extreme', { impact: 5, sentiment: -3 })],
    });

    resolveAndAddToGraph(raw, graph as never);

    const eventCall = graph.addEvent.mock.calls[0][0];
    expect(eventCall.impact).toBe(1);
    expect(eventCall.sentiment).toBe(-1);
  });

  it('clamps tension intensity', () => {
    const graph = makeMockGraph();
    const raw = makeRawExtraction({
      tensions: [makeTension('Overflow', { intensity: 1.5 })],
    });

    resolveAndAddToGraph(raw, graph as never);

    const tensionCall = graph.addTension.mock.calls[0][0];
    expect(tensionCall.intensity).toBe(1);
  });

  it('calculates tension duration from related events', () => {
    const graph = makeMockGraph();
    const raw = makeRawExtraction({
      events: [
        makeEvent('Start', { timestamp: '2026-01-01T00:00:00Z' }),
        makeEvent('End', { timestamp: '2026-01-11T00:00:00Z' }),
      ],
      tensions: [
        makeTension('Long Conflict', {
          relatedEvents: ['Start', 'End'],
        }),
      ],
    });

    resolveAndAddToGraph(raw, graph as never);

    const tensionCall = graph.addTension.mock.calls[0][0];
    expect(tensionCall.duration).toBe(10); // 10 days apart
  });

  it('sets validTo for resolved tensions', () => {
    const graph = makeMockGraph();
    const raw = makeRawExtraction({
      events: [makeEvent('Resolution', { timestamp: '2026-03-01T00:00:00Z' })],
      tensions: [
        makeTension('Done', {
          status: 'resolved',
          relatedEvents: ['Resolution'],
        }),
      ],
    });

    resolveAndAddToGraph(raw, graph as never);

    const tensionCall = graph.addTension.mock.calls[0][0];
    expect(tensionCall.validTo).toBe('2026-03-01T00:00:00Z');
  });

  it('does not set validTo for non-resolved tensions', () => {
    const graph = makeMockGraph();
    const raw = makeRawExtraction({
      events: [makeEvent('Ongoing')],
      tensions: [
        makeTension('Active', {
          status: 'escalating',
          relatedEvents: ['Ongoing'],
        }),
      ],
    });

    resolveAndAddToGraph(raw, graph as never);

    const tensionCall = graph.addTension.mock.calls[0][0];
    expect(tensionCall.validTo).toBeUndefined();
  });

  it('handles empty raw extraction', () => {
    const graph = makeMockGraph();
    const result = resolveAndAddToGraph(makeRawExtraction(), graph as never);
    expect(result.entities).toHaveLength(0);
    expect(result.events).toHaveLength(0);
    expect(result.tensions).toHaveLength(0);
    expect(result.arcs).toHaveLength(0);
  });
});

// ---------- extractNarrative (integration with mocked OpenAI) ----------

describe('extractNarrative', () => {
  it('extracts from short text in a single chunk', async () => {
    const extraction = makeRawExtraction({
      characters: [makeChar('Alice')],
      events: [makeEvent('Arrival', { participants: ['Alice'] })],
      tensions: [],
      arcs: [],
    });

    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(extraction) } }],
    });

    const graph = makeMockGraph();
    const result = await extractNarrative('Alice arrived at the station.', graph as never);

    expect(result.entities).toHaveLength(1);
    expect(result.events).toHaveLength(1);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('calls progress callback at each stage', async () => {
    const extraction = makeRawExtraction({ characters: [makeChar('Alice')] });
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(extraction) } }],
    });

    const progress = vi.fn();
    const graph = makeMockGraph();

    await extractNarrative('Short text.', graph as never, progress);

    const stages = progress.mock.calls.map((call: Array<{ stage: string }>) => call[0].stage);
    expect(stages).toContain('chunking');
    expect(stages).toContain('extracting');
    expect(stages).toContain('merging');
    expect(stages).toContain('deduplicating');
    expect(stages).toContain('done');
  });

  it('handles multiple chunks for long text', async () => {
    const extraction = makeRawExtraction({ characters: [makeChar('Alice')] });
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(extraction) } }],
    });

    const graph = makeMockGraph();
    // Generate text long enough to require multiple chunks
    const paragraphs = Array.from({ length: 10 }, (_, i) => `Paragraph ${i}: ${'x'.repeat(2500)}`);
    const longText = paragraphs.join('\n\n');

    await extractNarrative(longText, graph as never);

    // Should have been called more than once (one per chunk)
    expect(mockCreate.mock.calls.length).toBeGreaterThan(1);
  });

  it('retries on LLM failure and succeeds', async () => {
    vi.useFakeTimers();

    const extraction = makeRawExtraction({ characters: [makeChar('Alice')] });

    mockCreate.mockRejectedValueOnce(new Error('rate limited')).mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(extraction) } }],
    });

    const graph = makeMockGraph();
    const promise = extractNarrative('Test retry.', graph as never);

    // Advance past the first retry delay (1000ms * 2^0 = 1000ms)
    await vi.advanceTimersByTimeAsync(1500);

    const result = await promise;
    expect(result.entities).toHaveLength(1);
    expect(mockCreate).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('throws ExtractionError after all retries exhausted', async () => {
    vi.useFakeTimers();

    mockCreate.mockRejectedValue(new Error('always fails'));

    const graph = makeMockGraph();
    let caughtError: Error | undefined;
    const promise = extractNarrative('Doomed text.', graph as never).catch((err: Error) => {
      caughtError = err;
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(caughtError).toBeInstanceOf(ExtractionError);
    expect(caughtError!.message).toContain('always fails');

    vi.useRealTimers();
  }, 15000);

  it('throws ExtractionError when LLM returns empty content', async () => {
    vi.useFakeTimers();

    mockCreate.mockResolvedValue({
      choices: [{ message: { content: null } }],
    });

    const graph = makeMockGraph();
    let caughtError: Error | undefined;
    const promise = extractNarrative('No response.', graph as never).catch((err: Error) => {
      caughtError = err;
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(caughtError).toBeInstanceOf(ExtractionError);
    expect(caughtError!.message).toContain('No response from LLM');

    vi.useRealTimers();
  }, 15000);

  it('parses JSON from markdown code blocks in LLM response', async () => {
    const extraction = makeRawExtraction({ characters: [makeChar('Bob')] });
    const wrappedResponse = `Here is the extraction:\n\`\`\`json\n${JSON.stringify(extraction)}\n\`\`\``;

    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: wrappedResponse } }],
    });

    const graph = makeMockGraph();
    const result = await extractNarrative('Text about Bob.', graph as never);

    expect(result.entities).toHaveLength(1);
    expect(result.entities[0].name).toBe('Bob');
  });
});

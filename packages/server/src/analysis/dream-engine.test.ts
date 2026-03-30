import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type {
  DreamBranch,
  GraphSnapshot,
  Entity,
  NarrativeEvent,
  Tension,
  NarrativeArc,
} from '../graph/types.js';

// ============================================================
// Mock OpenAI before importing the module under test
// ============================================================

const mockCreate = vi.fn();

vi.mock('openai', () => {
  const MockOpenAI = function () {
    return {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    };
  };
  return { default: MockOpenAI };
});

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uuid-0001'),
}));

import {
  generateDreams,
  generateDreamAnalysis,
  generateForStrategy,
  callLLMWithRetry,
  buildStateDescription,
  buildStrategyPrompt,
  normalizeProbabilities,
  applyMotivationAlignment,
  checkConstraints,
  validateTemporalCoherence,
  analyzeInterBranchDependencies,
  parseJsonResponse,
  similarText,
  clamp,
  sleep,
} from './dream-engine.js';
import { TemporalGraph } from '../graph/temporal-graph.js';
import { DreamGenerationError } from '../errors/index.js';

// ============================================================
// Dream Engine — Tests
// ============================================================

// --- Helpers ---

function makeBranch(overrides: Partial<DreamBranch> = {}): DreamBranch {
  return {
    id: 'branch-1',
    title: 'Default Branch',
    narrative: 'A default narrative for testing purposes.',
    probability: 0.5,
    triggerEvents: ['event-a'],
    consequences: ['consequence-a'],
    affectedEntities: ['Alice'],
    strategy: 'conservative',
    motivationAlignment: undefined,
    temporallyCoherent: undefined,
    ...overrides,
  };
}

function makeEntity(overrides: Partial<Entity> = {}): Entity {
  return {
    id: 'entity-1',
    name: 'Alice',
    type: 'person',
    motivation: 'Seeks power and control over the territory',
    capability: 'Political influence',
    alliances: [],
    description: 'A protagonist',
    firstSeen: '2023-11-17T00:00:00Z',
    lastSeen: '2023-11-22T00:00:00Z',
    ...overrides,
  };
}

function makeEvent(overrides: Partial<NarrativeEvent> = {}): NarrativeEvent {
  return {
    id: 'event-1',
    title: 'The Summit',
    description: 'Leaders gather',
    timestamp: '2023-11-17T12:00:00Z',
    participants: [],
    causalPredecessors: [],
    impact: 0.5,
    sentiment: 0,
    ...overrides,
  };
}

function makeTension(overrides: Partial<Tension> = {}): Tension {
  return {
    id: 'tension-1',
    name: 'Border Dispute',
    description: 'A territorial conflict',
    parties: ['entity-1', 'entity-2'],
    status: 'simmering',
    intensity: 0.5,
    duration: 5,
    relatedEvents: [],
    validFrom: '2023-11-17T00:00:00Z',
    ...overrides,
  };
}

function makeArc(overrides: Partial<NarrativeArc> = {}): NarrativeArc {
  return {
    id: 'arc-1',
    name: 'Rise to Power',
    description: 'A quest for dominance',
    phase: 'rising_action',
    characters: [],
    events: [],
    tensions: [],
    startDate: '2023-11-01T00:00:00Z',
    ...overrides,
  };
}

function makeSnapshot(overrides: Partial<GraphSnapshot> = {}): GraphSnapshot {
  return {
    entities: [makeEntity()],
    events: [makeEvent()],
    tensions: [makeTension()],
    arcs: [makeArc()],
    timestamp: '2023-11-22T00:00:00Z',
    ...overrides,
  };
}

function makeLLMResponse(branches: unknown[]): unknown {
  return {
    choices: [
      {
        message: {
          content: JSON.stringify(branches),
        },
      },
    ],
  };
}

const sampleRawBranches = [
  {
    title: 'Alliance Shift',
    narrative: 'Alice forms new alliances seeking power in the territory.',
    probability: 0.6,
    triggerEvents: ['The Summit'],
    consequences: ['New coalition formed'],
    affectedEntities: ['Alice'],
  },
];

// ============================================================
// Tests
// ============================================================

describe('Dream Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ----------------------------------------------------------
  // Utility functions
  // ----------------------------------------------------------

  describe('clamp', () => {
    it('should return value when within range', () => {
      expect(clamp(0.5, 0, 1)).toBe(0.5);
    });

    it('should clamp to min when below range', () => {
      expect(clamp(-0.5, 0, 1)).toBe(0);
    });

    it('should clamp to max when above range', () => {
      expect(clamp(1.5, 0, 1)).toBe(1);
    });

    it('should handle equal min/max', () => {
      expect(clamp(5, 3, 3)).toBe(3);
    });

    it('should handle negative ranges', () => {
      expect(clamp(-5, -10, -1)).toBe(-5);
      expect(clamp(0, -10, -1)).toBe(-1);
    });
  });

  describe('sleep', () => {
    it('should resolve after the specified delay', async () => {
      const promise = sleep(1000);
      vi.advanceTimersByTime(1000);
      await expect(promise).resolves.toBeUndefined();
    });

    it('should not resolve before the delay', async () => {
      let resolved = false;
      sleep(1000).then(() => {
        resolved = true;
      });
      vi.advanceTimersByTime(500);
      await Promise.resolve(); // flush microtasks
      expect(resolved).toBe(false);
    });
  });

  describe('similarText', () => {
    it('should return true for texts with significant word overlap', () => {
      expect(
        similarText(
          'The alliance broke apart dramatically',
          'Their alliance dramatically shattered apart'
        )
      ).toBe(true);
    });

    it('should return false for texts with no overlap', () => {
      expect(similarText('The weather is sunny today', 'Political crisis erupts downtown')).toBe(
        false
      );
    });

    it('should ignore short words (4 chars or fewer)', () => {
      // Only short words — should return false since no words > 4 chars match
      expect(similarText('the and for', 'the and for')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(similarText('ALLIANCE BROKEN', 'alliance broken')).toBe(true);
    });

    it('should return false for empty strings', () => {
      expect(similarText('', '')).toBe(false);
    });

    it('should return false when one string is empty', () => {
      expect(similarText('some meaningful words here', '')).toBe(false);
    });
  });

  describe('parseJsonResponse', () => {
    it('should parse valid JSON directly', () => {
      const data = [{ title: 'test' }];
      expect(parseJsonResponse(JSON.stringify(data))).toEqual(data);
    });

    it('should extract JSON from markdown code block with json tag', () => {
      const data = [{ title: 'test' }];
      const wrapped = '```json\n' + JSON.stringify(data) + '\n```';
      expect(parseJsonResponse(wrapped)).toEqual(data);
    });

    it('should extract JSON from markdown code block without json tag', () => {
      const data = { key: 'value' };
      const wrapped = '```\n' + JSON.stringify(data) + '\n```';
      expect(parseJsonResponse(wrapped)).toEqual(data);
    });

    it('should throw DreamGenerationError for unparseable content', () => {
      expect(() => parseJsonResponse('not json at all')).toThrow(DreamGenerationError);
    });

    it('should throw DreamGenerationError for empty code blocks', () => {
      expect(() => parseJsonResponse('```json\nnot valid json\n```')).toThrow();
    });

    it('should handle nested objects', () => {
      const data = { branches: [{ title: 'A', nested: { deep: true } }] };
      expect(parseJsonResponse(JSON.stringify(data))).toEqual(data);
    });
  });

  // ----------------------------------------------------------
  // normalizeProbabilities
  // ----------------------------------------------------------

  describe('normalizeProbabilities', () => {
    it('should normalize probabilities to sum to 1', () => {
      const branches = [makeBranch({ probability: 0.3 }), makeBranch({ probability: 0.7 })];
      normalizeProbabilities(branches);
      const sum = branches.reduce((s, b) => s + b.probability, 0);
      expect(sum).toBeCloseTo(1.0);
    });

    it('should preserve relative ordering', () => {
      const branches = [
        makeBranch({ probability: 0.2 }),
        makeBranch({ probability: 0.8 }),
        makeBranch({ probability: 0.5 }),
      ];
      normalizeProbabilities(branches);
      expect(branches[1].probability).toBeGreaterThan(branches[2].probability);
      expect(branches[2].probability).toBeGreaterThan(branches[0].probability);
    });

    it('should handle empty array', () => {
      const branches: DreamBranch[] = [];
      normalizeProbabilities(branches);
      expect(branches).toEqual([]);
    });

    it('should use uniform distribution when sum is zero', () => {
      const branches = [makeBranch({ probability: 0 }), makeBranch({ probability: 0 })];
      normalizeProbabilities(branches);
      expect(branches[0].probability).toBe(0.5);
      expect(branches[1].probability).toBe(0.5);
    });

    it('should use uniform distribution when all probabilities are negative', () => {
      const branches = [makeBranch({ probability: -0.5 }), makeBranch({ probability: -0.3 })];
      normalizeProbabilities(branches);
      expect(branches[0].probability).toBe(0.5);
      expect(branches[1].probability).toBe(0.5);
    });

    it('should handle single branch', () => {
      const branches = [makeBranch({ probability: 0.3 })];
      normalizeProbabilities(branches);
      expect(branches[0].probability).toBeCloseTo(1.0);
    });
  });

  // ----------------------------------------------------------
  // applyMotivationAlignment
  // ----------------------------------------------------------

  describe('applyMotivationAlignment', () => {
    it('should score high when narrative matches entity motivation', () => {
      const entity = makeEntity({
        name: 'Alice',
        motivation: 'Seeks power and control over the territory',
      });
      const branch = makeBranch({
        narrative: 'Alice consolidates power and takes control of the territory.',
        affectedEntities: ['Alice'],
      });
      const snapshot = makeSnapshot({ entities: [entity] });

      applyMotivationAlignment([branch], snapshot);
      expect(branch.motivationAlignment).toBeGreaterThan(0.5);
    });

    it('should score low when narrative does not match motivation', () => {
      const entity = makeEntity({
        name: 'Alice',
        motivation: 'Seeks power and control over the territory',
      });
      const branch = makeBranch({
        narrative: 'The weather was beautiful and birds sang happily.',
        affectedEntities: ['Alice'],
      });
      const snapshot = makeSnapshot({ entities: [entity] });

      applyMotivationAlignment([branch], snapshot);
      expect(branch.motivationAlignment).toBeLessThan(0.5);
    });

    it('should default to 0.5 when no affected entities match', () => {
      const branch = makeBranch({ affectedEntities: ['UnknownEntity'] });
      const snapshot = makeSnapshot({ entities: [makeEntity()] });

      applyMotivationAlignment([branch], snapshot);
      expect(branch.motivationAlignment).toBe(0.5);
    });

    it('should match entities case-insensitively', () => {
      const entity = makeEntity({ name: 'Alice', motivation: 'power dominance control' });
      const branch = makeBranch({
        narrative: 'alice seizes power and dominance',
        affectedEntities: ['alice'],
      });
      const snapshot = makeSnapshot({ entities: [entity] });

      applyMotivationAlignment([branch], snapshot);
      expect(branch.motivationAlignment).toBeGreaterThan(0);
    });

    it('should match entities by id', () => {
      const entity = makeEntity({
        id: 'ent-42',
        name: 'Alice',
        motivation: 'power dominance control',
      });
      const branch = makeBranch({
        narrative: 'She seizes power through dominance and control.',
        affectedEntities: ['ent-42'],
      });
      const snapshot = makeSnapshot({ entities: [entity] });

      applyMotivationAlignment([branch], snapshot);
      expect(branch.motivationAlignment).toBeGreaterThan(0.5);
    });

    it('should handle empty branches array', () => {
      const snapshot = makeSnapshot();
      applyMotivationAlignment([], snapshot);
      // No error thrown
    });

    it('should average alignment across multiple affected entities', () => {
      const alice = makeEntity({
        id: 'e1',
        name: 'Alice',
        motivation: 'power control territory',
      });
      const bob = makeEntity({
        id: 'e2',
        name: 'Bob',
        motivation: 'peace harmony cooperation',
      });
      const branch = makeBranch({
        narrative: 'Alice seizes power and control of the territory while Bob watches.',
        affectedEntities: ['Alice', 'Bob'],
      });
      const snapshot = makeSnapshot({ entities: [alice, bob] });

      applyMotivationAlignment([branch], snapshot);
      // Alice matches well, Bob doesn't — average should be moderate
      expect(branch.motivationAlignment).toBeDefined();
      expect(branch.motivationAlignment!).toBeGreaterThan(0);
      expect(branch.motivationAlignment!).toBeLessThan(1);
    });
  });

  // ----------------------------------------------------------
  // checkConstraints
  // ----------------------------------------------------------

  describe('checkConstraints', () => {
    let graph: TemporalGraph;

    beforeEach(() => {
      graph = new TemporalGraph();
    });

    it('should flag branches referencing resolved tensions as active', () => {
      const snapshot = makeSnapshot({
        tensions: [makeTension({ name: 'border dispute', status: 'resolved' })],
        entities: [makeEntity()],
      });
      const branch = makeBranch({
        narrative: 'The border dispute escalates into open conflict.',
        affectedEntities: ['Alice'],
      });

      const violations = checkConstraints([branch], snapshot, graph);
      expect(violations.some((v) => v.violation.includes('resolved tension'))).toBe(true);
    });

    it('should not flag resolved tensions that are merely mentioned', () => {
      const snapshot = makeSnapshot({
        tensions: [makeTension({ name: 'border dispute', status: 'resolved' })],
        entities: [makeEntity()],
      });
      const branch = makeBranch({
        narrative: 'In the aftermath of the border dispute, peace reigns.',
        affectedEntities: ['Alice'],
      });

      const violations = checkConstraints([branch], snapshot, graph);
      expect(violations.some((v) => v.violation.includes('resolved tension'))).toBe(false);
    });

    it('should flag branches referencing unknown entities', () => {
      const snapshot = makeSnapshot({
        entities: [makeEntity({ name: 'Alice' })],
        tensions: [],
      });
      const branch = makeBranch({
        affectedEntities: ['NonExistentCharacter'],
      });

      const violations = checkConstraints([branch], snapshot, graph);
      expect(violations.some((v) => v.violation.includes('unknown entity'))).toBe(true);
    });

    it('should not flag known entities', () => {
      const snapshot = makeSnapshot({
        entities: [makeEntity({ name: 'Alice' })],
        tensions: [],
      });
      const branch = makeBranch({
        affectedEntities: ['Alice'],
        triggerEvents: ['something'],
      });

      const violations = checkConstraints([branch], snapshot, graph);
      expect(violations.some((v) => v.violation.includes('unknown entity'))).toBe(false);
    });

    it('should flag branches with no trigger events', () => {
      const snapshot = makeSnapshot({ tensions: [] });
      const branch = makeBranch({
        triggerEvents: [],
        affectedEntities: ['Alice'],
      });

      const violations = checkConstraints([branch], snapshot, graph);
      expect(violations.some((v) => v.violation.includes('No trigger events'))).toBe(true);
      expect(violations.find((v) => v.violation.includes('No trigger events'))!.severity).toBe(0.3);
    });

    it('should return empty array when no violations', () => {
      const snapshot = makeSnapshot({ tensions: [] });
      const branch = makeBranch({
        affectedEntities: ['Alice'],
        triggerEvents: ['event-a'],
      });

      const violations = checkConstraints([branch], snapshot, graph);
      expect(violations).toEqual([]);
    });

    it('should handle multiple violations for a single branch', () => {
      const snapshot = makeSnapshot({
        tensions: [makeTension({ name: 'trade war', status: 'resolved' })],
        entities: [makeEntity({ name: 'Alice' })],
      });
      const branch = makeBranch({
        narrative: 'The trade war escalates and Unknown joins the fight.',
        affectedEntities: ['UnknownChar'],
        triggerEvents: [],
      });

      const violations = checkConstraints([branch], snapshot, graph);
      expect(violations.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ----------------------------------------------------------
  // validateTemporalCoherence
  // ----------------------------------------------------------

  describe('validateTemporalCoherence', () => {
    it('should mark all branches as coherent when no events exist', () => {
      const branch = makeBranch();
      const snapshot = makeSnapshot({ events: [] });

      validateTemporalCoherence([branch], snapshot);
      expect(branch.temporallyCoherent).toBe(true);
    });

    it('should mark branch as coherent when no past-tense patterns found', () => {
      const branch = makeBranch({
        narrative: 'Alice leads the negotiation to a breakthrough.',
      });
      const snapshot = makeSnapshot();

      validateTemporalCoherence([branch], snapshot);
      expect(branch.temporallyCoherent).toBe(true);
    });

    it('should mark branch as incoherent when it uses past-tense for future events', () => {
      const branch = makeBranch({
        narrative: 'The alliance had already collapsed years ago.',
        triggerEvents: ['unrelated trigger'],
      });
      const snapshot = makeSnapshot({
        events: [makeEvent({ title: 'Recent Meeting' })],
      });

      validateTemporalCoherence([branch], snapshot);
      expect(branch.temporallyCoherent).toBe(false);
    });

    it('should allow past references if trigger events reference recent context', () => {
      const branch = makeBranch({
        narrative: 'The tension had already been building long before the summit.',
        triggerEvents: ['Following The Summit developments'],
      });
      const snapshot = makeSnapshot({
        events: [makeEvent({ title: 'The Summit' })],
      });

      validateTemporalCoherence([branch], snapshot);
      expect(branch.temporallyCoherent).toBe(true);
    });

    it('should detect multiple past-tense patterns', () => {
      const pastPatterns = ['had already', 'years ago', 'long before', 'back when'];
      for (const pattern of pastPatterns) {
        const branch = makeBranch({
          narrative: `Something happened ${pattern} the story began.`,
          triggerEvents: ['no context match'],
        });
        const snapshot = makeSnapshot({
          events: [makeEvent({ title: 'Unique Event XYZ' })],
        });

        validateTemporalCoherence([branch], snapshot);
        expect(branch.temporallyCoherent).toBe(false);
      }
    });
  });

  // ----------------------------------------------------------
  // analyzeInterBranchDependencies
  // ----------------------------------------------------------

  describe('analyzeInterBranchDependencies', () => {
    it('should return empty array for branches with no shared entities', () => {
      const branches = [
        makeBranch({ id: 'b1', affectedEntities: ['Alice'] }),
        makeBranch({ id: 'b2', affectedEntities: ['Bob'] }),
      ];

      expect(analyzeInterBranchDependencies(branches)).toEqual([]);
    });

    it('should detect when one branch triggers another', () => {
      const branches = [
        makeBranch({
          id: 'b1',
          title: 'Alliance Forms',
          affectedEntities: ['Alice'],
          consequences: ['The coalition gains significant momentum forward'],
          triggerEvents: ['event-a'],
        }),
        makeBranch({
          id: 'b2',
          title: 'Power Shift',
          affectedEntities: ['Alice'],
          triggerEvents: ['The coalition gains significant momentum forward'],
          consequences: ['result-b'],
        }),
      ];

      const deps = analyzeInterBranchDependencies(branches);
      expect(deps.length).toBeGreaterThan(0);
      expect(deps.some((d) => d.relationship.includes('could trigger'))).toBe(true);
    });

    it('should detect mutually exclusive branches (shared entities, no triggers)', () => {
      const branches = [
        makeBranch({
          id: 'b1',
          title: 'Peace',
          affectedEntities: ['Alice'],
          consequences: ['peace reigns'],
          triggerEvents: ['event-a'],
        }),
        makeBranch({
          id: 'b2',
          title: 'War',
          affectedEntities: ['Alice'],
          consequences: ['war breaks out'],
          triggerEvents: ['event-b'],
        }),
      ];

      const deps = analyzeInterBranchDependencies(branches);
      expect(deps.some((d) => d.relationship.includes('mutually exclusive'))).toBe(true);
    });

    it('should handle single branch', () => {
      expect(analyzeInterBranchDependencies([makeBranch()])).toEqual([]);
    });

    it('should handle empty array', () => {
      expect(analyzeInterBranchDependencies([])).toEqual([]);
    });

    it('should be case insensitive for entity matching', () => {
      const branches = [
        makeBranch({
          id: 'b1',
          affectedEntities: ['Alice'],
          consequences: ['x'],
          triggerEvents: ['y'],
        }),
        makeBranch({
          id: 'b2',
          affectedEntities: ['alice'],
          consequences: ['x'],
          triggerEvents: ['y'],
        }),
      ];

      const deps = analyzeInterBranchDependencies(branches);
      expect(deps.length).toBeGreaterThan(0);
    });
  });

  // ----------------------------------------------------------
  // buildStateDescription
  // ----------------------------------------------------------

  describe('buildStateDescription', () => {
    it('should include strategy-specific instruction for conservative', () => {
      const snapshot = makeSnapshot();
      const desc = buildStateDescription(snapshot, 'conservative');
      const parsed = JSON.parse(desc);
      expect(parsed.instruction).toContain('most likely');
    });

    it('should include strategy-specific instruction for wild_card', () => {
      const snapshot = makeSnapshot();
      const desc = buildStateDescription(snapshot, 'wild_card');
      const parsed = JSON.parse(desc);
      expect(parsed.instruction).toContain('unlikely but plausible');
    });

    it('should include strategy-specific instruction for pattern_based', () => {
      const snapshot = makeSnapshot();
      const desc = buildStateDescription(snapshot, 'pattern_based');
      const parsed = JSON.parse(desc);
      expect(parsed.instruction).toContain('recurring patterns');
    });

    it('should include characters, events, tensions, and arcs', () => {
      const snapshot = makeSnapshot();
      const desc = buildStateDescription(snapshot, 'conservative');
      const parsed = JSON.parse(desc);
      expect(parsed.characters).toHaveLength(1);
      expect(parsed.characters[0].name).toBe('Alice');
      expect(parsed.activeTensions).toBeDefined();
      expect(parsed.arcs).toBeDefined();
    });

    it('should only include last 10 events', () => {
      const events: NarrativeEvent[] = [];
      for (let i = 0; i < 15; i++) {
        events.push(makeEvent({ id: `e-${i}`, title: `Event ${i}` }));
      }
      const snapshot = makeSnapshot({ events });
      const desc = buildStateDescription(snapshot, 'conservative');
      const parsed = JSON.parse(desc);
      expect(parsed.recentEvents).toHaveLength(10);
      expect(parsed.recentEvents[0].title).toBe('Event 5');
    });

    it('should filter out resolved tensions', () => {
      const snapshot = makeSnapshot({
        tensions: [
          makeTension({ name: 'Active', status: 'escalating' }),
          makeTension({ name: 'Done', status: 'resolved' }),
        ],
      });
      const desc = buildStateDescription(snapshot, 'conservative');
      const parsed = JSON.parse(desc);
      expect(parsed.activeTensions).toHaveLength(1);
      expect(parsed.activeTensions[0].name).toBe('Active');
    });
  });

  // ----------------------------------------------------------
  // buildStrategyPrompt
  // ----------------------------------------------------------

  describe('buildStrategyPrompt', () => {
    it('should include the state description in the prompt', () => {
      const prompt = buildStrategyPrompt('conservative', 'test-state-data');
      expect(prompt).toContain('test-state-data');
    });

    it('should include conservative instructions', () => {
      const prompt = buildStrategyPrompt('conservative', '{}');
      expect(prompt).toContain('CONSERVATIVE');
      expect(prompt).toContain('0.3-0.7');
    });

    it('should include wild_card instructions', () => {
      const prompt = buildStrategyPrompt('wild_card', '{}');
      expect(prompt).toContain('WILD CARD');
      expect(prompt).toContain('0.05-0.25');
    });

    it('should include pattern_based instructions', () => {
      const prompt = buildStrategyPrompt('pattern_based', '{}');
      expect(prompt).toContain('PATTERN-BASED');
      expect(prompt).toContain('0.15-0.45');
    });
  });

  // ----------------------------------------------------------
  // callLLMWithRetry
  // ----------------------------------------------------------

  describe('callLLMWithRetry', () => {
    it('should return parsed branches on successful call', async () => {
      mockCreate.mockResolvedValueOnce(makeLLMResponse(sampleRawBranches));

      const result = await callLLMWithRetry('test prompt');
      expect(result).toEqual(sampleRawBranches);
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed on later attempt', async () => {
      mockCreate
        .mockRejectedValueOnce(new Error('rate limit'))
        .mockResolvedValueOnce(makeLLMResponse(sampleRawBranches));

      const promise = callLLMWithRetry('test prompt');
      // Advance past the retry delay (1000ms * 2^0 = 1000ms)
      await vi.advanceTimersByTimeAsync(1500);

      const result = await promise;
      expect(result).toEqual(sampleRawBranches);
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should throw DreamGenerationError after all retries exhausted', async () => {
      mockCreate.mockRejectedValue(new Error('persistent failure'));

      const promise = callLLMWithRetry('test prompt');
      // Attach rejection handler BEFORE advancing timers to avoid unhandled rejection
      const assertion = expect(promise).rejects.toThrow(DreamGenerationError);
      await vi.runAllTimersAsync();
      await assertion;
      expect(mockCreate).toHaveBeenCalledTimes(4); // initial + 3 retries
    });

    it('should throw when LLM returns no content', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      const promise = callLLMWithRetry('test prompt');
      const assertion = expect(promise).rejects.toThrow(DreamGenerationError);
      await vi.runAllTimersAsync();
      await assertion;
    });

    it('should use exponential backoff between retries', async () => {
      mockCreate
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValueOnce(makeLLMResponse(sampleRawBranches));

      const promise = callLLMWithRetry('test prompt');

      // First retry after 1000ms (1000 * 2^0)
      await vi.advanceTimersByTimeAsync(1000);
      expect(mockCreate).toHaveBeenCalledTimes(2);

      // Second retry after 2000ms (1000 * 2^1)
      await vi.advanceTimersByTimeAsync(2000);

      const result = await promise;
      expect(result).toEqual(sampleRawBranches);
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });
  });

  // ----------------------------------------------------------
  // generateForStrategy
  // ----------------------------------------------------------

  describe('generateForStrategy', () => {
    let graph: TemporalGraph;

    beforeEach(() => {
      graph = new TemporalGraph();
    });

    it('should return branches with correct strategy tag', async () => {
      mockCreate.mockResolvedValueOnce(makeLLMResponse(sampleRawBranches));

      const snapshot = makeSnapshot();
      const result = await generateForStrategy(snapshot, 'wild_card', graph);

      expect(result.branches).toHaveLength(1);
      expect(result.branches[0].strategy).toBe('wild_card');
      expect(result.retries).toBe(0);
    });

    it('should clamp probability to [0, 1]', async () => {
      const rawBranches = [{ ...sampleRawBranches[0], probability: 1.5 }];
      mockCreate.mockResolvedValueOnce(makeLLMResponse(rawBranches));

      const snapshot = makeSnapshot();
      const result = await generateForStrategy(snapshot, 'conservative', graph);
      expect(result.branches[0].probability).toBe(1);
    });

    it('should default missing arrays to empty', async () => {
      const rawBranches = [{ title: 'Minimal', narrative: 'Minimal narrative', probability: 0.5 }];
      mockCreate.mockResolvedValueOnce(makeLLMResponse(rawBranches));

      const snapshot = makeSnapshot();
      const result = await generateForStrategy(snapshot, 'pattern_based', graph);
      expect(result.branches[0].triggerEvents).toEqual([]);
      expect(result.branches[0].consequences).toEqual([]);
      expect(result.branches[0].affectedEntities).toEqual([]);
    });

    it('should assign uuid to each branch', async () => {
      mockCreate.mockResolvedValueOnce(makeLLMResponse(sampleRawBranches));
      const snapshot = makeSnapshot();
      const result = await generateForStrategy(snapshot, 'conservative', graph);
      expect(result.branches[0].id).toBe('test-uuid-0001');
    });
  });

  // ----------------------------------------------------------
  // generateDreamAnalysis (integration)
  // ----------------------------------------------------------

  describe('generateDreamAnalysis', () => {
    let graph: TemporalGraph;

    beforeEach(() => {
      graph = new TemporalGraph();
      graph.addEntity({
        name: 'Alice',
        type: 'person',
        motivation: 'Seeks power and control',
        capability: 'Political influence',
        alliances: [],
        description: 'Protagonist',
        firstSeen: '2023-11-17T00:00:00Z',
        lastSeen: '2023-11-22T00:00:00Z',
      });
      graph.addEvent({
        title: 'The Summit',
        description: 'Leaders gather',
        timestamp: '2023-11-17T12:00:00Z',
        participants: [],
        causalPredecessors: [],
        impact: 0.5,
        sentiment: 0,
      });
    });

    it('should generate branches for all default strategies', async () => {
      // 3 strategies, each returns 1 branch
      mockCreate.mockResolvedValue(makeLLMResponse(sampleRawBranches));

      const analysis = await generateDreamAnalysis(graph);
      expect(analysis.branches.length).toBe(3);
      expect(analysis.metadata.strategies).toEqual(['conservative', 'wild_card', 'pattern_based']);
    });

    it('should accept custom strategies', async () => {
      mockCreate.mockResolvedValue(makeLLMResponse(sampleRawBranches));

      const analysis = await generateDreamAnalysis(graph, ['wild_card']);
      expect(analysis.branches.length).toBe(1);
      expect(analysis.metadata.strategies).toEqual(['wild_card']);
    });

    it('should sort branches by probability descending', async () => {
      const multiBranches = [
        { ...sampleRawBranches[0], probability: 0.2 },
        { ...sampleRawBranches[0], title: 'High Prob', probability: 0.8 },
      ];
      mockCreate.mockResolvedValue(makeLLMResponse(multiBranches));

      const analysis = await generateDreamAnalysis(graph, ['conservative']);
      expect(analysis.branches[0].probability).toBeGreaterThanOrEqual(
        analysis.branches[1].probability
      );
    });

    it('should include constraint violations', async () => {
      const branchesWithNoTrigger = [
        {
          ...sampleRawBranches[0],
          triggerEvents: [],
          affectedEntities: ['UnknownChar'],
        },
      ];
      mockCreate.mockResolvedValue(makeLLMResponse(branchesWithNoTrigger));

      const analysis = await generateDreamAnalysis(graph, ['conservative']);
      expect(analysis.constraintViolations.length).toBeGreaterThan(0);
    });

    it('should include generation metadata with timing', async () => {
      mockCreate.mockResolvedValue(makeLLMResponse(sampleRawBranches));

      const analysis = await generateDreamAnalysis(graph, ['conservative']);
      expect(analysis.metadata.generationTimeMs).toBeGreaterThanOrEqual(0);
      expect(analysis.metadata.retryCount).toBe(0);
    });

    it('should include inter-branch dependencies', async () => {
      mockCreate.mockResolvedValue(makeLLMResponse(sampleRawBranches));

      const analysis = await generateDreamAnalysis(graph);
      expect(analysis.interBranchDependencies).toBeDefined();
      expect(Array.isArray(analysis.interBranchDependencies)).toBe(true);
    });
  });

  // ----------------------------------------------------------
  // generateDreams (backward-compatible API)
  // ----------------------------------------------------------

  describe('generateDreams', () => {
    let graph: TemporalGraph;

    beforeEach(() => {
      graph = new TemporalGraph();
      graph.addEntity({
        name: 'Alice',
        type: 'person',
        motivation: 'Seeks power',
        capability: 'Politics',
        alliances: [],
        description: 'Test',
        firstSeen: '2023-11-17T00:00:00Z',
        lastSeen: '2023-11-22T00:00:00Z',
      });
      graph.addEvent({
        title: 'Event',
        description: 'Desc',
        timestamp: '2023-11-17T12:00:00Z',
        participants: [],
        causalPredecessors: [],
        impact: 0.5,
        sentiment: 0,
      });
    });

    it('should return DreamBranch[] directly', async () => {
      mockCreate.mockResolvedValue(makeLLMResponse(sampleRawBranches));

      const branches = await generateDreams(graph);
      expect(Array.isArray(branches)).toBe(true);
      expect(branches.length).toBeGreaterThan(0);
      expect(branches[0]).toHaveProperty('title');
      expect(branches[0]).toHaveProperty('narrative');
      expect(branches[0]).toHaveProperty('probability');
    });
  });
});

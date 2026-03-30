import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { DreamBranch } from '../graph/types.js';

// ============================================================
// Mock OpenAI before importing
// ============================================================

const mockCreate = vi.fn();

vi.mock('openai', () => {
  const MockOpenAI = function () {
    return {
      chat: { completions: { create: mockCreate } },
    };
  };
  return { default: MockOpenAI };
});

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'edge-uuid-0001'),
}));

import {
  generateDreams,
  generateDreamAnalysis,
  normalizeProbabilities,
  checkConstraints,
  validateTemporalCoherence,
  analyzeInterBranchDependencies,
  parseJsonResponse,
} from './dream-engine.js';
import { TemporalGraph } from '../graph/temporal-graph.js';
import { DreamGenerationError } from '../errors/index.js';

// ============================================================
// Dream Engine — Edge Case Tests
// ============================================================

function makeLLMResponse(branches: unknown[]): unknown {
  return {
    choices: [{ message: { content: JSON.stringify(branches) } }],
  };
}

const sampleRawBranches = [
  {
    title: 'Future Branch',
    narrative: 'Something important happens.',
    probability: 0.5,
    triggerEvents: ['Event A'],
    consequences: ['Outcome X'],
    affectedEntities: ['Alice'],
  },
];

describe('Dream Engine — Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --------------------------------------------------------
  // Empty graph
  // --------------------------------------------------------

  describe('empty graph', () => {
    it('should generate dreams for empty graph without error', async () => {
      const graph = new TemporalGraph();
      mockCreate.mockResolvedValue(makeLLMResponse(sampleRawBranches));

      const branches = await generateDreams(graph);
      expect(Array.isArray(branches)).toBe(true);
    });

    it('should generate analysis for empty graph', async () => {
      const graph = new TemporalGraph();
      mockCreate.mockResolvedValue(makeLLMResponse(sampleRawBranches));

      const analysis = await generateDreamAnalysis(graph, ['conservative']);
      expect(analysis.branches.length).toBeGreaterThan(0);
      expect(analysis.metadata.strategies).toEqual(['conservative']);
    });

    it('should have no constraint violations for empty graph branches', async () => {
      const graph = new TemporalGraph();
      mockCreate.mockResolvedValue(
        makeLLMResponse([
          {
            title: 'Empty Graph Dream',
            narrative: 'Something from nothing.',
            probability: 0.5,
            triggerEvents: ['genesis'],
            consequences: ['creation'],
            affectedEntities: [],
          },
        ])
      );

      const analysis = await generateDreamAnalysis(graph, ['conservative']);
      // No entities to violate constraints against
      const entityViolations = analysis.constraintViolations.filter((v) =>
        v.violation.includes('unknown entity')
      );
      expect(entityViolations).toHaveLength(0);
    });
  });

  // --------------------------------------------------------
  // Single entity graph
  // --------------------------------------------------------

  describe('single entity graph', () => {
    let graph: TemporalGraph;

    beforeEach(() => {
      graph = new TemporalGraph();
      graph.addEntity({
        name: 'Solo',
        type: 'person',
        motivation: 'Survival in isolation',
        capability: 'Resilience',
        alliances: [],
        description: 'The only entity',
        firstSeen: '2023-01-01T00:00:00Z',
        lastSeen: '2023-12-31T00:00:00Z',
      });
    });

    it('should generate dreams with single entity', async () => {
      mockCreate.mockResolvedValue(makeLLMResponse(sampleRawBranches));
      const branches = await generateDreams(graph);
      expect(branches.length).toBeGreaterThan(0);
    });

    it('should handle single entity with no events', async () => {
      mockCreate.mockResolvedValue(
        makeLLMResponse([
          {
            title: 'Solo Journey',
            narrative: 'Solo embarks on a personal quest.',
            probability: 0.7,
            triggerEvents: ['inner conflict'],
            consequences: ['self-discovery'],
            affectedEntities: ['Solo'],
          },
        ])
      );

      const analysis = await generateDreamAnalysis(graph, ['conservative']);
      expect(analysis.branches.length).toBe(1);
      expect(analysis.branches[0].affectedEntities).toContain('Solo');
    });
  });

  // --------------------------------------------------------
  // Graph with 100+ entities
  // --------------------------------------------------------

  describe('100+ entities graph', () => {
    let graph: TemporalGraph;

    beforeEach(() => {
      graph = new TemporalGraph();
      const entityIds: string[] = [];

      for (let i = 0; i < 120; i++) {
        const entity = graph.addEntity({
          name: `Entity-${i}`,
          type: i % 3 === 0 ? 'person' : i % 3 === 1 ? 'company' : 'institution',
          motivation: `Goal ${i}`,
          capability: `Skill ${i}`,
          alliances: [],
          description: `Entity number ${i}`,
          firstSeen: '2023-01-01T00:00:00Z',
          lastSeen: '2023-12-31T00:00:00Z',
        });
        entityIds.push(entity.id);
      }

      // Add some events connecting entities
      for (let i = 0; i < 50; i++) {
        graph.addEvent({
          title: `Event-${i}`,
          description: `Something involving entities`,
          timestamp: new Date(2023, 0, 1 + i).toISOString(),
          participants: [entityIds[i], entityIds[(i + 1) % entityIds.length]],
          causalPredecessors: [],
          impact: Math.random(),
          sentiment: Math.random() * 2 - 1,
        });
      }

      // Add some tensions
      for (let i = 0; i < 20; i++) {
        graph.addTension({
          name: `Tension-${i}`,
          description: `Conflict ${i}`,
          parties: [entityIds[i * 2], entityIds[i * 2 + 1]],
          status: i % 2 === 0 ? 'escalating' : 'simmering',
          intensity: 0.5 + Math.random() * 0.5,
          duration: 30 + i * 10,
          relatedEvents: [],
          validFrom: '2023-01-01T00:00:00Z',
        });
      }
    });

    it('should handle 120 entities without error', async () => {
      mockCreate.mockResolvedValue(makeLLMResponse(sampleRawBranches));
      const analysis = await generateDreamAnalysis(graph, ['conservative']);
      expect(analysis.branches.length).toBeGreaterThan(0);
      expect(analysis.metadata.generationTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should correctly validate constraints with many entities', async () => {
      mockCreate.mockResolvedValue(
        makeLLMResponse([
          {
            title: 'Mass Event',
            narrative: 'Entity-0 leads a coalition of 100 entities.',
            probability: 0.4,
            triggerEvents: ['Event-0'],
            consequences: ['Mass realignment'],
            affectedEntities: ['Entity-0', 'Entity-1', 'NonExistent-Entity'],
          },
        ])
      );

      const analysis = await generateDreamAnalysis(graph, ['conservative']);
      // Should flag NonExistent-Entity as unknown
      const unknownViolations = analysis.constraintViolations.filter((v) =>
        v.violation.includes('unknown entity')
      );
      expect(unknownViolations.length).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------
  // parseJsonResponse edge cases
  // --------------------------------------------------------

  describe('parseJsonResponse additional edge cases', () => {
    it('should handle JSON with extra whitespace', () => {
      const data = [{ title: 'test' }];
      const result = parseJsonResponse('  \n  ' + JSON.stringify(data) + '  \n  ');
      expect(result).toEqual(data);
    });

    it('should throw for completely empty string', () => {
      expect(() => parseJsonResponse('')).toThrow(DreamGenerationError);
    });

    it('should throw for whitespace-only string', () => {
      expect(() => parseJsonResponse('   \n\t  ')).toThrow(DreamGenerationError);
    });

    it('should handle code block with extra backticks', () => {
      const data = [{ title: 'test' }];
      const wrapped = '```json\n' + JSON.stringify(data) + '\n```';
      expect(parseJsonResponse(wrapped)).toEqual(data);
    });
  });

  // --------------------------------------------------------
  // normalizeProbabilities with extreme values
  // --------------------------------------------------------

  describe('normalizeProbabilities extreme values', () => {
    it('should handle very small probabilities', () => {
      const branches: DreamBranch[] = [
        {
          id: 'b1',
          title: 'A',
          narrative: 'N',
          probability: 0.0001,
          triggerEvents: [],
          consequences: [],
          affectedEntities: [],
          strategy: 'conservative',
        },
        {
          id: 'b2',
          title: 'B',
          narrative: 'N',
          probability: 0.0002,
          triggerEvents: [],
          consequences: [],
          affectedEntities: [],
          strategy: 'conservative',
        },
      ];
      normalizeProbabilities(branches);
      const sum = branches.reduce((s, b) => s + b.probability, 0);
      expect(sum).toBeCloseTo(1.0);
    });

    it('should handle very large probabilities', () => {
      const branches: DreamBranch[] = [
        {
          id: 'b1',
          title: 'A',
          narrative: 'N',
          probability: 1000,
          triggerEvents: [],
          consequences: [],
          affectedEntities: [],
          strategy: 'conservative',
        },
        {
          id: 'b2',
          title: 'B',
          narrative: 'N',
          probability: 2000,
          triggerEvents: [],
          consequences: [],
          affectedEntities: [],
          strategy: 'conservative',
        },
      ];
      normalizeProbabilities(branches);
      const sum = branches.reduce((s, b) => s + b.probability, 0);
      expect(sum).toBeCloseTo(1.0);
    });

    it('should handle mixed positive and zero probabilities', () => {
      const branches: DreamBranch[] = [
        {
          id: 'b1',
          title: 'A',
          narrative: 'N',
          probability: 0.5,
          triggerEvents: [],
          consequences: [],
          affectedEntities: [],
          strategy: 'conservative',
        },
        {
          id: 'b2',
          title: 'B',
          narrative: 'N',
          probability: 0,
          triggerEvents: [],
          consequences: [],
          affectedEntities: [],
          strategy: 'conservative',
        },
      ];
      normalizeProbabilities(branches);
      const sum = branches.reduce((s, b) => s + b.probability, 0);
      expect(sum).toBeCloseTo(1.0);
    });
  });

  // --------------------------------------------------------
  // validateTemporalCoherence edge cases
  // --------------------------------------------------------

  describe('validateTemporalCoherence edge cases', () => {
    it('should handle branch with only whitespace narrative', () => {
      const branch: DreamBranch = {
        id: 'b1',
        title: 'Whitespace',
        narrative: '   \n\t   ',
        probability: 0.5,
        triggerEvents: ['something'],
        consequences: [],
        affectedEntities: [],
        strategy: 'conservative',
      };
      validateTemporalCoherence([branch], {
        entities: [],
        events: [],
        tensions: [],
        arcs: [],
        timestamp: '2023-01-01T00:00:00Z',
      });
      expect(branch.temporallyCoherent).toBe(true);
    });

    it('should handle multiple branches at once', () => {
      const branches: DreamBranch[] = [
        {
          id: 'b1',
          title: 'Future',
          narrative: 'A bright future awaits.',
          probability: 0.5,
          triggerEvents: ['trigger'],
          consequences: [],
          affectedEntities: [],
          strategy: 'conservative',
        },
        {
          id: 'b2',
          title: 'Past',
          narrative: 'This had already happened years ago.',
          probability: 0.3,
          triggerEvents: ['no match'],
          consequences: [],
          affectedEntities: [],
          strategy: 'wild_card',
        },
      ];
      validateTemporalCoherence(branches, {
        entities: [],
        events: [
          {
            id: 'e1',
            title: 'Recent Event',
            description: 'D',
            timestamp: '2023-06-01T00:00:00Z',
            participants: [],
            causalPredecessors: [],
            impact: 0.5,
            sentiment: 0,
          },
        ],
        tensions: [],
        arcs: [],
        timestamp: '2023-12-01T00:00:00Z',
      });
      expect(branches[0].temporallyCoherent).toBe(true);
      expect(branches[1].temporallyCoherent).toBe(false);
    });
  });

  // --------------------------------------------------------
  // analyzeInterBranchDependencies edge cases
  // --------------------------------------------------------

  describe('analyzeInterBranchDependencies edge cases', () => {
    it('should handle three branches with complex relationships', () => {
      const branches: DreamBranch[] = [
        {
          id: 'b1',
          title: 'Alliance',
          narrative: 'Teams form',
          probability: 0.5,
          triggerEvents: ['trigger-1'],
          consequences: ['Coalition emerges with great strength'],
          affectedEntities: ['Alice', 'Bob'],
          strategy: 'conservative',
        },
        {
          id: 'b2',
          title: 'Power Shift',
          narrative: 'Power changes hands',
          probability: 0.3,
          triggerEvents: ['Coalition emerges with great strength'],
          consequences: ['New order established'],
          affectedEntities: ['Alice', 'Charlie'],
          strategy: 'wild_card',
        },
        {
          id: 'b3',
          title: 'Isolation',
          narrative: 'Bob is left out',
          probability: 0.2,
          triggerEvents: ['trigger-3'],
          consequences: ['Bob retreats'],
          affectedEntities: ['Bob'],
          strategy: 'pattern_based',
        },
      ];

      const deps = analyzeInterBranchDependencies(branches);
      // b1 → b2 (consequence triggers b2's trigger event)
      expect(deps.some((d) => d.relationship.includes('could trigger'))).toBe(true);
      // b1 and b3 share Bob
      expect(deps.length).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------
  // checkConstraints edge cases
  // --------------------------------------------------------

  describe('checkConstraints edge cases', () => {
    it('should handle branches with empty affectedEntities', () => {
      const graph = new TemporalGraph();
      const violations = checkConstraints(
        [
          {
            id: 'b1',
            title: 'No Entities',
            narrative: 'Abstract scenario',
            probability: 0.5,
            triggerEvents: ['something'],
            consequences: [],
            affectedEntities: [],
            strategy: 'conservative',
          },
        ],
        {
          entities: [],
          events: [],
          tensions: [],
          arcs: [],
          timestamp: '2023-01-01T00:00:00Z',
        },
        graph
      );
      // No entity violations expected
      expect(violations.filter((v) => v.violation.includes('unknown entity'))).toHaveLength(0);
    });

    it('should handle multiple resolved tensions referenced', () => {
      const graph = new TemporalGraph();
      const violations = checkConstraints(
        [
          {
            id: 'b1',
            title: 'Multi Resolved',
            narrative: 'The trade war escalates and the border dispute reignites.',
            probability: 0.5,
            triggerEvents: ['trigger'],
            consequences: [],
            affectedEntities: [],
            strategy: 'conservative',
          },
        ],
        {
          entities: [],
          events: [],
          tensions: [
            {
              id: 't1',
              name: 'trade war',
              description: 'Trade conflict',
              parties: ['a', 'b'],
              status: 'resolved',
              intensity: 0.5,
              duration: 30,
              relatedEvents: [],
              validFrom: '2023-01-01T00:00:00Z',
            },
            {
              id: 't2',
              name: 'border dispute',
              description: 'Border conflict',
              parties: ['c', 'd'],
              status: 'resolved',
              intensity: 0.5,
              duration: 30,
              relatedEvents: [],
              validFrom: '2023-01-01T00:00:00Z',
            },
          ],
          arcs: [],
          timestamp: '2023-01-01T00:00:00Z',
        },
        graph
      );
      // Should flag at least one resolved tension
      const resolvedViolations = violations.filter((v) => v.violation.includes('resolved tension'));
      expect(resolvedViolations.length).toBeGreaterThanOrEqual(1);
    });
  });
});

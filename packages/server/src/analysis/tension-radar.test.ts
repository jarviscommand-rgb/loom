import { describe, it, expect, beforeEach } from 'vitest';
import { TemporalGraph } from '../graph/temporal-graph.js';
import { scanTensions, analyzeTensions } from './tension-radar.js';
import type { Entity, NarrativeEvent, Tension } from '../graph/types.js';

// ============================================================
// Tension Radar — Tests
// ============================================================

function seedEntity(graph: TemporalGraph, name: string, id?: string): Entity {
  return graph.addEntity({
    id,
    name,
    type: 'person',
    motivation: 'Test motivation for analysis',
    capability: 'Testing',
    alliances: [],
    description: `Entity: ${name}`,
    firstSeen: '2023-11-17T00:00:00Z',
    lastSeen: '2023-11-22T00:00:00Z',
  });
}

function seedEvent(
  graph: TemporalGraph,
  title: string,
  opts: Partial<NarrativeEvent> = {}
): NarrativeEvent {
  return graph.addEvent({
    title,
    description: `Event: ${title}`,
    timestamp: opts.timestamp || '2023-11-17T12:00:00Z',
    participants: opts.participants || [],
    causalPredecessors: opts.causalPredecessors || [],
    impact: opts.impact ?? 0.5,
    sentiment: opts.sentiment ?? 0,
    ...opts,
  });
}

function seedTension(graph: TemporalGraph, name: string, opts: Partial<Tension> = {}): Tension {
  return graph.addTension({
    name,
    description: `Tension: ${name}`,
    parties: opts.parties || ['entity-a', 'entity-b'],
    status: opts.status || 'simmering',
    intensity: opts.intensity ?? 0.5,
    duration: opts.duration ?? 5,
    relatedEvents: opts.relatedEvents || [],
    validFrom: opts.validFrom || '2023-11-17T00:00:00Z',
    validTo: opts.validTo,
    statusHistory: opts.statusHistory,
    ...opts,
  });
}

describe('Tension Radar', () => {
  let graph: TemporalGraph;

  beforeEach(() => {
    graph = new TemporalGraph();
  });

  describe('scanTensions (backward-compatible API)', () => {
    it('should return empty array for empty graph', () => {
      expect(scanTensions(graph)).toEqual([]);
    });

    it('should return pressure points for active tensions', () => {
      const e1 = seedEntity(graph, 'Alice');
      const e2 = seedEntity(graph, 'Bob');
      seedTension(graph, 'Conflict', {
        parties: [e1.id, e2.id],
        status: 'escalating',
        intensity: 0.8,
        duration: 10,
      });

      const points = scanTensions(graph);
      expect(points).toHaveLength(1);
      expect(points[0].tensionName).toBe('Conflict');
      expect(points[0].score).toBeGreaterThan(0);
      expect(points[0].factors).toHaveProperty('duration');
      expect(points[0].factors).toHaveProperty('escalation');
      expect(points[0].factors).toHaveProperty('convergence');
      expect(points[0].narrative).toContain('Alice');
    });

    it('should not include resolved tensions', () => {
      const e1 = seedEntity(graph, 'A');
      const e2 = seedEntity(graph, 'B');
      seedTension(graph, 'Resolved', {
        parties: [e1.id, e2.id],
        status: 'resolved',
      });

      expect(scanTensions(graph)).toEqual([]);
    });
  });

  describe('analyzeTensions (full analysis)', () => {
    it('should return detailed analysis sorted by score', () => {
      const e1 = seedEntity(graph, 'A');
      const e2 = seedEntity(graph, 'B');
      const e3 = seedEntity(graph, 'C');

      seedTension(graph, 'Low', {
        parties: [e1.id, e2.id],
        status: 'simmering',
        intensity: 0.2,
        duration: 2,
      });
      seedTension(graph, 'High', {
        parties: [e2.id, e3.id],
        status: 'critical',
        intensity: 0.9,
        duration: 10,
      });

      const analyses = analyzeTensions(graph);
      expect(analyses).toHaveLength(2);
      expect(analyses[0].tensionName).toBe('High');
      expect(analyses[0].overallScore).toBeGreaterThan(analyses[1].overallScore);
    });

    it('should include all scoring components', () => {
      const e1 = seedEntity(graph, 'X');
      const e2 = seedEntity(graph, 'Y');
      seedTension(graph, 'T', {
        parties: [e1.id, e2.id],
        status: 'escalating',
        intensity: 0.7,
        duration: 14,
      });

      const [analysis] = analyzeTensions(graph);
      expect(analysis.components.durationScore).toBeGreaterThan(0);
      expect(analysis.components.escalationScore).toBeGreaterThan(0);
      expect(analysis.components.intensityScore).toBe(0.7);
      expect(analysis.momentum).toBeDefined();
      expect(analysis.cascadeRisk).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Duration scoring', () => {
    it('should score higher for medium-duration tensions than very short ones', () => {
      const e1 = seedEntity(graph, 'A');
      const e2 = seedEntity(graph, 'B');

      seedTension(graph, 'Short', {
        parties: [e1.id, e2.id],
        status: 'simmering',
        intensity: 0.5,
        duration: 1,
      });

      const shortAnalyses = analyzeTensions(graph);
      const shortDuration = shortAnalyses[0].components.durationScore;

      graph.clear();
      seedEntity(graph, 'A', e1.id);
      seedEntity(graph, 'B', e2.id);
      seedTension(graph, 'Medium', {
        parties: [e1.id, e2.id],
        status: 'simmering',
        intensity: 0.5,
        duration: 14,
      });

      const medAnalyses = analyzeTensions(graph);
      expect(medAnalyses[0].components.durationScore).toBeGreaterThan(shortDuration);
    });
  });

  describe('Escalation detection', () => {
    it('should score higher for tensions with escalating history', () => {
      const e1 = seedEntity(graph, 'A');
      const e2 = seedEntity(graph, 'B');

      seedTension(graph, 'Escalating', {
        parties: [e1.id, e2.id],
        status: 'critical',
        intensity: 0.8,
        duration: 5,
        statusHistory: [
          { status: 'simmering', timestamp: '2023-11-17T00:00:00Z' },
          { status: 'escalating', timestamp: '2023-11-18T00:00:00Z' },
          { status: 'critical', timestamp: '2023-11-19T00:00:00Z' },
        ],
      });

      const analyses = analyzeTensions(graph);
      expect(analyses[0].components.escalationScore).toBeGreaterThan(0.5);
    });
  });

  describe('Convergence scoring', () => {
    it('should score higher when tensions share entities', () => {
      const e1 = seedEntity(graph, 'Hub');
      const e2 = seedEntity(graph, 'Spoke1');
      const e3 = seedEntity(graph, 'Spoke2');

      seedTension(graph, 'T1', {
        parties: [e1.id, e2.id],
        status: 'simmering',
        intensity: 0.5,
      });
      seedTension(graph, 'T2', {
        parties: [e1.id, e3.id],
        status: 'simmering',
        intensity: 0.5,
      });

      const analyses = analyzeTensions(graph);
      // Both tensions share entity e1, so convergence > 0
      for (const analysis of analyses) {
        expect(analysis.components.convergenceScore).toBeGreaterThan(0);
      }
    });

    it('should score zero convergence for isolated tensions', () => {
      const e1 = seedEntity(graph, 'A');
      const e2 = seedEntity(graph, 'B');
      const e3 = seedEntity(graph, 'C');
      const e4 = seedEntity(graph, 'D');

      seedTension(graph, 'T1', {
        parties: [e1.id, e2.id],
        status: 'simmering',
      });
      seedTension(graph, 'T2', {
        parties: [e3.id, e4.id],
        status: 'simmering',
      });

      const analyses = analyzeTensions(graph);
      for (const analysis of analyses) {
        expect(analysis.components.convergenceScore).toBe(0);
      }
    });
  });

  describe('Momentum detection', () => {
    it('should detect accelerating momentum from increasing impact', () => {
      const e1 = seedEntity(graph, 'A');
      const e2 = seedEntity(graph, 'B');

      const ev1 = seedEvent(graph, 'Low impact', {
        timestamp: '2023-11-17T00:00:00Z',
        participants: [e1.id],
        impact: 0.2,
      });
      const ev2 = seedEvent(graph, 'Med impact', {
        timestamp: '2023-11-18T00:00:00Z',
        participants: [e1.id],
        impact: 0.5,
      });
      const ev3 = seedEvent(graph, 'High impact', {
        timestamp: '2023-11-19T00:00:00Z',
        participants: [e1.id],
        impact: 0.9,
      });
      const ev4 = seedEvent(graph, 'Very high impact', {
        timestamp: '2023-11-20T00:00:00Z',
        participants: [e1.id],
        impact: 1.0,
      });

      seedTension(graph, 'Accelerating', {
        parties: [e1.id, e2.id],
        status: 'escalating',
        intensity: 0.7,
        duration: 4,
        relatedEvents: [ev1.id, ev2.id, ev3.id, ev4.id],
      });

      const analyses = analyzeTensions(graph);
      expect(analyses[0].momentum).toBe('accelerating');
    });

    it('should detect plateauing momentum for single event tension', () => {
      const e1 = seedEntity(graph, 'A');
      const e2 = seedEntity(graph, 'B');

      seedTension(graph, 'Still', {
        parties: [e1.id, e2.id],
        status: 'simmering',
        relatedEvents: [],
      });

      const analyses = analyzeTensions(graph);
      expect(analyses[0].momentum).toBe('plateauing');
    });
  });

  describe('Cascade risk', () => {
    it('should calculate non-zero cascade risk for connected tensions', () => {
      const hub = seedEntity(graph, 'Hub');
      const s1 = seedEntity(graph, 'S1');
      const s2 = seedEntity(graph, 'S2');

      seedTension(graph, 'Core', {
        parties: [hub.id, s1.id],
        status: 'critical',
        intensity: 0.9,
      });
      seedTension(graph, 'Related', {
        parties: [hub.id, s2.id],
        status: 'escalating',
        intensity: 0.7,
      });

      const analyses = analyzeTensions(graph);
      const coreAnalysis = analyses.find((a) => a.tensionName === 'Core');
      expect(coreAnalysis!.cascadeRisk).toBeGreaterThan(0);
      expect(coreAnalysis!.cascadeTargets.length).toBeGreaterThan(0);
    });
  });

  describe('Narrative generation', () => {
    it('should include entity names and tension info in narrative', () => {
      const e1 = seedEntity(graph, 'Alice');
      const e2 = seedEntity(graph, 'Bob');
      seedTension(graph, 'Disagreement', {
        parties: [e1.id, e2.id],
        status: 'escalating',
        intensity: 0.7,
        duration: 5,
      });

      const points = scanTensions(graph);
      expect(points[0].narrative).toContain('Alice');
      expect(points[0].narrative).toContain('Bob');
      expect(points[0].narrative).toContain('Disagreement');
    });
  });

  describe('Single tension edge case', () => {
    it('should analyze a single low-intensity tension', () => {
      const e1 = seedEntity(graph, 'A');
      const e2 = seedEntity(graph, 'B');
      seedTension(graph, 'Mild', {
        parties: [e1.id, e2.id],
        status: 'simmering',
        intensity: 0.1,
        duration: 1,
      });

      const analyses = analyzeTensions(graph);
      expect(analyses).toHaveLength(1);
      expect(analyses[0].overallScore).toBeGreaterThan(0);
      expect(analyses[0].overallScore).toBeLessThan(0.5);
    });
  });
});

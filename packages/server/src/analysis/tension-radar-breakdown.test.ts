import { describe, it, expect, beforeEach } from 'vitest';
import { TemporalGraph } from '../graph/temporal-graph.js';
import { analyzeTensions } from './tension-radar.js';
import { validateBreakdown } from './score-breakdown.js';

// ============================================================
// Tension Radar — Score Breakdown Tests
//
// Verify that the tension radar produces valid, complete
// ScoreBreakdown objects with correct weights and contributions.
// ============================================================

describe('Tension Radar — Score Breakdown', () => {
  let graph: TemporalGraph;

  beforeEach(() => {
    graph = new TemporalGraph();
  });

  it('should produce no breakdowns when there are no active tensions', () => {
    const analyses = analyzeTensions(graph);
    expect(analyses).toEqual([]);
  });

  it('should produce valid breakdown for a basic tension', () => {
    // Create entities
    graph.addEntity({
      id: 'e1',
      name: 'Entity A',
      type: 'person',
      motivation: 'Power',
      capability: 'High',
      alliances: [],
      description: 'Test entity A',
      firstSeen: '2024-01-01',
      lastSeen: '2024-01-15',
    });
    graph.addEntity({
      id: 'e2',
      name: 'Entity B',
      type: 'company',
      motivation: 'Profit',
      capability: 'High',
      alliances: [],
      description: 'Test entity B',
      firstSeen: '2024-01-01',
      lastSeen: '2024-01-15',
    });

    // Create a tension
    graph.addTension({
      id: 't1',
      name: 'Conflict Alpha',
      description: 'A test conflict',
      parties: ['e1', 'e2'],
      status: 'escalating',
      intensity: 0.7,
      duration: 10,
      relatedEvents: [],
      validFrom: '2024-01-01',
    });

    const analyses = analyzeTensions(graph);
    expect(analyses.length).toBe(1);

    const analysis = analyses[0];
    expect(analysis.scoreBreakdown).toBeDefined();

    const breakdown = analysis.scoreBreakdown!;

    // Check structure
    expect(breakdown.metricName).toBe('Tension Pressure Score');
    expect(breakdown.variables.length).toBe(6);
    expect(breakdown.scoreUnit).toBe('0-1');

    // Validate weights sum to 1.0
    const validation = validateBreakdown(breakdown);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);

    // Check that weighted contributions sum to approximately the overall score
    const contributionSum = breakdown.variables.reduce((s, v) => s + v.weightedContribution, 0);
    expect(Math.abs(contributionSum - analysis.overallScore)).toBeLessThan(0.01);
  });

  it('should have correct weight values matching the SCORE_WEIGHTS constant', () => {
    graph.addEntity({
      id: 'e1',
      name: 'A',
      type: 'person',
      motivation: 'x',
      capability: 'x',
      alliances: [],
      description: 'x',
      firstSeen: '2024-01-01',
      lastSeen: '2024-01-01',
    });
    graph.addEntity({
      id: 'e2',
      name: 'B',
      type: 'person',
      motivation: 'x',
      capability: 'x',
      alliances: [],
      description: 'x',
      firstSeen: '2024-01-01',
      lastSeen: '2024-01-01',
    });
    graph.addTension({
      id: 't1',
      name: 'Test',
      description: 'Test',
      parties: ['e1', 'e2'],
      status: 'simmering',
      intensity: 0.5,
      duration: 7,
      relatedEvents: [],
      validFrom: '2024-01-01',
    });

    const analyses = analyzeTensions(graph);
    const breakdown = analyses[0].scoreBreakdown!;

    const expectedWeights: Record<string, number> = {
      Intensity: 0.2,
      'Duration Decay': 0.15,
      Escalation: 0.2,
      Convergence: 0.15,
      Momentum: 0.15,
      'Cascade Risk': 0.15,
    };

    for (const v of breakdown.variables) {
      expect(v.weight).toBe(expectedWeights[v.name]);
    }
  });

  it('should handle tension with zero duration', () => {
    graph.addEntity({
      id: 'e1',
      name: 'A',
      type: 'person',
      motivation: 'x',
      capability: 'x',
      alliances: [],
      description: 'x',
      firstSeen: '2024-01-01',
      lastSeen: '2024-01-01',
    });
    graph.addEntity({
      id: 'e2',
      name: 'B',
      type: 'person',
      motivation: 'x',
      capability: 'x',
      alliances: [],
      description: 'x',
      firstSeen: '2024-01-01',
      lastSeen: '2024-01-01',
    });
    graph.addTension({
      id: 't1',
      name: 'New Tension',
      description: 'Just started',
      parties: ['e1', 'e2'],
      status: 'simmering',
      intensity: 0.3,
      duration: 0,
      relatedEvents: [],
      validFrom: '2024-01-01',
    });

    const analyses = analyzeTensions(graph);
    const breakdown = analyses[0].scoreBreakdown!;

    // Duration variable should have raw value 0
    const durationVar = breakdown.variables.find((v) => v.name === 'Duration Decay');
    expect(durationVar).toBeDefined();
    expect(durationVar!.rawValue).toBe(0);
    expect(durationVar!.normalizedValue).toBe(0);

    const validation = validateBreakdown(breakdown);
    expect(validation.valid).toBe(true);
  });

  it('should show convergence when tensions share entities', () => {
    graph.addEntity({
      id: 'e1',
      name: 'A',
      type: 'person',
      motivation: 'x',
      capability: 'x',
      alliances: [],
      description: 'x',
      firstSeen: '2024-01-01',
      lastSeen: '2024-01-01',
    });
    graph.addEntity({
      id: 'e2',
      name: 'B',
      type: 'person',
      motivation: 'x',
      capability: 'x',
      alliances: [],
      description: 'x',
      firstSeen: '2024-01-01',
      lastSeen: '2024-01-01',
    });
    graph.addEntity({
      id: 'e3',
      name: 'C',
      type: 'person',
      motivation: 'x',
      capability: 'x',
      alliances: [],
      description: 'x',
      firstSeen: '2024-01-01',
      lastSeen: '2024-01-01',
    });

    // Two tensions sharing entity e2
    graph.addTension({
      id: 't1',
      name: 'T1',
      description: 'T1',
      parties: ['e1', 'e2'],
      status: 'escalating',
      intensity: 0.8,
      duration: 5,
      relatedEvents: [],
      validFrom: '2024-01-01',
    });
    graph.addTension({
      id: 't2',
      name: 'T2',
      description: 'T2',
      parties: ['e2', 'e3'],
      status: 'simmering',
      intensity: 0.4,
      duration: 3,
      relatedEvents: [],
      validFrom: '2024-01-01',
    });

    const analyses = analyzeTensions(graph);

    // Both should have convergence > 0
    for (const a of analyses) {
      const convergenceVar = a.scoreBreakdown!.variables.find((v) => v.name === 'Convergence');
      expect(convergenceVar).toBeDefined();
      expect(convergenceVar!.rawValue).toBeGreaterThan(0);
      expect(convergenceVar!.normalizedValue).toBeGreaterThan(0);
    }
  });

  it('should have descriptions for all variables', () => {
    graph.addEntity({
      id: 'e1',
      name: 'A',
      type: 'person',
      motivation: 'x',
      capability: 'x',
      alliances: [],
      description: 'x',
      firstSeen: '2024-01-01',
      lastSeen: '2024-01-01',
    });
    graph.addEntity({
      id: 'e2',
      name: 'B',
      type: 'person',
      motivation: 'x',
      capability: 'x',
      alliances: [],
      description: 'x',
      firstSeen: '2024-01-01',
      lastSeen: '2024-01-01',
    });
    graph.addTension({
      id: 't1',
      name: 'Test',
      description: 'Test',
      parties: ['e1', 'e2'],
      status: 'critical',
      intensity: 0.9,
      duration: 20,
      relatedEvents: [],
      validFrom: '2024-01-01',
    });

    const analyses = analyzeTensions(graph);
    const breakdown = analyses[0].scoreBreakdown!;

    for (const v of breakdown.variables) {
      expect(v.description.length).toBeGreaterThan(10);
    }
  });
});

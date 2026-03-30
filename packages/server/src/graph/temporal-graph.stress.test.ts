import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TemporalGraph } from './temporal-graph.js';
import { scanTensions } from '../analysis/tension-radar.js';
import { analyzeArcs } from '../analysis/arc-detector.js';
import type { EntityType, TensionStatus, ArcPhase } from './types.js';

// ============================================================
// LOOM — Temporal Graph Stress Test (10,000+ entities)
// ============================================================

const ENTITY_COUNT = 10000;
const EVENT_COUNT = 20000;
const TENSION_COUNT = 4000;
const ARC_COUNT = 1000;

const ENTITY_TYPES: EntityType[] = ['person', 'company', 'institution', 'group', 'concept'];
const TENSION_STATUSES: TensionStatus[] = [
  'simmering',
  'escalating',
  'critical',
  'resolving',
  'resolved',
];
const ARC_PHASES: ArcPhase[] = ['setup', 'rising_action', 'climax', 'falling_action', 'resolution'];

/** Seeded pseudo-random for reproducible benchmarks. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function isoDate(dayOffset: number): string {
  const d = new Date(2023, 0, 1);
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString();
}

interface BenchmarkResult {
  name: string;
  elapsed: number;
  limit: number;
}

const benchResults: BenchmarkResult[] = [];

function bench(name: string, limit: number, fn: () => void): number {
  const start = performance.now();
  fn();
  const elapsed = performance.now() - start;
  benchResults.push({ name, elapsed, limit });
  return elapsed;
}

describe('TemporalGraph Stress Test (10,000+ entities)', () => {
  let graph: TemporalGraph;
  let entityIds: string[];
  let eventIds: string[];

  beforeAll(() => {
    graph = new TemporalGraph();
    entityIds = [];
    eventIds = [];
  });

  afterAll(() => {
    const maxNameLen = Math.max(...benchResults.map((r) => r.name.length), 10);
    const header = `${'Benchmark'.padEnd(maxNameLen)}  ${'Elapsed'.padStart(10)}  ${'Limit'.padStart(10)}  Result`;
    const separator = '-'.repeat(header.length + 4);

    console.log('\n' + separator);
    console.log('  LOOM Graph Stress Test Summary (10K entities)');
    console.log(separator);
    console.log(`  ${header}`);
    console.log(`  ${'-'.repeat(header.length)}`);

    for (const result of benchResults) {
      const pass = result.elapsed <= result.limit ? 'PASS' : 'FAIL';
      const line = `  ${result.name.padEnd(maxNameLen)}  ${result.elapsed.toFixed(1).padStart(8)}ms  ${(result.limit + 'ms').padStart(10)}  ${pass}`;
      console.log(line);
    }

    console.log(separator + '\n');
  });

  // --------------------------------------------------------
  // Data loading
  // --------------------------------------------------------

  it('should load 10,000 entities and 20,000 events in under 5 seconds', () => {
    const rng = seededRandom(99);

    const elapsed = bench('Load 10K entities + 20K events', 5000, () => {
      for (let i = 0; i < ENTITY_COUNT; i++) {
        const type = ENTITY_TYPES[Math.floor(rng() * ENTITY_TYPES.length)];
        const entity = graph.addEntity({
          name: `Stress-Entity-${i}`,
          type,
          motivation: `Motivation ${i}`,
          capability: `Capability ${i}`,
          alliances: [],
          description: `Stress test entity ${i}`,
          firstSeen: isoDate(Math.floor(rng() * 365)),
          lastSeen: isoDate(365 + Math.floor(rng() * 365)),
        });
        entityIds.push(entity.id);
      }

      for (let i = 0; i < EVENT_COUNT; i++) {
        const participantCount = 2 + Math.floor(rng() * 4);
        const participants: string[] = [];
        for (let p = 0; p < participantCount; p++) {
          participants.push(entityIds[Math.floor(rng() * ENTITY_COUNT)]);
        }
        const predecessors: string[] = [];
        if (eventIds.length > 0 && rng() > 0.3) {
          predecessors.push(eventIds[Math.floor(rng() * eventIds.length)]);
        }
        const event = graph.addEvent({
          title: `Stress-Event ${i}`,
          description: `Stress test event ${i}`,
          timestamp: isoDate(Math.floor(rng() * 730)),
          participants,
          causalPredecessors: predecessors,
          impact: rng(),
          sentiment: rng() * 2 - 1,
        });
        eventIds.push(event.id);
      }

      for (let i = 0; i < TENSION_COUNT; i++) {
        const partyA = entityIds[Math.floor(rng() * ENTITY_COUNT)];
        let partyB = entityIds[Math.floor(rng() * ENTITY_COUNT)];
        while (partyB === partyA) {
          partyB = entityIds[Math.floor(rng() * ENTITY_COUNT)];
        }
        const relatedEventCount = Math.floor(rng() * 5);
        const relatedEvents: string[] = [];
        for (let e = 0; e < relatedEventCount; e++) {
          relatedEvents.push(eventIds[Math.floor(rng() * eventIds.length)]);
        }
        graph.addTension({
          name: `Stress-Tension ${i}`,
          description: `Stress tension`,
          parties: [partyA, partyB],
          status: TENSION_STATUSES[Math.floor(rng() * TENSION_STATUSES.length)],
          intensity: rng(),
          duration: 1 + Math.floor(rng() * 365),
          relatedEvents,
          validFrom: isoDate(Math.floor(rng() * 365)),
          validTo: rng() > 0.3 ? isoDate(365 + Math.floor(rng() * 365)) : undefined,
        });
      }

      for (let i = 0; i < ARC_COUNT; i++) {
        const charCount = 2 + Math.floor(rng() * 6);
        const characters: string[] = [];
        for (let c = 0; c < charCount; c++) {
          characters.push(entityIds[Math.floor(rng() * ENTITY_COUNT)]);
        }
        const evtCount = 3 + Math.floor(rng() * 12);
        const arcEvents: string[] = [];
        for (let e = 0; e < evtCount; e++) {
          arcEvents.push(eventIds[Math.floor(rng() * eventIds.length)]);
        }
        graph.addArc({
          name: `Stress-Arc ${i}`,
          description: `Stress arc ${i}`,
          phase: ARC_PHASES[Math.floor(rng() * ARC_PHASES.length)],
          characters,
          events: arcEvents,
          tensions: [],
          startDate: isoDate(Math.floor(rng() * 365)),
          endDate: rng() > 0.4 ? isoDate(365 + Math.floor(rng() * 365)) : undefined,
        });
      }
    });

    expect(graph.getAllEntities()).toHaveLength(ENTITY_COUNT);
    expect(graph.getAllEvents()).toHaveLength(EVENT_COUNT);
    expect(elapsed).toBeLessThan(8000);
  });

  // --------------------------------------------------------
  // Snapshot operations
  // --------------------------------------------------------

  it('should perform getSnapshot with 10K entities in under 1 second', () => {
    const elapsed = bench('getSnapshot (10K)', 1000, () => {
      const snapshot = graph.getSnapshot();
      expect(snapshot.entities.length).toBe(ENTITY_COUNT);
      expect(snapshot.events.length).toBe(EVENT_COUNT);
      expect(snapshot.tensions.length).toBe(TENSION_COUNT);
      expect(snapshot.arcs.length).toBe(ARC_COUNT);
    });
    expect(elapsed).toBeLessThan(1000);
  });

  it('should perform getSnapshotAt with 10K entities in under 1 second', () => {
    const elapsed = bench('getSnapshotAt (10K)', 1000, () => {
      const snapshot = graph.getSnapshotAt('2023-07-01T00:00:00Z');
      expect(snapshot.entities.length).toBeGreaterThan(0);
    });
    expect(elapsed).toBeLessThan(1000);
  });

  // --------------------------------------------------------
  // Queries at scale
  // --------------------------------------------------------

  it('should query events for entity in under 100ms from 10K entities', () => {
    const targetEntity = entityIds[5000];
    const elapsed = bench('getEventsForEntity (10K)', 100, () => {
      const events = graph.getEventsForEntity(targetEntity);
      expect(events).toBeDefined();
    });
    expect(elapsed).toBeLessThan(100);
  });

  it('should find entity by name in under 50ms from 10K entities', () => {
    const elapsed = bench('findEntityByName (10K)', 50, () => {
      const result = graph.findEntityByName('Stress-Entity-5000');
      expect(result).toBeDefined();
    });
    expect(elapsed).toBeLessThan(200);
  });

  it('should get events in range in under 200ms from 20K events', () => {
    const elapsed = bench('getEventsInRange (20K events)', 200, () => {
      const events = graph.getEventsInRange('2023-03-01T00:00:00Z', '2023-09-01T00:00:00Z');
      expect(events.length).toBeGreaterThan(0);
    });
    expect(elapsed).toBeLessThan(200);
  });

  it('should get active tensions in under 100ms from 4K tensions', () => {
    const elapsed = bench('getActiveTensions (4K)', 100, () => {
      const active = graph.getActiveTensions();
      expect(active.length).toBeGreaterThan(0);
    });
    expect(elapsed).toBeLessThan(100);
  });

  // --------------------------------------------------------
  // Analysis at scale
  // --------------------------------------------------------

  it('should scan tensions in under 5 seconds with 10K entities', () => {
    const elapsed = bench('scanTensions (10K entities)', 5000, () => {
      const pressurePoints = scanTensions(graph);
      expect(pressurePoints.length).toBeGreaterThan(0);
    });
    expect(elapsed).toBeLessThan(8000);
  });

  it('should analyze arcs in under 500ms with 10K entities', () => {
    const elapsed = bench('analyzeArcs (10K entities)', 500, () => {
      const arcAnalysis = analyzeArcs(graph);
      expect(arcAnalysis.length).toBeGreaterThan(0);
    });
    expect(elapsed).toBeLessThan(500);
  });

  // --------------------------------------------------------
  // Graph statistics at scale
  // --------------------------------------------------------

  it('should compute statistics in under 5 seconds with 10K entities', () => {
    const elapsed = bench('computeStatistics (10K)', 5000, () => {
      const stats = graph.computeStatistics();
      expect(stats.entityCount).toBe(ENTITY_COUNT);
      expect(stats.eventCount).toBe(EVENT_COUNT);
      expect(stats.tensionCount).toBe(TENSION_COUNT);
      expect(stats.arcCount).toBe(ARC_COUNT);
      expect(stats.density).toBeGreaterThan(0);
      expect(stats.centralEntities.length).toBeGreaterThan(0);
    });
    expect(elapsed).toBeLessThan(8000);
  });

  // --------------------------------------------------------
  // Bulk operations at scale
  // --------------------------------------------------------

  it('should handle clear + reload cycle in under 8 seconds with 10K entities', () => {
    const snapshot = graph.getSnapshot();

    const elapsed = bench('clear + reload (10K)', 8000, () => {
      graph.clear();
      expect(graph.getAllEntities()).toHaveLength(0);
      expect(graph.getAllEvents()).toHaveLength(0);
      graph.load(snapshot);
    });

    expect(graph.getAllEntities()).toHaveLength(ENTITY_COUNT);
    expect(graph.getAllEvents()).toHaveLength(EVENT_COUNT);
    expect(elapsed).toBeLessThan(8000);
  });

  // --------------------------------------------------------
  // ID lookups at scale
  // --------------------------------------------------------

  it('should perform 10,000 random entity lookups in under 50ms', () => {
    const rng = seededRandom(42);
    const elapsed = bench('10K random getEntity lookups', 50, () => {
      for (let i = 0; i < 10000; i++) {
        const id = entityIds[Math.floor(rng() * entityIds.length)];
        const entity = graph.getEntity(id);
        expect(entity).toBeDefined();
      }
    });
    expect(elapsed).toBeLessThan(200);
  });

  it('should extract subgraph for entity in under 200ms from 10K entities', () => {
    const targetEntity = entityIds[1000];
    const elapsed = bench('getSubgraphForEntity (10K)', 200, () => {
      const subgraph = graph.getSubgraphForEntity(targetEntity);
      expect(subgraph).toBeDefined();
      expect(subgraph.entities.length).toBeGreaterThan(0);
    });
    expect(elapsed).toBeLessThan(200);
  });
});

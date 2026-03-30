import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TemporalGraph } from './temporal-graph.js';
import { scanTensions } from '../analysis/tension-radar.js';
import { analyzeArcs } from '../analysis/arc-detector.js';
import type { EntityType, TensionStatus, ArcPhase } from './types.js';

// ============================================================
// LOOM — Temporal Graph Performance Benchmarks (5000+ entities)
// ============================================================

const ENTITY_COUNT = 5000;
const EVENT_COUNT = 10000;
const TENSION_COUNT = 2000;
const ARC_COUNT = 500;

const ENTITY_TYPES: EntityType[] = ['person', 'company', 'institution', 'group', 'concept'];
const TENSION_STATUSES: TensionStatus[] = [
  'simmering',
  'escalating',
  'critical',
  'resolving',
  'resolved',
];
const ARC_PHASES: ArcPhase[] = ['setup', 'rising_action', 'climax', 'falling_action', 'resolution'];

const FIRST_NAMES = [
  'Alex',
  'Blake',
  'Casey',
  'Dana',
  'Eli',
  'Fern',
  'Glen',
  'Harper',
  'Ivy',
  'Jordan',
  'Kim',
  'Lane',
  'Morgan',
  'Noel',
  'Oakley',
  'Parker',
  'Quinn',
  'Reese',
  'Sage',
  'Taylor',
  'Uri',
  'Val',
  'Wren',
  'Xen',
  'Yael',
  'Zion',
];
const LAST_NAMES = [
  'Chen',
  'Patel',
  'Kim',
  'Garcia',
  'Nguyen',
  'Mueller',
  'Tanaka',
  'Singh',
  'Okafor',
  'Johansson',
  'Ali',
  'Cohen',
  'Santos',
  'Petrov',
  'Larsen',
  'Ito',
  'Reyes',
  'Andersen',
  'Park',
  'Malik',
];
const ORG_SUFFIXES = ['Corp', 'Labs', 'Industries', 'Group', 'Institute', 'Foundation', 'Systems'];

/** Seeded pseudo-random for reproducible benchmarks. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function generateEntityName(index: number, rng: () => number): string {
  const type = ENTITY_TYPES[Math.floor(rng() * ENTITY_TYPES.length)];
  if (type === 'person') {
    const first = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    return `${first} ${last} ${index}`;
  }
  const last = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
  const suffix = ORG_SUFFIXES[Math.floor(rng() * ORG_SUFFIXES.length)];
  return `${last} ${suffix} ${index}`;
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

describe('TemporalGraph Performance Benchmarks (5000+ entities)', () => {
  let graph: TemporalGraph;
  let entityIds: string[];
  let eventIds: string[];

  // --- Data generation and load ---

  beforeAll(() => {
    graph = new TemporalGraph();
    entityIds = [];
    eventIds = [];
  });

  afterAll(() => {
    // Print summary table
    const maxNameLen = Math.max(...benchResults.map((r) => r.name.length), 10);
    const header = `${'Benchmark'.padEnd(maxNameLen)}  ${'Elapsed'.padStart(10)}  ${'Limit'.padStart(10)}  Result`;
    const separator = '-'.repeat(header.length + 4);

    console.log('\n' + separator);
    console.log('  LOOM Graph Performance Benchmark Summary');
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

  it('should load 5000 entities in under 2 seconds', () => {
    const rng = seededRandom(42);

    const elapsed = bench('Load 5000 entities', 2000, () => {
      for (let i = 0; i < ENTITY_COUNT; i++) {
        const type = ENTITY_TYPES[Math.floor(rng() * ENTITY_TYPES.length)];
        const entity = graph.addEntity({
          name: generateEntityName(i, rng),
          type,
          motivation: `Motivation for entity ${i}`,
          capability: `Capability ${i}`,
          alliances: [],
          description: `Description for entity ${i}`,
          firstSeen: isoDate(Math.floor(rng() * 365)),
          lastSeen: isoDate(365 + Math.floor(rng() * 365)),
        });
        entityIds.push(entity.id);
      }

      // Generate 10000 events connecting entities
      for (let i = 0; i < EVENT_COUNT; i++) {
        const participantCount = 2 + Math.floor(rng() * 3); // 2-4 participants
        const participants: string[] = [];
        for (let p = 0; p < participantCount; p++) {
          participants.push(entityIds[Math.floor(rng() * ENTITY_COUNT)]);
        }
        const predecessors: string[] = [];
        if (eventIds.length > 0 && rng() > 0.3) {
          predecessors.push(eventIds[Math.floor(rng() * eventIds.length)]);
        }
        const event = graph.addEvent({
          title: `Event ${i}`,
          description: `Description for event ${i}`,
          timestamp: isoDate(Math.floor(rng() * 730)),
          participants,
          causalPredecessors: predecessors,
          impact: rng(),
          sentiment: rng() * 2 - 1,
        });
        eventIds.push(event.id);
      }

      // Generate 2000 tensions
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
        const fromDay = Math.floor(rng() * 365);
        graph.addTension({
          name: `Tension ${i}`,
          description: `Tension between entities`,
          parties: [partyA, partyB],
          status: TENSION_STATUSES[Math.floor(rng() * TENSION_STATUSES.length)],
          intensity: rng(),
          duration: 1 + Math.floor(rng() * 365),
          relatedEvents,
          validFrom: isoDate(fromDay),
          validTo: rng() > 0.3 ? isoDate(fromDay + 30 + Math.floor(rng() * 335)) : undefined,
        });
      }

      // Generate 500 arcs
      for (let i = 0; i < ARC_COUNT; i++) {
        const charCount = 2 + Math.floor(rng() * 5);
        const characters: string[] = [];
        for (let c = 0; c < charCount; c++) {
          characters.push(entityIds[Math.floor(rng() * ENTITY_COUNT)]);
        }
        const evtCount = 3 + Math.floor(rng() * 10);
        const arcEvents: string[] = [];
        for (let e = 0; e < evtCount; e++) {
          arcEvents.push(eventIds[Math.floor(rng() * eventIds.length)]);
        }
        const startDay = Math.floor(rng() * 365);
        graph.addArc({
          name: `Arc ${i}`,
          description: `Narrative arc ${i}`,
          phase: ARC_PHASES[Math.floor(rng() * ARC_PHASES.length)],
          characters,
          events: arcEvents,
          tensions: [],
          startDate: isoDate(startDay),
          endDate: rng() > 0.4 ? isoDate(startDay + 30 + Math.floor(rng() * 335)) : undefined,
        });
      }
    });

    expect(graph.getAllEntities()).toHaveLength(ENTITY_COUNT);
    expect(elapsed).toBeLessThan(2000);
  });

  it('should perform getSnapshot with 5000 entities in under 500ms', () => {
    const elapsed = bench('getSnapshot (full)', 500, () => {
      const snapshot = graph.getSnapshot();
      expect(snapshot.entities.length).toBe(ENTITY_COUNT);
      expect(snapshot.events.length).toBe(EVENT_COUNT);
    });
    expect(elapsed).toBeLessThan(500);
  });

  it('should perform getSnapshotAt with 5000 entities in under 500ms', () => {
    const elapsed = bench('getSnapshotAt (midpoint)', 500, () => {
      const snapshot = graph.getSnapshotAt('2023-07-01T00:00:00Z');
      expect(snapshot.entities.length).toBeGreaterThan(0);
      expect(snapshot.events.length).toBeGreaterThan(0);
    });
    expect(elapsed).toBeLessThan(500);
  });

  it('should query events for a specific entity in under 50ms', () => {
    const targetEntity = entityIds[Math.floor(entityIds.length / 2)];
    const elapsed = bench('getEventsForEntity', 50, () => {
      const events = graph.getEventsForEntity(targetEntity);
      expect(events).toBeDefined();
    });
    expect(elapsed).toBeLessThan(50);
  });

  it('should get events in range in under 100ms', () => {
    const elapsed = bench('getEventsInRange (6 months)', 100, () => {
      const events = graph.getEventsInRange('2023-03-01T00:00:00Z', '2023-09-01T00:00:00Z');
      expect(events.length).toBeGreaterThan(0);
    });
    expect(elapsed).toBeLessThan(100);
  });

  it('should scan tensions in under 2000ms', () => {
    const elapsed = bench('scanTensions', 2000, () => {
      const pressurePoints = scanTensions(graph);
      expect(pressurePoints.length).toBeGreaterThan(0);
    });
    expect(elapsed).toBeLessThan(2000);
  });

  it('should analyze arcs in under 200ms', () => {
    const elapsed = bench('analyzeArcs', 200, () => {
      const arcAnalysis = analyzeArcs(graph);
      expect(arcAnalysis.length).toBeGreaterThan(0);
    });
    expect(elapsed).toBeLessThan(200);
  });

  it('should handle clear + reload cycle in under 3 seconds', () => {
    // Take snapshot before clear
    const snapshot = graph.getSnapshot();
    const elapsed = bench('clear + reload cycle', 3000, () => {
      graph.clear();
      expect(graph.getAllEntities()).toHaveLength(0);
      graph.load(snapshot);
    });

    expect(graph.getAllEntities()).toHaveLength(ENTITY_COUNT);
    expect(elapsed).toBeLessThan(3000);
  });

  it('should compute graph statistics in under 2000ms', () => {
    const elapsed = bench('computeStatistics', 2000, () => {
      const stats = graph.computeStatistics();
      expect(stats.entityCount).toBe(ENTITY_COUNT);
      expect(stats.eventCount).toBe(EVENT_COUNT);
      expect(stats.tensionCount).toBe(TENSION_COUNT);
      expect(stats.arcCount).toBe(ARC_COUNT);
      expect(stats.density).toBeGreaterThan(0);
      expect(stats.centralEntities.length).toBeGreaterThan(0);
    });
    expect(elapsed).toBeLessThan(2000);
  });

  it('should find entity by id in under 10ms from 5000 entities', () => {
    const targetId = entityIds[entityIds.length - 1];
    const elapsed = bench('getEntity by ID', 10, () => {
      for (let i = 0; i < 1000; i++) {
        const entity = graph.getEntity(targetId);
        expect(entity).toBeDefined();
      }
    });
    expect(elapsed).toBeLessThan(10);
  });
});

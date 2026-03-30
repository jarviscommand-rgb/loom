import { describe, it, expect, beforeEach } from 'vitest';
import { TemporalGraph } from './temporal-graph.js';
import type { Entity, NarrativeEvent, Tension, NarrativeArc } from './types.js';

// ============================================================
// Temporal Graph Engine — Tests
// ============================================================

function makeEntity(overrides: Partial<Entity> = {}): Omit<Entity, 'id'> & { id?: string } {
  return {
    name: 'Test Entity',
    type: 'person',
    motivation: 'Testing',
    capability: 'Unit tests',
    alliances: [],
    description: 'A test entity',
    firstSeen: '2023-11-17T00:00:00Z',
    lastSeen: '2023-11-17T00:00:00Z',
    ...overrides,
  };
}

function makeEvent(
  overrides: Partial<NarrativeEvent> = {}
): Omit<NarrativeEvent, 'id'> & { id?: string } {
  return {
    title: 'Test Event',
    description: 'A test event',
    timestamp: '2023-11-17T12:00:00Z',
    participants: [],
    causalPredecessors: [],
    impact: 0.5,
    sentiment: 0,
    ...overrides,
  };
}

function makeTension(overrides: Partial<Tension> = {}): Omit<Tension, 'id'> & { id?: string } {
  return {
    name: 'Test Tension',
    description: 'A test tension',
    parties: ['entity-a', 'entity-b'],
    status: 'simmering',
    intensity: 0.5,
    duration: 5,
    relatedEvents: [],
    validFrom: '2023-11-17T00:00:00Z',
    ...overrides,
  };
}

function makeArc(
  overrides: Partial<NarrativeArc> = {}
): Omit<NarrativeArc, 'id'> & { id?: string } {
  return {
    name: 'Test Arc',
    description: 'A test arc',
    phase: 'setup',
    characters: [],
    events: [],
    tensions: [],
    startDate: '2023-11-17T00:00:00Z',
    ...overrides,
  };
}

describe('TemporalGraph', () => {
  let graph: TemporalGraph;

  beforeEach(() => {
    graph = new TemporalGraph();
  });

  // --- Entity CRUD ---

  describe('Entity operations', () => {
    it('should add and retrieve an entity', () => {
      const entity = graph.addEntity(makeEntity({ name: 'Alice' }));
      expect(entity.id).toBeDefined();
      expect(graph.getEntity(entity.id)).toEqual(entity);
    });

    it('should add entity with custom id', () => {
      graph.addEntity(makeEntity({ id: 'custom-id', name: 'Bob' }));
      expect(graph.getEntity('custom-id')).toBeDefined();
      expect(graph.getEntity('custom-id')?.name).toBe('Bob');
    });

    it('should return undefined for unknown entity', () => {
      expect(graph.getEntity('nonexistent')).toBeUndefined();
    });

    it('should get all entities', () => {
      graph.addEntity(makeEntity({ name: 'A' }));
      graph.addEntity(makeEntity({ name: 'B' }));
      graph.addEntity(makeEntity({ name: 'C' }));
      expect(graph.getAllEntities()).toHaveLength(3);
    });

    it('should find entity by exact name (case-insensitive)', () => {
      graph.addEntity(makeEntity({ name: 'Sam Altman' }));
      expect(graph.findEntityByName('sam altman')).toBeDefined();
      expect(graph.findEntityByName('SAM ALTMAN')).toBeDefined();
      expect(graph.findEntityByName('unknown')).toBeUndefined();
    });

    it('should find entities with fuzzy search', () => {
      graph.addEntity(makeEntity({ name: 'Sam Altman' }));
      graph.addEntity(makeEntity({ name: 'Microsoft' }));

      // Substring match
      const results1 = graph.findEntitiesFuzzy('Altman');
      expect(results1.length).toBeGreaterThanOrEqual(1);
      expect(results1[0].name).toBe('Sam Altman');

      // Levenshtein distance
      const results2 = graph.findEntitiesFuzzy('Microsft', 2);
      expect(results2.length).toBeGreaterThanOrEqual(1);
    });
  });

  // --- Event operations ---

  describe('Event operations', () => {
    it('should add and retrieve an event', () => {
      const event = graph.addEvent(makeEvent({ title: 'The Firing' }));
      expect(event.id).toBeDefined();
      expect(graph.getEvent(event.id)).toEqual(event);
    });

    it('should return all events sorted chronologically', () => {
      graph.addEvent(makeEvent({ title: 'Third', timestamp: '2023-11-19T00:00:00Z' }));
      graph.addEvent(makeEvent({ title: 'First', timestamp: '2023-11-17T00:00:00Z' }));
      graph.addEvent(makeEvent({ title: 'Second', timestamp: '2023-11-18T00:00:00Z' }));

      const events = graph.getAllEvents();
      expect(events.map((e) => e.title)).toEqual(['First', 'Second', 'Third']);
    });

    it('should get events in time range', () => {
      graph.addEvent(makeEvent({ title: 'Before', timestamp: '2023-11-15T00:00:00Z' }));
      graph.addEvent(makeEvent({ title: 'In range', timestamp: '2023-11-17T00:00:00Z' }));
      graph.addEvent(makeEvent({ title: 'After', timestamp: '2023-11-20T00:00:00Z' }));

      const inRange = graph.getEventsInRange('2023-11-16T00:00:00Z', '2023-11-18T00:00:00Z');
      expect(inRange).toHaveLength(1);
      expect(inRange[0].title).toBe('In range');
    });

    it('should get events for a specific entity', () => {
      const entity = graph.addEntity(makeEntity({ name: 'Alice' }));
      graph.addEvent(makeEvent({ title: 'With Alice', participants: [entity.id] }));
      graph.addEvent(makeEvent({ title: 'Without Alice', participants: ['other'] }));

      const events = graph.getEventsForEntity(entity.id);
      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('With Alice');
    });

    it('should return empty array for entity with no events', () => {
      expect(graph.getEventsForEntity('unknown')).toEqual([]);
    });
  });

  // --- Tension operations ---

  describe('Tension operations', () => {
    it('should add and retrieve a tension', () => {
      const tension = graph.addTension(makeTension({ name: 'Safety vs Speed' }));
      expect(tension.id).toBeDefined();
      expect(graph.getTension(tension.id)).toEqual(tension);
    });

    it('should get all tensions', () => {
      graph.addTension(makeTension({ name: 'T1' }));
      graph.addTension(makeTension({ name: 'T2' }));
      expect(graph.getAllTensions()).toHaveLength(2);
    });

    it('should filter active tensions (exclude resolved)', () => {
      graph.addTension(makeTension({ name: 'Active', status: 'simmering' }));
      graph.addTension(makeTension({ name: 'Resolved', status: 'resolved' }));
      graph.addTension(makeTension({ name: 'Critical', status: 'critical' }));

      const active = graph.getActiveTensions();
      expect(active).toHaveLength(2);
      expect(active.map((t) => t.name).sort()).toEqual(['Active', 'Critical']);
    });

    it('should get tensions for a specific entity', () => {
      const e1 = graph.addEntity(makeEntity({ name: 'A' }));
      const e2 = graph.addEntity(makeEntity({ name: 'B' }));
      const e3 = graph.addEntity(makeEntity({ name: 'C' }));

      graph.addTension(makeTension({ name: 'AB', parties: [e1.id, e2.id] }));
      graph.addTension(makeTension({ name: 'BC', parties: [e2.id, e3.id] }));

      expect(graph.getTensionsForEntity(e1.id)).toHaveLength(1);
      expect(graph.getTensionsForEntity(e2.id)).toHaveLength(2);
      expect(graph.getTensionsForEntity('unknown')).toEqual([]);
    });
  });

  // --- Arc operations ---

  describe('Arc operations', () => {
    it('should add and retrieve an arc', () => {
      const arc = graph.addArc(makeArc({ name: 'The Coup' }));
      expect(arc.id).toBeDefined();
      expect(graph.getArc(arc.id)).toEqual(arc);
    });

    it('should get all arcs', () => {
      graph.addArc(makeArc({ name: 'A1' }));
      graph.addArc(makeArc({ name: 'A2' }));
      expect(graph.getAllArcs()).toHaveLength(2);
    });
  });

  // --- Snapshot ---

  describe('Snapshots', () => {
    it('should get current snapshot', () => {
      graph.addEntity(makeEntity({ name: 'E1' }));
      graph.addEvent(makeEvent({ title: 'Ev1' }));

      const snapshot = graph.getSnapshot();
      expect(snapshot.entities).toHaveLength(1);
      expect(snapshot.events).toHaveLength(1);
      expect(snapshot.timestamp).toBeDefined();
    });

    it('should get snapshot at a specific time', () => {
      graph.addEntity(makeEntity({ name: 'Early', firstSeen: '2023-11-16T00:00:00Z' }));
      graph.addEntity(makeEntity({ name: 'Late', firstSeen: '2023-11-20T00:00:00Z' }));
      graph.addEvent(makeEvent({ title: 'E1', timestamp: '2023-11-16T12:00:00Z' }));
      graph.addEvent(makeEvent({ title: 'E2', timestamp: '2023-11-20T12:00:00Z' }));

      const snapshot = graph.getSnapshotAt('2023-11-18T00:00:00Z');
      expect(snapshot.entities).toHaveLength(1);
      expect(snapshot.entities[0].name).toBe('Early');
      expect(snapshot.events).toHaveLength(1);
      expect(snapshot.events[0].title).toBe('E1');
    });
  });

  // --- Causal chain traversal ---

  describe('Causal chain traversal', () => {
    it('should find causal descendants', () => {
      graph.addEvent(makeEvent({ id: 'e1', title: 'Root' }));
      graph.addEvent(makeEvent({ id: 'e2', title: 'Child', causalPredecessors: ['e1'] }));
      graph.addEvent(makeEvent({ id: 'e3', title: 'Grandchild', causalPredecessors: ['e2'] }));

      const descendants = graph.getCausalDescendants('e1');
      expect(descendants).toHaveLength(2);
      expect(descendants.map((e) => e.title)).toContain('Child');
      expect(descendants.map((e) => e.title)).toContain('Grandchild');
    });

    it('should find causal ancestors', () => {
      graph.addEvent(makeEvent({ id: 'a1', title: 'Origin', timestamp: '2023-11-15T00:00:00Z' }));
      graph.addEvent(
        makeEvent({
          id: 'a2',
          title: 'Middle',
          timestamp: '2023-11-16T00:00:00Z',
          causalPredecessors: ['a1'],
        })
      );
      graph.addEvent(
        makeEvent({
          id: 'a3',
          title: 'End',
          timestamp: '2023-11-17T00:00:00Z',
          causalPredecessors: ['a2'],
        })
      );

      const ancestors = graph.getCausalAncestors('a3');
      expect(ancestors).toHaveLength(2);
    });

    it('should return empty for event with no causal links', () => {
      graph.addEvent(makeEvent({ id: 'solo', title: 'Solo' }));
      expect(graph.getCausalDescendants('solo')).toEqual([]);
      expect(graph.getCausalAncestors('solo')).toEqual([]);
    });
  });

  // --- Graph statistics ---

  describe('Graph statistics', () => {
    it('should compute statistics for populated graph', () => {
      const e1 = graph.addEntity(makeEntity({ name: 'A' }));
      const e2 = graph.addEntity(makeEntity({ name: 'B' }));
      graph.addEvent(
        makeEvent({ participants: [e1.id, e2.id], timestamp: '2023-11-17T00:00:00Z' })
      );
      graph.addTension(makeTension({ parties: [e1.id, e2.id] }));

      const stats = graph.computeStatistics();
      expect(stats.entityCount).toBe(2);
      expect(stats.eventCount).toBe(1);
      expect(stats.tensionCount).toBe(1);
      expect(stats.density).toBeGreaterThan(0);
      expect(stats.timeSpan).not.toBeNull();
    });

    it('should handle empty graph', () => {
      const stats = graph.computeStatistics();
      expect(stats.entityCount).toBe(0);
      expect(stats.density).toBe(0);
      expect(stats.timeSpan).toBeNull();
    });

    it('should rank entities by importance', () => {
      const e1 = graph.addEntity(makeEntity({ name: 'Hub' }));
      const e2 = graph.addEntity(makeEntity({ name: 'Spoke1' }));
      const e3 = graph.addEntity(makeEntity({ name: 'Spoke2' }));
      const e4 = graph.addEntity(makeEntity({ name: 'Spoke3' }));

      // Hub connects to all spokes
      graph.addEvent(makeEvent({ participants: [e1.id, e2.id] }));
      graph.addEvent(makeEvent({ participants: [e1.id, e3.id] }));
      graph.addEvent(makeEvent({ participants: [e1.id, e4.id] }));

      const ranking = graph.getEntityImportanceRanking(3);
      expect(ranking.length).toBeGreaterThan(0);
      expect(ranking[0].name).toBe('Hub');
    });
  });

  // --- Bulk operations ---

  describe('Bulk operations', () => {
    it('should load a snapshot', () => {
      const entity = { ...makeEntity({ id: 'e1', name: 'Loaded' }), id: 'e1' } as Entity;
      graph.load({
        entities: [entity],
        events: [],
        tensions: [],
        arcs: [],
      });

      expect(graph.getEntity('e1')?.name).toBe('Loaded');
    });

    it('should clear all data', () => {
      graph.addEntity(makeEntity({ name: 'X' }));
      graph.addEvent(makeEvent({ title: 'Y' }));
      graph.addTension(makeTension({ name: 'Z' }));
      graph.addArc(makeArc({ name: 'W' }));

      graph.clear();

      expect(graph.getAllEntities()).toEqual([]);
      expect(graph.getAllEvents()).toEqual([]);
      expect(graph.getAllTensions()).toEqual([]);
      expect(graph.getAllArcs()).toEqual([]);
    });
  });

  // --- Performance ---

  describe('Performance', () => {
    it('should handle 1000+ entities without degradation', () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        graph.addEntity(makeEntity({ name: `Entity-${i}` }));
      }

      // Add events connecting some entities
      for (let i = 0; i < 500; i++) {
        const entities = graph.getAllEntities();
        graph.addEvent(
          makeEvent({
            title: `Event-${i}`,
            timestamp: new Date(2023, 10, 17, 0, 0, i).toISOString(),
            participants: [entities[i].id, entities[(i + 1) % 1000].id],
          })
        );
      }

      expect(Date.now() - start).toBeLessThan(10000);
      expect(graph.getAllEntities()).toHaveLength(1000);
      expect(graph.getAllEvents()).toHaveLength(500);

      // Snapshot should complete quickly
      const snapStart = Date.now();
      graph.getSnapshot();
      const snapElapsed = Date.now() - snapStart;
      expect(snapElapsed).toBeLessThan(1000); // Under 1 second

      // Statistics should complete
      const statsStart = Date.now();
      graph.computeStatistics();
      const statsElapsed = Date.now() - statsStart;
      expect(statsElapsed).toBeLessThan(5000); // Under 5 seconds
    });
  });

  // --- Subgraph extraction ---

  describe('Subgraph extraction', () => {
    it('should extract connected subgraph for entity', () => {
      const e1 = graph.addEntity(makeEntity({ name: 'Center' }));
      const e2 = graph.addEntity(makeEntity({ name: 'Connected' }));
      graph.addEntity(makeEntity({ name: 'Isolated' }));

      graph.addEvent(makeEvent({ participants: [e1.id, e2.id] }));
      graph.addTension(makeTension({ parties: [e1.id, e2.id] }));

      const subgraph = graph.getSubgraphForEntity(e1.id, 1);
      expect(subgraph.entities).toHaveLength(2);
      expect(subgraph.events).toHaveLength(1);
      expect(subgraph.tensions).toHaveLength(1);
      expect(subgraph.entities.find((e) => e.name === 'Isolated')).toBeUndefined();
    });
  });
});

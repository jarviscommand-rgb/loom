import { v4 as uuid } from 'uuid';
import type {
  Entity,
  NarrativeEvent,
  Tension,
  NarrativeArc,
  GraphSnapshot,
  GraphStatistics,
} from './types.js';

// ============================================================
// LOOM — Temporal Graph Engine
//
// Indexed, queryable graph with causal chain traversal,
// subgraph extraction, centrality, and time-windowed queries.
// ============================================================

/**
 * In-memory temporal causal graph engine.
 *
 * Stores entities, events, tensions, and narrative arcs with
 * secondary indexes for fast lookups. Supports causal chain traversal,
 * subgraph extraction, centrality measures, and time-windowed queries.
 */
export class TemporalGraph {
  // --- Primary storage ---
  private entities: Map<string, Entity> = new Map();
  private events: Map<string, NarrativeEvent> = new Map();
  private tensions: Map<string, Tension> = new Map();
  private arcs: Map<string, NarrativeArc> = new Map();

  // --- Secondary indexes ---

  /** Entity name (lowercased) → entity ID. */
  private entityNameIndex: Map<string, string> = new Map();

  /** Event timestamps sorted for binary search. Rebuilt on mutation. */
  private eventTimeIndex: Array<{ time: number; id: string }> = [];
  private eventTimeIndexDirty = true;

  /** Entity ID → set of tension IDs involving that entity. */
  private entityTensionIndex: Map<string, Set<string>> = new Map();

  /** Entity ID → set of event IDs the entity participates in. */
  private entityEventIndex: Map<string, Set<string>> = new Map();

  /** Event ID → set of event IDs that causally follow it. */
  private causalSuccessorIndex: Map<string, Set<string>> = new Map();

  // ============================================================
  // Entity operations
  // ============================================================

  /** Add or update an entity in the graph. Returns the stored entity. */
  addEntity(entity: Omit<Entity, 'id'> & { id?: string }): Entity {
    const e: Entity = { ...entity, id: entity.id || uuid() };
    this.entities.set(e.id, e);
    this.entityNameIndex.set(e.name.toLowerCase(), e.id);
    return e;
  }

  /** Look up an entity by ID. */
  getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  /** Case-insensitive name lookup using the name index. */
  findEntityByName(name: string): Entity | undefined {
    const id = this.entityNameIndex.get(name.toLowerCase());
    return id ? this.entities.get(id) : undefined;
  }

  /**
   * Fuzzy entity name search. Returns entities whose name contains the
   * query string (case-insensitive) or has Levenshtein distance ≤ threshold.
   */
  findEntitiesFuzzy(query: string, maxDistance = 2): Entity[] {
    const lower = query.toLowerCase();
    const results: Array<{ entity: Entity; distance: number }> = [];

    for (const entity of this.entities.values()) {
      const nameLower = entity.name.toLowerCase();
      // Substring match is distance 0
      if (nameLower.includes(lower) || lower.includes(nameLower)) {
        results.push({ entity, distance: 0 });
        continue;
      }
      const dist = levenshtein(lower, nameLower);
      if (dist <= maxDistance) {
        results.push({ entity, distance: dist });
      }
    }

    return results.sort((a, b) => a.distance - b.distance).map((r) => r.entity);
  }

  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  // ============================================================
  // Event operations
  // ============================================================

  /** Add an event and update all related indexes. */
  addEvent(event: Omit<NarrativeEvent, 'id'> & { id?: string }): NarrativeEvent {
    const e: NarrativeEvent = { ...event, id: event.id || uuid() };
    this.events.set(e.id, e);
    this.eventTimeIndexDirty = true;

    // Update entity-event index
    for (const pid of e.participants) {
      let set = this.entityEventIndex.get(pid);
      if (!set) {
        set = new Set();
        this.entityEventIndex.set(pid, set);
      }
      set.add(e.id);
    }

    // Update causal successor index
    for (const predId of e.causalPredecessors) {
      let set = this.causalSuccessorIndex.get(predId);
      if (!set) {
        set = new Set();
        this.causalSuccessorIndex.set(predId, set);
      }
      set.add(e.id);
    }

    return e;
  }

  getEvent(id: string): NarrativeEvent | undefined {
    return this.events.get(id);
  }

  /** All events, sorted chronologically. */
  getAllEvents(): NarrativeEvent[] {
    return Array.from(this.events.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /** Events within a time range (inclusive), using the time index for efficiency. */
  getEventsInRange(from: string, to: string): NarrativeEvent[] {
    this.rebuildTimeIndex();
    const fromTime = new Date(from).getTime();
    const toTime = new Date(to).getTime();

    // Binary search for start position
    let lo = 0;
    let hi = this.eventTimeIndex.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.eventTimeIndex[mid].time < fromTime) lo = mid + 1;
      else hi = mid;
    }

    const results: NarrativeEvent[] = [];
    for (let i = lo; i < this.eventTimeIndex.length; i++) {
      const entry = this.eventTimeIndex[i];
      if (entry.time > toTime) break;
      const event = this.events.get(entry.id);
      if (event) results.push(event);
    }
    return results;
  }

  /** Events for a specific entity, using the entity-event index. */
  getEventsForEntity(entityId: string): NarrativeEvent[] {
    const eventIds = this.entityEventIndex.get(entityId);
    if (!eventIds) return [];
    const result: NarrativeEvent[] = [];
    for (const eid of eventIds) {
      const event = this.events.get(eid);
      if (event) result.push(event);
    }
    return result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // ============================================================
  // Tension operations
  // ============================================================

  /** Add a tension and update the entity-tension index. */
  addTension(tension: Omit<Tension, 'id'> & { id?: string }): Tension {
    const t: Tension = { ...tension, id: tension.id || uuid() };
    this.tensions.set(t.id, t);

    // Index by parties
    for (const partyId of t.parties) {
      let set = this.entityTensionIndex.get(partyId);
      if (!set) {
        set = new Set();
        this.entityTensionIndex.set(partyId, set);
      }
      set.add(t.id);
    }

    return t;
  }

  getTension(id: string): Tension | undefined {
    return this.tensions.get(id);
  }

  getAllTensions(): Tension[] {
    return Array.from(this.tensions.values());
  }

  getActiveTensions(): Tension[] {
    return this.getAllTensions().filter((t) => t.status !== 'resolved');
  }

  /** Get all tensions involving a specific entity. */
  getTensionsForEntity(entityId: string): Tension[] {
    const tids = this.entityTensionIndex.get(entityId);
    if (!tids) return [];
    const result: Tension[] = [];
    for (const tid of tids) {
      const t = this.tensions.get(tid);
      if (t) result.push(t);
    }
    return result;
  }

  // ============================================================
  // Arc operations
  // ============================================================

  addArc(arc: Omit<NarrativeArc, 'id'> & { id?: string }): NarrativeArc {
    const a: NarrativeArc = { ...arc, id: arc.id || uuid() };
    this.arcs.set(a.id, a);
    return a;
  }

  getArc(id: string): NarrativeArc | undefined {
    return this.arcs.get(id);
  }

  getAllArcs(): NarrativeArc[] {
    return Array.from(this.arcs.values());
  }

  // ============================================================
  // Causal chain traversal
  // ============================================================

  /**
   * Follow causal links forward from an event.
   * Returns all descendant events in breadth-first order.
   */
  getCausalDescendants(eventId: string): NarrativeEvent[] {
    const visited = new Set<string>();
    const queue: string[] = [eventId];
    const results: NarrativeEvent[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const successors = this.causalSuccessorIndex.get(current);
      if (!successors) continue;

      for (const sid of successors) {
        if (!visited.has(sid)) {
          const event = this.events.get(sid);
          if (event) {
            results.push(event);
            queue.push(sid);
          }
        }
      }
    }

    return results.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Follow causal links backward from an event.
   * Returns all ancestor events in reverse-chronological order.
   */
  getCausalAncestors(eventId: string): NarrativeEvent[] {
    const visited = new Set<string>();
    const queue: string[] = [eventId];
    const results: NarrativeEvent[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const event = this.events.get(current);
      if (!event) continue;

      for (const predId of event.causalPredecessors) {
        if (!visited.has(predId)) {
          const pred = this.events.get(predId);
          if (pred) {
            results.push(pred);
            queue.push(predId);
          }
        }
      }
    }

    return results.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // ============================================================
  // Subgraph extraction
  // ============================================================

  /**
   * Extract a connected component centered on a specific entity.
   * Returns all entities, events, and tensions reachable through
   * event co-participation and tension relationships.
   */
  getSubgraphForEntity(
    entityId: string,
    maxDepth = 2
  ): {
    entities: Entity[];
    events: NarrativeEvent[];
    tensions: Tension[];
  } {
    const visitedEntities = new Set<string>();
    const visitedEvents = new Set<string>();
    const visitedTensions = new Set<string>();
    const entityQueue: Array<{ id: string; depth: number }> = [{ id: entityId, depth: 0 }];

    while (entityQueue.length > 0) {
      const { id, depth } = entityQueue.shift()!;
      if (visitedEntities.has(id) || depth > maxDepth) continue;
      visitedEntities.add(id);

      // Gather events this entity participates in
      const events = this.getEventsForEntity(id);
      for (const event of events) {
        visitedEvents.add(event.id);
        // Enqueue co-participants at depth + 1
        if (depth < maxDepth) {
          for (const pid of event.participants) {
            if (!visitedEntities.has(pid)) {
              entityQueue.push({ id: pid, depth: depth + 1 });
            }
          }
        }
      }

      // Gather tensions involving this entity
      const tensions = this.getTensionsForEntity(id);
      for (const tension of tensions) {
        visitedTensions.add(tension.id);
        // Enqueue opposing party
        if (depth < maxDepth) {
          for (const partyId of tension.parties) {
            if (!visitedEntities.has(partyId)) {
              entityQueue.push({ id: partyId, depth: depth + 1 });
            }
          }
        }
      }
    }

    return {
      entities: Array.from(visitedEntities)
        .map((id) => this.entities.get(id))
        .filter((e): e is Entity => e !== undefined),
      events: Array.from(visitedEvents)
        .map((id) => this.events.get(id))
        .filter((e): e is NarrativeEvent => e !== undefined)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
      tensions: Array.from(visitedTensions)
        .map((id) => this.tensions.get(id))
        .filter((t): t is Tension => t !== undefined),
    };
  }

  // ============================================================
  // Graph statistics
  // ============================================================

  /** Compute graph-level statistics including density, clustering, and centrality. */
  computeStatistics(): GraphStatistics {
    const entityCount = this.entities.size;
    const eventCount = this.events.size;
    const tensionCount = this.tensions.size;
    const arcCount = this.arcs.size;

    // Build adjacency from co-participation in events
    const adjacency = this.buildEntityAdjacency();
    const density = this.computeDensity(adjacency, entityCount);
    const clustering = this.computeClusteringCoefficient(adjacency);
    const centrality = this.computeBetweennessCentrality(adjacency);
    const timeSpan = this.computeTimeSpan();

    return {
      entityCount,
      eventCount,
      tensionCount,
      arcCount,
      density,
      clusteringCoefficient: clustering,
      centralEntities: centrality,
      timeSpan,
    };
  }

  /**
   * Rank entities by betweenness centrality.
   * Returns top entities sorted by centrality score (descending).
   */
  getEntityImportanceRanking(
    topN = 10
  ): Array<{ entityId: string; name: string; centrality: number }> {
    const adjacency = this.buildEntityAdjacency();
    const centrality = this.computeBetweennessCentrality(adjacency);
    return centrality.slice(0, topN).map((c) => ({
      entityId: c.entityId,
      name: this.entities.get(c.entityId)?.name || c.entityId,
      centrality: c.centrality,
    }));
  }

  // ============================================================
  // Snapshots
  // ============================================================

  /** Get a snapshot of the graph at a specific point in time. */
  getSnapshotAt(timestamp: string): GraphSnapshot {
    const t = new Date(timestamp).getTime();

    const entities = this.getAllEntities().filter((e) => new Date(e.firstSeen).getTime() <= t);
    const events = this.getAllEvents().filter((e) => new Date(e.timestamp).getTime() <= t);
    const tensions = this.getAllTensions().filter((ten) => {
      const from = new Date(ten.validFrom).getTime();
      const to = ten.validTo ? new Date(ten.validTo).getTime() : Infinity;
      return from <= t && t <= to;
    });
    const arcs = this.getAllArcs().filter((a) => {
      const start = new Date(a.startDate).getTime();
      const end = a.endDate ? new Date(a.endDate).getTime() : Infinity;
      return start <= t && t <= end;
    });

    return { entities, events, tensions, arcs, timestamp };
  }

  /** Get the full current snapshot. */
  getSnapshot(): GraphSnapshot {
    return {
      entities: this.getAllEntities(),
      events: this.getAllEvents(),
      tensions: this.getAllTensions(),
      arcs: this.getAllArcs(),
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================================
  // Bulk operations
  // ============================================================

  /** Load a snapshot into the graph, updating all indexes. */
  load(snapshot: Omit<GraphSnapshot, 'timestamp'>): void {
    for (const e of snapshot.entities) this.addEntity(e);
    for (const e of snapshot.events) this.addEvent(e);
    for (const t of snapshot.tensions) this.addTension(t);
    for (const a of snapshot.arcs) this.addArc(a);
  }

  /** Clear all data and indexes. */
  clear(): void {
    this.entities.clear();
    this.events.clear();
    this.tensions.clear();
    this.arcs.clear();
    this.entityNameIndex.clear();
    this.eventTimeIndex = [];
    this.eventTimeIndexDirty = true;
    this.entityTensionIndex.clear();
    this.entityEventIndex.clear();
    this.causalSuccessorIndex.clear();
  }

  // ============================================================
  // Private: Index management
  // ============================================================

  /** Rebuild the sorted event time index if dirty. */
  private rebuildTimeIndex(): void {
    if (!this.eventTimeIndexDirty) return;
    this.eventTimeIndex = Array.from(this.events.values())
      .map((e) => ({ time: new Date(e.timestamp).getTime(), id: e.id }))
      .sort((a, b) => a.time - b.time);
    this.eventTimeIndexDirty = false;
  }

  // ============================================================
  // Private: Graph algorithms
  // ============================================================

  /**
   * Build an undirected adjacency list from entity co-participation in events
   * and from tension party relationships.
   */
  private buildEntityAdjacency(): Map<string, Set<string>> {
    const adj: Map<string, Set<string>> = new Map();

    const ensureNode = (id: string) => {
      if (!adj.has(id)) adj.set(id, new Set());
    };

    // All entities should appear even if isolated
    for (const id of this.entities.keys()) {
      ensureNode(id);
    }

    // Co-participation edges
    for (const event of this.events.values()) {
      const participants = event.participants;
      for (let i = 0; i < participants.length; i++) {
        for (let j = i + 1; j < participants.length; j++) {
          ensureNode(participants[i]);
          ensureNode(participants[j]);
          adj.get(participants[i])!.add(participants[j]);
          adj.get(participants[j])!.add(participants[i]);
        }
      }
    }

    // Tension party edges
    for (const tension of this.tensions.values()) {
      const [a, b] = tension.parties;
      ensureNode(a);
      ensureNode(b);
      adj.get(a)!.add(b);
      adj.get(b)!.add(a);
    }

    return adj;
  }

  /** Graph density: ratio of actual edges to maximum possible edges. */
  private computeDensity(adjacency: Map<string, Set<string>>, n: number): number {
    if (n < 2) return 0;
    let edgeCount = 0;
    for (const neighbors of adjacency.values()) {
      edgeCount += neighbors.size;
    }
    edgeCount /= 2; // undirected
    const maxEdges = (n * (n - 1)) / 2;
    return edgeCount / maxEdges;
  }

  /** Average local clustering coefficient across all nodes. */
  private computeClusteringCoefficient(adjacency: Map<string, Set<string>>): number {
    if (adjacency.size === 0) return 0;
    let totalCoeff = 0;
    let countWithNeighbors = 0;

    for (const [, neighbors] of adjacency) {
      const k = neighbors.size;
      if (k < 2) continue;
      countWithNeighbors++;

      // Count edges between neighbors
      let triangles = 0;
      const neighborArray = Array.from(neighbors);
      for (let i = 0; i < neighborArray.length; i++) {
        for (let j = i + 1; j < neighborArray.length; j++) {
          const ni = adjacency.get(neighborArray[i]);
          if (ni && ni.has(neighborArray[j])) {
            triangles++;
          }
        }
      }
      const possibleTriangles = (k * (k - 1)) / 2;
      totalCoeff += triangles / possibleTriangles;
    }

    return countWithNeighbors === 0 ? 0 : totalCoeff / countWithNeighbors;
  }

  /**
   * Approximate betweenness centrality using Brandes' algorithm.
   * Returns top entities sorted by centrality (descending).
   */
  private computeBetweennessCentrality(
    adjacency: Map<string, Set<string>>
  ): Array<{ entityId: string; centrality: number }> {
    const nodes = Array.from(adjacency.keys());
    const n = nodes.length;
    if (n < 3) {
      return nodes.map((id) => ({ entityId: id, centrality: 0 }));
    }

    const centrality = new Map<string, number>();
    for (const id of nodes) centrality.set(id, 0);

    // Brandes' algorithm
    for (const source of nodes) {
      const stack: string[] = [];
      const predecessors = new Map<string, string[]>();
      const sigma = new Map<string, number>(); // number of shortest paths
      const dist = new Map<string, number>();
      const delta = new Map<string, number>();

      for (const v of nodes) {
        predecessors.set(v, []);
        sigma.set(v, 0);
        dist.set(v, -1);
        delta.set(v, 0);
      }

      sigma.set(source, 1);
      dist.set(source, 0);
      const queue: string[] = [source];

      // BFS
      while (queue.length > 0) {
        const v = queue.shift()!;
        stack.push(v);
        const dv = dist.get(v)!;
        const neighbors = adjacency.get(v);
        if (!neighbors) continue;

        for (const w of neighbors) {
          // First visit
          if (dist.get(w)! < 0) {
            dist.set(w, dv + 1);
            queue.push(w);
          }
          // Shortest path via v?
          if (dist.get(w) === dv + 1) {
            sigma.set(w, sigma.get(w)! + sigma.get(v)!);
            predecessors.get(w)!.push(v);
          }
        }
      }

      // Back-propagation
      while (stack.length > 0) {
        const w = stack.pop()!;
        for (const v of predecessors.get(w)!) {
          const contribution = (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!);
          delta.set(v, delta.get(v)! + contribution);
        }
        if (w !== source) {
          centrality.set(w, centrality.get(w)! + delta.get(w)!);
        }
      }
    }

    // Normalize
    const normFactor = n > 2 ? (n - 1) * (n - 2) : 1;
    const results: Array<{ entityId: string; centrality: number }> = [];
    for (const [id, value] of centrality) {
      results.push({ entityId: id, centrality: value / normFactor });
    }

    return results.sort((a, b) => b.centrality - a.centrality);
  }

  /** Compute the temporal span of all events. */
  private computeTimeSpan(): { earliest: string; latest: string } | null {
    const events = this.getAllEvents();
    if (events.length === 0) return null;
    return {
      earliest: events[0].timestamp,
      latest: events[events.length - 1].timestamp,
    };
  }
}

// ============================================================
// Utility: Levenshtein distance for fuzzy matching
// ============================================================

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Use single-row optimization
  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);

  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

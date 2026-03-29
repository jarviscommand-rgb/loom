import { v4 as uuid } from 'uuid';
import type {
  Entity,
  NarrativeEvent,
  Tension,
  NarrativeArc,
  GraphSnapshot,
  PressurePoint,
} from './types.js';

export class TemporalGraph {
  private entities: Map<string, Entity> = new Map();
  private events: Map<string, NarrativeEvent> = new Map();
  private tensions: Map<string, Tension> = new Map();
  private arcs: Map<string, NarrativeArc> = new Map();

  // --- Entity operations ---

  addEntity(entity: Omit<Entity, 'id'> & { id?: string }): Entity {
    const e: Entity = { ...entity, id: entity.id || uuid() };
    this.entities.set(e.id, e);
    return e;
  }

  getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  findEntityByName(name: string): Entity | undefined {
    for (const e of this.entities.values()) {
      if (e.name.toLowerCase() === name.toLowerCase()) return e;
    }
    return undefined;
  }

  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  // --- Event operations ---

  addEvent(event: Omit<NarrativeEvent, 'id'> & { id?: string }): NarrativeEvent {
    const e: NarrativeEvent = { ...event, id: event.id || uuid() };
    this.events.set(e.id, e);
    return e;
  }

  getEvent(id: string): NarrativeEvent | undefined {
    return this.events.get(id);
  }

  getAllEvents(): NarrativeEvent[] {
    return Array.from(this.events.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  getEventsInRange(from: string, to: string): NarrativeEvent[] {
    const fromTime = new Date(from).getTime();
    const toTime = new Date(to).getTime();
    return this.getAllEvents().filter((e) => {
      const t = new Date(e.timestamp).getTime();
      return t >= fromTime && t <= toTime;
    });
  }

  getEventsForEntity(entityId: string): NarrativeEvent[] {
    return this.getAllEvents().filter((e) => e.participants.includes(entityId));
  }

  // --- Tension operations ---

  addTension(tension: Omit<Tension, 'id'> & { id?: string }): Tension {
    const t: Tension = { ...tension, id: tension.id || uuid() };
    this.tensions.set(t.id, t);
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

  // --- Arc operations ---

  addArc(arc: Omit<NarrativeArc, 'id'> & { id?: string }): NarrativeArc {
    const a: NarrativeArc = { ...arc, id: arc.id || uuid() };
    this.arcs.set(a.id, a);
    return a;
  }

  getAllArcs(): NarrativeArc[] {
    return Array.from(this.arcs.values());
  }

  // --- Snapshot at time T ---

  getSnapshotAt(timestamp: string): GraphSnapshot {
    const t = new Date(timestamp).getTime();

    const entities = this.getAllEntities().filter(
      (e) => new Date(e.firstSeen).getTime() <= t
    );

    const events = this.getAllEvents().filter(
      (e) => new Date(e.timestamp).getTime() <= t
    );

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

  // --- Current full snapshot ---

  getSnapshot(): GraphSnapshot {
    return {
      entities: this.getAllEntities(),
      events: this.getAllEvents(),
      tensions: this.getAllTensions(),
      arcs: this.getAllArcs(),
      timestamp: new Date().toISOString(),
    };
  }

  // --- Tension Radar ---

  computePressurePoints(): PressurePoint[] {
    const activeTensions = this.getActiveTensions();
    const points: PressurePoint[] = [];

    for (const tension of activeTensions) {
      const durationDays = tension.duration;
      const durationScore = Math.min(durationDays / 30, 1); // max at 30 days

      const escalationScore =
        tension.status === 'critical'
          ? 1.0
          : tension.status === 'escalating'
            ? 0.7
            : tension.status === 'simmering'
              ? 0.3
              : 0.1;

      // Convergence: how many other tensions share the same parties
      const partySet = new Set(tension.parties);
      let convergenceCount = 0;
      for (const other of activeTensions) {
        if (other.id === tension.id) continue;
        if (other.parties.some((p) => partySet.has(p))) convergenceCount++;
      }
      const convergenceScore = Math.min(convergenceCount / 3, 1);

      const score =
        tension.intensity * 0.3 +
        durationScore * 0.2 +
        escalationScore * 0.3 +
        convergenceScore * 0.2;

      points.push({
        tensionId: tension.id,
        tensionName: tension.name,
        score,
        factors: {
          duration: durationScore,
          escalation: escalationScore,
          convergence: convergenceScore,
        },
        narrative: this.generatePressureNarrative(tension, score),
      });
    }

    return points.sort((a, b) => b.score - a.score);
  }

  private generatePressureNarrative(tension: Tension, score: number): string {
    const urgency =
      score > 0.8 ? 'CRITICAL' : score > 0.5 ? 'Elevated' : 'Developing';

    const entity1 = this.getEntity(tension.parties[0]);
    const entity2 = this.getEntity(tension.parties[1]);

    const name1 = entity1?.name || tension.parties[0];
    const name2 = entity2?.name || tension.parties[1];

    return `[${urgency}] The tension between ${name1} and ${name2} — "${tension.name}" — has been ${tension.status} for ${tension.duration} days. ${tension.description}`;
  }

  // --- Bulk load ---

  load(snapshot: Omit<GraphSnapshot, 'timestamp'>): void {
    for (const e of snapshot.entities) this.entities.set(e.id, e);
    for (const e of snapshot.events) this.events.set(e.id, e);
    for (const t of snapshot.tensions) this.tensions.set(t.id, t);
    for (const a of snapshot.arcs) this.arcs.set(a.id, a);
  }

  clear(): void {
    this.entities.clear();
    this.events.clear();
    this.tensions.clear();
    this.arcs.clear();
  }
}

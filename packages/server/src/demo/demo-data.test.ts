import { describe, it, expect } from 'vitest';
import { demoEntities, demoEvents, demoTensions, demoArcs } from './openai-crisis.js';
import {
  aiBubbleEntities,
  aiBubbleEvents,
  aiBubbleTensions,
  aiBubbleArcs,
} from './nvidia-ai-bubble.js';
import {
  techWarEntities,
  techWarEvents,
  techWarTensions,
  techWarArcs,
} from './us-china-tech-war.js';
import type { Entity, NarrativeEvent, Tension, NarrativeArc } from '../graph/types.js';

// ============================================================
// LOOM — Demo Data Structural Validation Tests
//
// Ensures all demo scenario data conforms to type contracts
// and has referential integrity (entity IDs match, events
// reference valid participants, etc.).
// ============================================================

/** Validate entity structural integrity. */
function validateEntities(entities: Entity[], label: string) {
  describe(`${label} entities`, () => {
    it('should have at least one entity', () => {
      expect(entities.length).toBeGreaterThan(0);
    });

    it('should have unique IDs', () => {
      const ids = entities.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should have all required fields', () => {
      for (const entity of entities) {
        expect(entity.id).toBeTruthy();
        expect(entity.name).toBeTruthy();
        expect(entity.type).toBeTruthy();
        expect(['person', 'company', 'institution', 'group', 'concept']).toContain(entity.type);
        expect(entity.motivation).toBeTruthy();
        expect(entity.capability).toBeTruthy();
        expect(Array.isArray(entity.alliances)).toBe(true);
        expect(entity.description).toBeTruthy();
        expect(entity.firstSeen).toBeTruthy();
        expect(entity.lastSeen).toBeTruthy();
      }
    });

    it('should have alliance references that are mostly valid entity IDs', () => {
      const entityIds = new Set(entities.map((e) => e.id));
      let validCount = 0;
      let totalCount = 0;
      for (const entity of entities) {
        for (const allianceId of entity.alliances) {
          totalCount++;
          if (entityIds.has(allianceId)) validCount++;
        }
      }
      // At least 80% of alliance references should point to entities in the dataset
      if (totalCount > 0) {
        expect(validCount / totalCount).toBeGreaterThanOrEqual(0.8);
      }
    });

    it('should have firstSeen <= lastSeen', () => {
      for (const entity of entities) {
        expect(new Date(entity.firstSeen).getTime()).toBeLessThanOrEqual(
          new Date(entity.lastSeen).getTime()
        );
      }
    });
  });
}

/** Validate event structural integrity. */
function validateEvents(events: NarrativeEvent[], entities: Entity[], label: string) {
  const entityIds = new Set(entities.map((e) => e.id));

  describe(`${label} events`, () => {
    it('should have at least one event', () => {
      expect(events.length).toBeGreaterThan(0);
    });

    it('should have unique IDs', () => {
      const ids = events.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should have all required fields', () => {
      for (const event of events) {
        expect(event.id).toBeTruthy();
        expect(event.title).toBeTruthy();
        expect(event.description).toBeTruthy();
        expect(event.timestamp).toBeTruthy();
        expect(Array.isArray(event.participants)).toBe(true);
        expect(event.participants.length).toBeGreaterThan(0);
        expect(Array.isArray(event.causalPredecessors)).toBe(true);
        expect(typeof event.impact).toBe('number');
        expect(event.impact).toBeGreaterThanOrEqual(0);
        expect(event.impact).toBeLessThanOrEqual(1);
        expect(typeof event.sentiment).toBe('number');
        expect(event.sentiment).toBeGreaterThanOrEqual(-1);
        expect(event.sentiment).toBeLessThanOrEqual(1);
      }
    });

    it('should reference valid entity IDs in participants', () => {
      for (const event of events) {
        for (const participantId of event.participants) {
          expect(entityIds.has(participantId)).toBe(true);
        }
      }
    });

    it('should reference valid event IDs in causal predecessors', () => {
      const eventIds = new Set(events.map((e) => e.id));
      for (const event of events) {
        for (const predId of event.causalPredecessors) {
          expect(eventIds.has(predId)).toBe(true);
        }
      }
    });
  });
}

/** Validate tension structural integrity. */
function validateTensions(tensions: Tension[], entities: Entity[], label: string) {
  const entityIds = new Set(entities.map((e) => e.id));

  describe(`${label} tensions`, () => {
    it('should have at least one tension', () => {
      expect(tensions.length).toBeGreaterThan(0);
    });

    it('should have unique IDs', () => {
      const ids = tensions.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should have all required fields', () => {
      for (const tension of tensions) {
        expect(tension.id).toBeTruthy();
        expect(tension.name).toBeTruthy();
        expect(tension.description).toBeTruthy();
        expect(tension.parties).toHaveLength(2);
        expect(['simmering', 'escalating', 'critical', 'resolving', 'resolved']).toContain(
          tension.status
        );
        expect(typeof tension.intensity).toBe('number');
        expect(tension.intensity).toBeGreaterThanOrEqual(0);
        expect(tension.intensity).toBeLessThanOrEqual(1);
        expect(typeof tension.duration).toBe('number');
        expect(tension.duration).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(tension.relatedEvents)).toBe(true);
        expect(tension.validFrom).toBeTruthy();
      }
    });

    it('should reference valid entity IDs in parties', () => {
      for (const tension of tensions) {
        for (const partyId of tension.parties) {
          expect(entityIds.has(partyId)).toBe(true);
        }
      }
    });
  });
}

/** Validate arc structural integrity. */
function validateArcs(arcs: NarrativeArc[], entities: Entity[], label: string) {
  const entityIds = new Set(entities.map((e) => e.id));

  describe(`${label} arcs`, () => {
    it('should have at least one arc', () => {
      expect(arcs.length).toBeGreaterThan(0);
    });

    it('should have unique IDs', () => {
      const ids = arcs.map((a) => a.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should have all required fields', () => {
      for (const arc of arcs) {
        expect(arc.id).toBeTruthy();
        expect(arc.name).toBeTruthy();
        expect(arc.description).toBeTruthy();
        expect(['setup', 'rising_action', 'climax', 'falling_action', 'resolution']).toContain(
          arc.phase
        );
        expect(Array.isArray(arc.characters)).toBe(true);
        expect(arc.characters.length).toBeGreaterThan(0);
        expect(Array.isArray(arc.events)).toBe(true);
        expect(Array.isArray(arc.tensions)).toBe(true);
        expect(arc.startDate).toBeTruthy();
      }
    });

    it('should reference valid entity IDs in characters', () => {
      for (const arc of arcs) {
        for (const charId of arc.characters) {
          expect(entityIds.has(charId)).toBe(true);
        }
      }
    });
  });
}

describe('Demo Data Validation', () => {
  // --- OpenAI Crisis ---
  describe('OpenAI Crisis', () => {
    validateEntities(demoEntities, 'OpenAI Crisis');
    validateEvents(demoEvents, demoEntities, 'OpenAI Crisis');
    validateTensions(demoTensions, demoEntities, 'OpenAI Crisis');
    validateArcs(demoArcs, demoEntities, 'OpenAI Crisis');
  });

  // --- NVIDIA AI Bubble ---
  describe('NVIDIA AI Bubble', () => {
    validateEntities(aiBubbleEntities, 'AI Bubble');
    validateEvents(aiBubbleEvents, aiBubbleEntities, 'AI Bubble');
    validateTensions(aiBubbleTensions, aiBubbleEntities, 'AI Bubble');
    validateArcs(aiBubbleArcs, aiBubbleEntities, 'AI Bubble');
  });

  // --- US-China Tech War ---
  describe('US-China Tech War', () => {
    validateEntities(techWarEntities, 'Tech War');
    validateEvents(techWarEvents, techWarEntities, 'Tech War');
    validateTensions(techWarTensions, techWarEntities, 'Tech War');
    validateArcs(techWarArcs, techWarEntities, 'Tech War');
  });
});

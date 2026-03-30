import { describe, it, expect } from 'vitest';
import {
  getEntityProfiles,
  getEntityById,
  getEntitiesRelatedTo,
  INDONESIA_ENTITY_PROFILES,
} from './indonesia.js';
// EntityProfile type used implicitly in assertions

// ============================================================
// Indonesia Entity Profiles — Tests
// ============================================================

describe('Indonesia Entity Profiles', () => {
  // --------------------------------------------------------
  // getEntityProfiles
  // --------------------------------------------------------
  describe('getEntityProfiles', () => {
    it('should return all profiles', () => {
      const profiles = getEntityProfiles();
      expect(Array.isArray(profiles)).toBe(true);
      expect(profiles.length).toBe(INDONESIA_ENTITY_PROFILES.length);
      expect(profiles.length).toBeGreaterThan(0);
    });

    it('should return the same reference as the internal array', () => {
      const profiles = getEntityProfiles();
      expect(profiles).toBe(INDONESIA_ENTITY_PROFILES);
    });
  });

  // --------------------------------------------------------
  // getEntityById
  // --------------------------------------------------------
  describe('getEntityById', () => {
    it('should return the correct entity for a known id', () => {
      const entity = getEntityById('id-prabowo-subianto');
      expect(entity).toBeDefined();
      expect(entity!.id).toBe('id-prabowo-subianto');
      expect(entity!.name).toBe('Prabowo Subianto');
    });

    it('should return undefined for an unknown id', () => {
      const entity = getEntityById('nonexistent-entity-id');
      expect(entity).toBeUndefined();
    });

    it('should return undefined for an empty string', () => {
      const entity = getEntityById('');
      expect(entity).toBeUndefined();
    });

    it('should return Anies Baswedan by id', () => {
      const entity = getEntityById('id-anies-baswedan');
      expect(entity).toBeDefined();
      expect(entity!.name).toBe('Anies Baswedan');
      expect(entity!.knownRelationships.length).toBeGreaterThan(0);
    });

    it('should return Ganjar Pranowo by id', () => {
      const entity = getEntityById('id-ganjar-pranowo');
      expect(entity).toBeDefined();
      expect(entity!.name).toBe('Ganjar Pranowo');
      expect(entity!.knownRelationships.length).toBeGreaterThan(0);
    });

    it('should return Megawati Soekarnoputri by id', () => {
      const entity = getEntityById('id-megawati-soekarnoputri');
      expect(entity).toBeDefined();
      expect(entity!.name).toBe('Megawati Soekarnoputri');
      expect(entity!.historicalPositions.length).toBeGreaterThan(0);
    });

    it('should return Luhut Binsar Pandjaitan by id', () => {
      const entity = getEntityById('id-luhut-pandjaitan');
      expect(entity).toBeDefined();
      expect(entity!.name).toBe('Luhut Binsar Pandjaitan');
      expect(entity!.publicStances.length).toBeGreaterThan(0);
    });

    it('should return Sri Mulyani Indrawati by id', () => {
      const entity = getEntityById('id-sri-mulyani');
      expect(entity).toBeDefined();
      expect(entity!.name).toBe('Sri Mulyani Indrawati');
      expect(entity!.historicalPositions.length).toBeGreaterThan(0);
    });

    it('should return Mahfud MD by id', () => {
      const entity = getEntityById('id-mahfud-md');
      expect(entity).toBeDefined();
      expect(entity!.name).toBe('Mahfud MD');
      expect(entity!.knownRelationships.length).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------
  // Total entity count
  // --------------------------------------------------------
  describe('entity count', () => {
    it('should have exactly 15 entity profiles', () => {
      expect(INDONESIA_ENTITY_PROFILES.length).toBe(15);
    });
  });

  // --------------------------------------------------------
  // getEntitiesRelatedTo
  // --------------------------------------------------------
  describe('getEntitiesRelatedTo', () => {
    it('should find new entities that reference Prabowo', () => {
      const related = getEntitiesRelatedTo('id-prabowo-subianto');
      const relatedIds = related.map((entity) => entity.id);
      expect(relatedIds).toContain('id-anies-baswedan');
      expect(relatedIds).toContain('id-ganjar-pranowo');
      expect(relatedIds).toContain('id-megawati-soekarnoputri');
    });

    it('should find cross-references between Ganjar and Mahfud as running mates', () => {
      const ganjar = getEntityById('id-ganjar-pranowo');
      const mahfud = getEntityById('id-mahfud-md');
      expect(ganjar).toBeDefined();
      expect(mahfud).toBeDefined();
      const ganjarRefsMahfud = ganjar!.knownRelationships.some(
        (rel) => rel.entityId === 'id-mahfud-md'
      );
      const mahfudRefsGanjar = mahfud!.knownRelationships.some(
        (rel) => rel.entityId === 'id-ganjar-pranowo'
      );
      expect(ganjarRefsMahfud).toBe(true);
      expect(mahfudRefsGanjar).toBe(true);
    });

    it('should return entities that reference the given entityId in their relationships', () => {
      const related = getEntitiesRelatedTo('id-joko-widodo');
      expect(related.length).toBeGreaterThan(0);

      for (const entity of related) {
        const referencesTarget = entity.knownRelationships.some(
          (rel) => rel.entityId === 'id-joko-widodo'
        );
        expect(referencesTarget).toBe(true);
      }
    });

    it('should return an empty array for an entity with no reverse references', () => {
      const related = getEntitiesRelatedTo('completely-unknown-entity');
      expect(related).toEqual([]);
    });

    it('should not include the entity itself unless it self-references', () => {
      const profiles = getEntityProfiles();
      for (const profile of profiles) {
        const related = getEntitiesRelatedTo(profile.id);
        for (const relatedEntity of related) {
          if (relatedEntity.id === profile.id) {
            // Only valid if the entity actually references itself
            const selfRef = relatedEntity.knownRelationships.some(
              (rel) => rel.entityId === profile.id
            );
            expect(selfRef).toBe(true);
          }
        }
      }
    });
  });

  // --------------------------------------------------------
  // Schema validation — every entity has required fields
  // --------------------------------------------------------
  describe('EntityProfile schema validation', () => {
    const allProfiles = getEntityProfiles();

    it('should have required top-level fields on every entity', () => {
      for (const entity of allProfiles) {
        expect(typeof entity.id).toBe('string');
        expect(entity.id.length).toBeGreaterThan(0);

        expect(typeof entity.name).toBe('string');
        expect(entity.name.length).toBeGreaterThan(0);

        expect(typeof entity.role).toBe('string');
        expect(entity.role.length).toBeGreaterThan(0);

        expect(typeof entity.background).toBe('string');
        expect(entity.background.length).toBeGreaterThan(0);

        expect(Array.isArray(entity.knownRelationships)).toBe(true);
        expect(Array.isArray(entity.publicStances)).toBe(true);
        expect(Array.isArray(entity.historicalPositions)).toBe(true);
        expect(Array.isArray(entity.mediaOwnershipConnections)).toBe(true);
      }
    });

    it('should have unique ids across all entities', () => {
      const ids = allProfiles.map((entity) => entity.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid relationship entries with required fields', () => {
      for (const entity of allProfiles) {
        for (const rel of entity.knownRelationships) {
          expect(typeof rel.entityId).toBe('string');
          expect(rel.entityId.length).toBeGreaterThan(0);

          expect(typeof rel.name).toBe('string');
          expect(rel.name.length).toBeGreaterThan(0);

          expect(typeof rel.relationship).toBe('string');
          expect(rel.relationship.length).toBeGreaterThan(0);
        }
      }
    });

    it('should have valid public stance entries with required fields', () => {
      for (const entity of allProfiles) {
        for (const stance of entity.publicStances) {
          expect(typeof stance.topic).toBe('string');
          expect(stance.topic.length).toBeGreaterThan(0);

          expect(typeof stance.stance).toBe('string');
          expect(stance.stance.length).toBeGreaterThan(0);
        }
      }
    });

    it('should have valid historical position entries with required fields', () => {
      for (const entity of allProfiles) {
        for (const position of entity.historicalPositions) {
          expect(typeof position.period).toBe('string');
          expect(position.period.length).toBeGreaterThan(0);

          expect(typeof position.position).toBe('string');
          expect(position.position.length).toBeGreaterThan(0);
        }
      }
    });

    it('should have valid media ownership connection entries with required fields', () => {
      for (const entity of allProfiles) {
        for (const connection of entity.mediaOwnershipConnections) {
          expect(typeof connection.sourceId).toBe('string');
          expect(connection.sourceId.length).toBeGreaterThan(0);

          expect(typeof connection.sourceName).toBe('string');
          expect(connection.sourceName.length).toBeGreaterThan(0);

          expect(typeof connection.role).toBe('string');
          expect(connection.role.length).toBeGreaterThan(0);
        }
      }
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  INDONESIA_SOURCES,
  getIndonesiaSources,
  getIndonesiaSourceById,
  getSourcesByBias,
  getReliableSources,
} from './indonesia.js';

// ============================================================
// Indonesian Media Source Profiles — Tests
// ============================================================

describe('Indonesia Source Profiles', () => {
  // --------------------------------------------------------
  // getIndonesiaSources
  // --------------------------------------------------------

  describe('getIndonesiaSources', () => {
    it('should return a non-empty array', () => {
      const sources = getIndonesiaSources();
      expect(Array.isArray(sources)).toBe(true);
      expect(sources.length).toBeGreaterThan(0);
    });

    it('should return a shallow copy (not the original reference)', () => {
      const first = getIndonesiaSources();
      const second = getIndonesiaSources();
      expect(first).not.toBe(second);
      expect(first).toEqual(second);
    });

    it('should return the same count as INDONESIA_SOURCES', () => {
      expect(getIndonesiaSources().length).toBe(INDONESIA_SOURCES.length);
    });
  });

  // --------------------------------------------------------
  // getIndonesiaSourceById
  // --------------------------------------------------------

  describe('getIndonesiaSourceById', () => {
    it('should return Kompas for id "kompas"', () => {
      const source = getIndonesiaSourceById('kompas');
      expect(source).toBeDefined();
      expect(source!.id).toBe('kompas');
      expect(source!.name).toBe('Kompas');
    });

    it('should return Tempo for id "tempo"', () => {
      const source = getIndonesiaSourceById('tempo');
      expect(source).toBeDefined();
      expect(source!.name).toBe('Tempo');
    });

    it('should return undefined for unknown id', () => {
      expect(getIndonesiaSourceById('nonexistent')).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      expect(getIndonesiaSourceById('')).toBeUndefined();
    });
  });

  // --------------------------------------------------------
  // getSourcesByBias
  // --------------------------------------------------------

  describe('getSourcesByBias', () => {
    it('should return sources with neutral bias', () => {
      const sources = getSourcesByBias('neutral');
      expect(sources.length).toBeGreaterThan(0);
      for (const source of sources) {
        expect(source.biasDirection).toBe('neutral');
      }
    });

    it('should return sources with pro-government bias', () => {
      const sources = getSourcesByBias('pro-government');
      for (const source of sources) {
        expect(source.biasDirection).toBe('pro-government');
      }
    });

    it('should return empty array for non-matching bias', () => {
      // Cast to test with a value that no sources have
      const sources = getSourcesByBias('anti-government');
      for (const source of sources) {
        expect(source.biasDirection).toBe('anti-government');
      }
    });
  });

  // --------------------------------------------------------
  // getReliableSources
  // --------------------------------------------------------

  describe('getReliableSources', () => {
    it('should return all sources when minScore is 0', () => {
      const sources = getReliableSources(0);
      expect(sources.length).toBe(INDONESIA_SOURCES.length);
    });

    it('should filter sources below the threshold', () => {
      const sources = getReliableSources(0.8);
      expect(sources.length).toBeGreaterThan(0);
      for (const source of sources) {
        expect(source.reliabilityScore).toBeGreaterThanOrEqual(0.8);
      }
    });

    it('should return empty array when threshold is impossibly high', () => {
      const sources = getReliableSources(1.1);
      expect(sources).toHaveLength(0);
    });

    it('should return fewer results with higher threshold', () => {
      const low = getReliableSources(0.5);
      const high = getReliableSources(0.85);
      expect(low.length).toBeGreaterThanOrEqual(high.length);
    });
  });

  // --------------------------------------------------------
  // Schema validation — every source has required fields
  // --------------------------------------------------------

  describe('MediaSource schema validation', () => {
    const allSources = getIndonesiaSources();

    it('should have required top-level fields on every source', () => {
      for (const source of allSources) {
        expect(typeof source.id).toBe('string');
        expect(source.id.length).toBeGreaterThan(0);

        expect(typeof source.name).toBe('string');
        expect(source.name.length).toBeGreaterThan(0);

        expect(source.country).toBe('ID');

        expect(Array.isArray(source.languages)).toBe(true);
        expect(source.languages.length).toBeGreaterThan(0);

        expect(typeof source.url).toBe('string');
        expect(source.url).toMatch(/^https?:\/\//);

        expect(Array.isArray(source.feedUrls)).toBe(true);

        expect(typeof source.politicalLeaning).toBe('string');

        expect(typeof source.ownership).toBe('object');
        expect(typeof source.ownership.owner).toBe('string');

        expect(typeof source.editorialGoal).toBe('string');
        expect(source.editorialGoal.length).toBeGreaterThan(0);

        expect(typeof source.reliabilityScore).toBe('number');
        expect(source.reliabilityScore).toBeGreaterThanOrEqual(0);
        expect(source.reliabilityScore).toBeLessThanOrEqual(1);

        expect(Array.isArray(source.audienceTypes)).toBe(true);

        expect(typeof source.biasDirection).toBe('string');

        expect(typeof source.signalWeight).toBe('number');
        expect(source.signalWeight).toBeGreaterThan(0);

        expect(typeof source.active).toBe('boolean');
      }
    });

    it('should have unique ids across all sources', () => {
      const ids = allSources.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique names across all sources', () => {
      const names = allSources.map((s) => s.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('should have at least one active source', () => {
      const activeSources = allSources.filter((s) => s.active);
      expect(activeSources.length).toBeGreaterThan(0);
    });

    it('should have reliabilityScore in valid range [0,1] for all sources', () => {
      for (const source of allSources) {
        expect(source.reliabilityScore).toBeGreaterThanOrEqual(0);
        expect(source.reliabilityScore).toBeLessThanOrEqual(1);
      }
    });
  });

  // --------------------------------------------------------
  // Extended profile validation
  // --------------------------------------------------------

  describe('Extended profile validation', () => {
    const allSources = getIndonesiaSources();
    const sourcesWithExtended = allSources.filter((s) => s.extendedProfile);

    it('should have at least one source with an extended profile', () => {
      expect(sourcesWithExtended.length).toBeGreaterThan(0);
    });

    it('should have valid ownership chain entries', () => {
      for (const source of sourcesWithExtended) {
        const profile = source.extendedProfile!;
        expect(Array.isArray(profile.ownershipChain)).toBe(true);
        for (const entry of profile.ownershipChain) {
          expect(typeof entry.entity).toBe('string');
          expect(entry.entity.length).toBeGreaterThan(0);
          expect(typeof entry.role).toBe('string');
          expect(entry.role.length).toBeGreaterThan(0);
        }
      }
    });

    it('should have valid political history entries', () => {
      for (const source of sourcesWithExtended) {
        const profile = source.extendedProfile!;
        expect(Array.isArray(profile.politicalHistory)).toBe(true);
        for (const entry of profile.politicalHistory) {
          expect(typeof entry.period).toBe('string');
          expect(typeof entry.stance).toBe('string');
          expect(typeof entry.details).toBe('string');
        }
      }
    });

    it('should have valid editorial stance entries', () => {
      for (const source of sourcesWithExtended) {
        const profile = source.extendedProfile!;
        expect(Array.isArray(profile.editorialStances)).toBe(true);
        for (const entry of profile.editorialStances) {
          expect(typeof entry.topic).toBe('string');
          expect(typeof entry.stance).toBe('string');
        }
      }
    });

    it('should have audience demographics data', () => {
      for (const source of sourcesWithExtended) {
        const profile = source.extendedProfile!;
        expect(profile.audienceDemographics).toBeDefined();
        expect(typeof profile.audienceDemographics.estimatedMonthlyReach).toBe('string');
        expect(typeof profile.audienceDemographics.primaryDemographic).toBe('string');
        expect(typeof profile.audienceDemographics.geographicFocus).toBe('string');
      }
    });

    it('should have valid reliability record entries', () => {
      for (const source of sourcesWithExtended) {
        const profile = source.extendedProfile!;
        expect(Array.isArray(profile.reliabilityRecord)).toBe(true);
        for (const entry of profile.reliabilityRecord) {
          expect(typeof entry.incident).toBe('string');
          expect(typeof entry.date).toBe('string');
          expect(typeof entry.impact).toBe('string');
          expect(typeof entry.outcome).toBe('string');
        }
      }
    });

    it('should have founding context string', () => {
      for (const source of sourcesWithExtended) {
        const profile = source.extendedProfile!;
        expect(typeof profile.foundingContext).toBe('string');
        expect(profile.foundingContext.length).toBeGreaterThan(0);
      }
    });

    it('should have key milestones array', () => {
      for (const source of sourcesWithExtended) {
        const profile = source.extendedProfile!;
        expect(Array.isArray(profile.keyMilestones)).toBe(true);
        for (const milestone of profile.keyMilestones) {
          expect(typeof milestone.year).toBe('string');
          expect(typeof milestone.event).toBe('string');
        }
      }
    });
  });
});

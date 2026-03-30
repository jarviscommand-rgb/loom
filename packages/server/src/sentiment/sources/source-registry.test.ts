import { describe, it, expect, beforeEach } from 'vitest';
import { SourceRegistry } from './source-registry';
import type { MediaSource } from '../types';

function makeSource(overrides: Partial<MediaSource> = {}): MediaSource {
  return {
    id: 'custom-src',
    name: 'Custom Source',
    country: 'US',
    languages: ['en'],
    url: 'https://custom.example.com',
    feedUrls: [],
    politicalLeaning: 'centrist',
    ownership: { owner: 'Owner', notes: 'test' },
    editorialGoal: 'General news',
    reliabilityScore: 0.7,
    audienceTypes: ['urban-middle'],
    biasDirection: 'neutral',
    signalWeight: 1.0,
    active: true,
    ...overrides,
  };
}

describe('SourceRegistry', () => {
  let registry: SourceRegistry;

  beforeEach(() => {
    registry = new SourceRegistry();
  });

  // -------------------------------------------------------------------------
  // getById
  // -------------------------------------------------------------------------
  describe('getById', () => {
    it('returns a pre-loaded Indonesian source', () => {
      const kompas = registry.getById('kompas');
      expect(kompas).toBeDefined();
      expect(kompas!.name).toContain('Kompas');
    });

    it('returns undefined for non-existent id', () => {
      expect(registry.getById('non-existent')).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // getAll
  // -------------------------------------------------------------------------
  describe('getAll', () => {
    it('returns all pre-loaded sources', () => {
      const all = registry.getAll();
      expect(all.length).toBeGreaterThanOrEqual(10);
    });
  });

  // -------------------------------------------------------------------------
  // getActive
  // -------------------------------------------------------------------------
  describe('getActive', () => {
    it('returns only active sources', () => {
      const active = registry.getActive();
      for (const source of active) {
        expect(source.active).toBe(true);
      }
    });

    it('excludes deactivated sources', () => {
      registry.setActive('kompas', false);
      const active = registry.getActive();
      const ids = active.map((s) => s.id);
      expect(ids).not.toContain('kompas');
    });
  });

  // -------------------------------------------------------------------------
  // getByCountry
  // -------------------------------------------------------------------------
  describe('getByCountry', () => {
    it('returns Indonesian sources for ID', () => {
      const sources = registry.getByCountry('ID');
      expect(sources.length).toBeGreaterThanOrEqual(10);
      for (const source of sources) {
        expect(source.country).toBe('ID');
      }
    });

    it('returns empty for unknown country', () => {
      expect(registry.getByCountry('XX')).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // filterByBias
  // -------------------------------------------------------------------------
  describe('filterByBias', () => {
    it('filters pro-government sources', () => {
      const proGov = registry.filterByBias('pro-government');
      expect(proGov.length).toBeGreaterThan(0);
      for (const source of proGov) {
        expect(source.biasDirection).toBe('pro-government');
      }
    });

    it('filters neutral sources', () => {
      const neutral = registry.filterByBias('neutral');
      expect(neutral.length).toBeGreaterThan(0);
      for (const source of neutral) {
        expect(source.biasDirection).toBe('neutral');
      }
    });

    it('filters anti-government sources', () => {
      const antiGov = registry.filterByBias('anti-government');
      expect(antiGov.length).toBeGreaterThan(0);
      for (const source of antiGov) {
        expect(source.biasDirection).toBe('anti-government');
      }
    });
  });

  // -------------------------------------------------------------------------
  // filterByLeaning
  // -------------------------------------------------------------------------
  describe('filterByLeaning', () => {
    it('filters by centrist leaning', () => {
      const centrist = registry.filterByLeaning('centrist');
      expect(centrist.length).toBeGreaterThan(0);
      for (const source of centrist) {
        expect(source.politicalLeaning).toBe('centrist');
      }
    });

    it('returns empty for unrepresented leaning', () => {
      // 'islamic-conservative' may not be present in all source sets
      const all = registry.getAll();
      const hasTarget = all.some((s) => s.politicalLeaning === 'islamic-conservative');
      if (!hasTarget) {
        expect(registry.filterByLeaning('islamic-conservative')).toHaveLength(0);
      } else {
        const filtered = registry.filterByLeaning('islamic-conservative');
        for (const source of filtered) {
          expect(source.politicalLeaning).toBe('islamic-conservative');
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // filterByAudience
  // -------------------------------------------------------------------------
  describe('filterByAudience', () => {
    it('filters by urban-middle audience type', () => {
      const urbanMiddle = registry.filterByAudience('urban-middle');
      expect(urbanMiddle.length).toBeGreaterThan(0);
      for (const source of urbanMiddle) {
        expect(source.audienceTypes).toContain('urban-middle');
      }
    });

    it('filters by youth-digital audience type', () => {
      const youth = registry.filterByAudience('youth-digital');
      expect(youth.length).toBeGreaterThan(0);
      for (const source of youth) {
        expect(source.audienceTypes).toContain('youth-digital');
      }
    });
  });

  // -------------------------------------------------------------------------
  // filterByReliability
  // -------------------------------------------------------------------------
  describe('filterByReliability', () => {
    it('filters by minimum reliability score', () => {
      const reliable = registry.filterByReliability(0.8);
      expect(reliable.length).toBeGreaterThan(0);
      for (const source of reliable) {
        expect(source.reliabilityScore).toBeGreaterThanOrEqual(0.8);
      }
    });

    it('returns all for minScore 0', () => {
      const all = registry.filterByReliability(0);
      expect(all.length).toBe(registry.getAll().length);
    });

    it('returns none for minScore 1.0', () => {
      const none = registry.filterByReliability(1.0);
      // No source has exactly 1.0 reliability
      expect(none.length).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // filterByLanguage
  // -------------------------------------------------------------------------
  describe('filterByLanguage', () => {
    it('filters by Indonesian language', () => {
      const idSources = registry.filterByLanguage('id');
      expect(idSources.length).toBeGreaterThan(0);
      for (const source of idSources) {
        expect(source.languages).toContain('id');
      }
    });

    it('filters by English language', () => {
      const enSources = registry.filterByLanguage('en');
      expect(enSources.length).toBeGreaterThan(0);
      for (const source of enSources) {
        expect(source.languages).toContain('en');
      }
    });

    it('returns empty for unknown language', () => {
      expect(registry.filterByLanguage('xx')).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // upsert
  // -------------------------------------------------------------------------
  describe('upsert', () => {
    it('adds a new source', () => {
      const countBefore = registry.count;
      registry.upsert(makeSource({ id: 'new-source' }));
      expect(registry.count).toBe(countBefore + 1);
      expect(registry.getById('new-source')).toBeDefined();
    });

    it('updates an existing source', () => {
      registry.upsert(makeSource({ id: 'kompas', name: 'Updated Kompas' }));
      const updated = registry.getById('kompas');
      expect(updated!.name).toBe('Updated Kompas');
    });
  });

  // -------------------------------------------------------------------------
  // remove
  // -------------------------------------------------------------------------
  describe('remove', () => {
    it('removes an existing source and returns true', () => {
      registry.upsert(makeSource({ id: 'to-remove' }));
      expect(registry.remove('to-remove')).toBe(true);
      expect(registry.getById('to-remove')).toBeUndefined();
    });

    it('returns false for non-existent source', () => {
      expect(registry.remove('non-existent')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // setActive
  // -------------------------------------------------------------------------
  describe('setActive', () => {
    it('deactivates a source', () => {
      const result = registry.setActive('kompas', false);
      expect(result).toBe(true);
      expect(registry.getById('kompas')!.active).toBe(false);
    });

    it('activates a source', () => {
      registry.setActive('kompas', false);
      registry.setActive('kompas', true);
      expect(registry.getById('kompas')!.active).toBe(true);
    });

    it('returns false for non-existent source', () => {
      expect(registry.setActive('non-existent', true)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // computeSignalWeight
  // -------------------------------------------------------------------------
  describe('computeSignalWeight', () => {
    it('returns default 1.0 for non-existent source', () => {
      expect(registry.computeSignalWeight('non-existent', 'positive', true)).toBe(1.0);
    });

    it('gives high weight for pro-gov source with positive non-gov sentiment', () => {
      // Pro-gov + positive + aboutGov: multiplier 0.5 (expected)
      const weight = registry.computeSignalWeight('detik', 'positive', true);
      // detik: reliability 0.6, signalWeight 0.7, pro-gov, positive about gov → 0.5 multiplier
      // 0.6 * 0.5 * 0.7 = 0.21
      expect(weight).toBeCloseTo(0.21, 1);
    });

    it('gives high weight for pro-gov negative about government (unexpected)', () => {
      // detik: reliability 0.6, signalWeight 0.7, pro-gov, negative about gov → 2.5 multiplier
      const weight = registry.computeSignalWeight('detik', 'negative', true);
      // 0.6 * 2.5 * 0.7 = 1.05
      expect(weight).toBeCloseTo(1.05, 1);
    });

    it('gives high weight for anti-gov positive about government (unexpected)', () => {
      // tempo: reliability 0.9, signalWeight 1.0, anti-gov, positive about gov → 2.5 multiplier
      const weight = registry.computeSignalWeight('tempo', 'positive', true);
      // 0.9 * 2.5 * 1.0 = 2.25
      expect(weight).toBeCloseTo(2.25, 1);
    });

    it('uses neutral multiplier for neutral source', () => {
      // kompas: reliability 0.85, signalWeight 1.0, neutral, about gov → 1.0 multiplier
      const weight = registry.computeSignalWeight('kompas', 'positive', true);
      // 0.85 * 1.0 * 1.0 = 0.85
      expect(weight).toBeCloseTo(0.85, 1);
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  getAllMethodologies,
  getMethodology,
  getMethodologiesByModule,
  SCORING_METHODOLOGIES,
} from './methodology.js';
// MethodologyEntry and MethodologyVariable types used implicitly in assertions

// ============================================================
// Methodology Knowledge Base — Tests
// ============================================================

describe('Methodology Knowledge Base', () => {
  // --------------------------------------------------------
  // getAllMethodologies
  // --------------------------------------------------------
  describe('getAllMethodologies', () => {
    it('should return a non-empty array', () => {
      const results = getAllMethodologies();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return a shallow copy (not the original array reference)', () => {
      const first = getAllMethodologies();
      const second = getAllMethodologies();
      expect(first).not.toBe(second);
      expect(first).toEqual(second);
    });

    it('should return the same number of entries as SCORING_METHODOLOGIES', () => {
      expect(getAllMethodologies().length).toBe(SCORING_METHODOLOGIES.length);
    });
  });

  // --------------------------------------------------------
  // getMethodology
  // --------------------------------------------------------
  describe('getMethodology', () => {
    it('should return the correct entry for a known id', () => {
      const entry = getMethodology('tension-pressure-score');
      expect(entry).toBeDefined();
      expect(entry!.id).toBe('tension-pressure-score');
      expect(entry!.name).toBe('Tension Pressure Score');
    });

    it('should return undefined for an unknown id', () => {
      const entry = getMethodology('nonexistent-methodology-id');
      expect(entry).toBeUndefined();
    });

    it('should return undefined for an empty string', () => {
      const entry = getMethodology('');
      expect(entry).toBeUndefined();
    });
  });

  // --------------------------------------------------------
  // getMethodologiesByModule
  // --------------------------------------------------------
  describe('getMethodologiesByModule', () => {
    it('should return filtered results for a known module', () => {
      const results = getMethodologiesByModule('tension-radar');
      expect(results.length).toBeGreaterThan(0);
      for (const entry of results) {
        expect(entry.module.toLowerCase()).toContain('tension-radar');
      }
    });

    it('should match case-insensitively', () => {
      const lower = getMethodologiesByModule('tension-radar');
      const upper = getMethodologiesByModule('TENSION-RADAR');
      expect(lower).toEqual(upper);
    });

    it('should support partial module paths', () => {
      const results = getMethodologiesByModule('analysis/');
      expect(results.length).toBeGreaterThan(0);
      for (const entry of results) {
        expect(entry.module.toLowerCase()).toContain('analysis/');
      }
    });

    it('should return an empty array for an unknown module', () => {
      const results = getMethodologiesByModule('completely-unknown-module');
      expect(results).toEqual([]);
    });
  });

  // --------------------------------------------------------
  // Schema validation — every methodology has required fields
  // --------------------------------------------------------
  describe('MethodologyEntry schema validation', () => {
    const allEntries = getAllMethodologies();

    it('should have required top-level fields on every entry', () => {
      for (const entry of allEntries) {
        expect(typeof entry.id).toBe('string');
        expect(entry.id.length).toBeGreaterThan(0);

        expect(typeof entry.name).toBe('string');
        expect(entry.name.length).toBeGreaterThan(0);

        expect(typeof entry.module).toBe('string');
        expect(entry.module.length).toBeGreaterThan(0);

        expect(typeof entry.description).toBe('string');
        expect(entry.description.length).toBeGreaterThan(0);

        expect(typeof entry.formula).toBe('string');
        expect(entry.formula.length).toBeGreaterThan(0);

        expect(Array.isArray(entry.variables)).toBe(true);
        expect(entry.variables.length).toBeGreaterThan(0);

        expect(typeof entry.weightJustification).toBe('string');

        expect(Array.isArray(entry.examples)).toBe(true);

        expect(entry.range).toBeDefined();
        expect(typeof entry.range.min).toBe('number');
        expect(typeof entry.range.max).toBe('number');
        expect(entry.range.max).toBeGreaterThanOrEqual(entry.range.min);

        expect(typeof entry.unit).toBe('string');
      }
    });

    it('should have unique ids across all entries', () => {
      const ids = allEntries.map((entry) => entry.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  // --------------------------------------------------------
  // Variable schema validation
  // --------------------------------------------------------
  describe('MethodologyVariable schema validation', () => {
    const allEntries = getAllMethodologies();

    it('should have required fields on every variable', () => {
      for (const entry of allEntries) {
        for (const variable of entry.variables) {
          expect(typeof variable.name).toBe('string');
          expect(variable.name.length).toBeGreaterThan(0);

          expect(typeof variable.description).toBe('string');
          expect(variable.description.length).toBeGreaterThan(0);

          expect(typeof variable.range).toBe('string');
          expect(variable.range.length).toBeGreaterThan(0);

          expect(typeof variable.unit).toBe('string');
          expect(variable.unit.length).toBeGreaterThan(0);
        }
      }
    });
  });
});

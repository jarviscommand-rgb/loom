import { describe, it, expect } from 'vitest';
import {
  LoomError,
  ExtractionError,
  ValidationError,
  RateLimitError,
  GraphError,
  DreamGenerationError,
  ResearchError,
} from './index.js';

// ============================================================
// Error Classes — Edge Case Tests (push to 100% coverage)
// ============================================================

describe('Error Classes — Edge Cases', () => {
  // --------------------------------------------------------
  // ResearchError (not covered in original tests)
  // --------------------------------------------------------

  describe('ResearchError', () => {
    it('should have correct code and status', () => {
      const err = new ResearchError('research failed');
      expect(err.code).toBe('RESEARCH_FAILED');
      expect(err.statusCode).toBe(500);
      expect(err.name).toBe('ResearchError');
      expect(err).toBeInstanceOf(LoomError);
      expect(err).toBeInstanceOf(Error);
    });

    it('should accept details', () => {
      const err = new ResearchError('fetch failed', {
        url: 'https://api.example.com',
        attempts: 3,
      });
      expect(err.details).toEqual({ url: 'https://api.example.com', attempts: 3 });
    });

    it('should serialize with correct error name', () => {
      const json = new ResearchError('msg').toJSON();
      expect(json.error).toBe('ResearchError');
      expect(json.code).toBe('RESEARCH_FAILED');
    });
  });

  // --------------------------------------------------------
  // LoomError edge cases
  // --------------------------------------------------------

  describe('LoomError edge cases', () => {
    it('should handle empty message', () => {
      const err = new LoomError('', 'EMPTY', 500);
      expect(err.message).toBe('');
      expect(err.toJSON().message).toBe('');
    });

    it('should handle complex nested details', () => {
      const details = {
        nested: { deep: { value: 42 } },
        array: [1, 2, 3],
        nullValue: null,
      };
      const err = new LoomError('complex', 'C', 500, details);
      expect(err.details).toEqual(details);
      expect(err.toJSON().details).toEqual(details);
    });

    it('should have a proper stack trace', () => {
      const err = new LoomError('stack test', 'ST', 500);
      expect(err.stack).toBeDefined();
      expect(err.stack).toContain('stack test');
    });

    it('should preserve error prototype chain', () => {
      const err = new ValidationError('test');
      expect(err instanceof ValidationError).toBe(true);
      expect(err instanceof LoomError).toBe(true);
      expect(err instanceof Error).toBe(true);
    });
  });

  // --------------------------------------------------------
  // All error types should work with try/catch
  // --------------------------------------------------------

  describe('try/catch integration', () => {
    const errorClasses = [
      { Class: ExtractionError, args: ['extraction failed'] },
      { Class: ValidationError, args: ['validation failed'] },
      { Class: GraphError, args: ['graph error'] },
      { Class: DreamGenerationError, args: ['dream failed'] },
      { Class: ResearchError, args: ['research failed'] },
    ] as const;

    for (const { Class, args } of errorClasses) {
      it(`should catch ${Class.name} as LoomError`, () => {
        try {
          throw new Class(args[0]);
        } catch (err) {
          expect(err).toBeInstanceOf(LoomError);
          expect((err as LoomError).message).toBe(args[0]);
        }
      });
    }

    it('should catch RateLimitError with default message', () => {
      try {
        throw new RateLimitError();
      } catch (err) {
        expect(err).toBeInstanceOf(LoomError);
        expect((err as RateLimitError).statusCode).toBe(429);
      }
    });
  });

  // --------------------------------------------------------
  // JSON serialization edge cases
  // --------------------------------------------------------

  describe('JSON serialization', () => {
    it('should produce valid JSON via JSON.stringify', () => {
      const err = new ValidationError('bad input', { field: 'name' });
      const json = JSON.stringify(err.toJSON());
      const parsed = JSON.parse(json);
      expect(parsed.error).toBe('ValidationError');
      expect(parsed.code).toBe('VALIDATION_ERROR');
      expect(parsed.message).toBe('bad input');
      expect(parsed.details.field).toBe('name');
    });

    it('should omit details key entirely when details is undefined', () => {
      const err = new ExtractionError('no details');
      const json = err.toJSON();
      expect(Object.keys(json)).not.toContain('details');
    });

    it('should include details key when details is empty object', () => {
      const err = new GraphError('empty details', {});
      const json = err.toJSON();
      expect(json.details).toEqual({});
    });
  });
});

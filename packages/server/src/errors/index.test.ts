import { describe, it, expect } from 'vitest';
import {
  LoomError,
  ExtractionError,
  ValidationError,
  RateLimitError,
  GraphError,
  DreamGenerationError,
} from './index.js';

// ============================================================
// Error Classes — Tests
// ============================================================

describe('Error Classes', () => {
  describe('LoomError', () => {
    it('should construct with all properties', () => {
      const err = new LoomError('something failed', 'TEST_CODE', 418, { foo: 'bar' });
      expect(err.message).toBe('something failed');
      expect(err.code).toBe('TEST_CODE');
      expect(err.statusCode).toBe(418);
      expect(err.details).toEqual({ foo: 'bar' });
      expect(err.name).toBe('LoomError');
    });

    it('should be an instance of Error', () => {
      const err = new LoomError('msg', 'C', 500);
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(LoomError);
    });

    it('should serialize to JSON with details', () => {
      const err = new LoomError('msg', 'C', 500, { context: 123 });
      expect(err.toJSON()).toEqual({
        error: 'LoomError',
        code: 'C',
        message: 'msg',
        details: { context: 123 },
      });
    });

    it('should serialize to JSON without details', () => {
      const err = new LoomError('msg', 'C', 500);
      const json = err.toJSON();
      expect(json).toEqual({
        error: 'LoomError',
        code: 'C',
        message: 'msg',
      });
      expect('details' in json).toBe(false);
    });

    it('should leave details undefined when not provided', () => {
      const err = new LoomError('msg', 'C', 500);
      expect(err.details).toBeUndefined();
    });
  });

  describe('ExtractionError', () => {
    it('should have correct code and status', () => {
      const err = new ExtractionError('extraction failed');
      expect(err.code).toBe('EXTRACTION_FAILED');
      expect(err.statusCode).toBe(500);
      expect(err.name).toBe('ExtractionError');
      expect(err).toBeInstanceOf(LoomError);
      expect(err).toBeInstanceOf(Error);
    });

    it('should accept details', () => {
      const err = new ExtractionError('failed', { chunk: 3 });
      expect(err.details).toEqual({ chunk: 3 });
    });

    it('should serialize with correct error name', () => {
      const json = new ExtractionError('msg').toJSON();
      expect(json.error).toBe('ExtractionError');
    });
  });

  describe('ValidationError', () => {
    it('should have correct code and status', () => {
      const err = new ValidationError('invalid input');
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.statusCode).toBe(400);
      expect(err.name).toBe('ValidationError');
      expect(err).toBeInstanceOf(LoomError);
    });

    it('should accept details with issues', () => {
      const issues = [{ path: 'name', message: 'required' }];
      const err = new ValidationError('bad body', { issues });
      expect(err.details).toEqual({ issues });
    });
  });

  describe('RateLimitError', () => {
    it('should have correct code and status with default message', () => {
      const err = new RateLimitError();
      expect(err.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(err.statusCode).toBe(429);
      expect(err.name).toBe('RateLimitError');
      expect(err.message).toBe('Too many requests, please try again later');
      expect(err).toBeInstanceOf(LoomError);
    });

    it('should accept custom message', () => {
      const err = new RateLimitError('Slow down!');
      expect(err.message).toBe('Slow down!');
    });
  });

  describe('GraphError', () => {
    it('should have correct code and status', () => {
      const err = new GraphError('graph broke');
      expect(err.code).toBe('GRAPH_ERROR');
      expect(err.statusCode).toBe(500);
      expect(err.name).toBe('GraphError');
      expect(err).toBeInstanceOf(LoomError);
    });

    it('should accept details', () => {
      const err = new GraphError('cycle', { nodeId: 'abc' });
      expect(err.details).toEqual({ nodeId: 'abc' });
    });
  });

  describe('DreamGenerationError', () => {
    it('should have correct code and status', () => {
      const err = new DreamGenerationError('dreams failed');
      expect(err.code).toBe('DREAM_GENERATION_FAILED');
      expect(err.statusCode).toBe(500);
      expect(err.name).toBe('DreamGenerationError');
      expect(err).toBeInstanceOf(LoomError);
    });

    it('should accept details', () => {
      const err = new DreamGenerationError('retry exhausted', { attempts: 3 });
      expect(err.details).toEqual({ attempts: 3 });
    });
  });
});

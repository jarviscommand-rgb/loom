import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody } from './validation.js';
import { ValidationError } from '../errors/index.js';

function createMocks(body: unknown) {
  const req = { body } as Request;
  const res = {} as Response;
  const next: NextFunction = vi.fn();
  return { req, res, next };
}

const testSchema = z.object({
  title: z.string().min(1),
  count: z.number().int().positive(),
});

describe('validateBody', () => {
  it('calls next() when body is valid', () => {
    const { req, res, next } = createMocks({ title: 'hello', count: 5 });
    const middleware = validateBody(testSchema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('replaces req.body with parsed data (strips extra fields)', () => {
    const { req, res, next } = createMocks({ title: 'hi', count: 1, extra: true });
    const middleware = validateBody(testSchema);

    middleware(req, res, next);

    expect(req.body).toEqual({ title: 'hi', count: 1 });
    expect(req.body).not.toHaveProperty('extra');
  });

  it('throws ValidationError when body is invalid', () => {
    const { req, res, next } = createMocks({ title: '', count: -1 });
    const middleware = validateBody(testSchema);

    expect(() => middleware(req, res, next)).toThrow(ValidationError);
  });

  it('thrown error has message "Invalid request body"', () => {
    const { req, res, next } = createMocks({});
    const middleware = validateBody(testSchema);

    expect(() => middleware(req, res, next)).toThrow('Invalid request body');
  });

  it('includes formatted issues in error details', () => {
    const { req, res, next } = createMocks({ title: 123, count: 'abc' });
    const middleware = validateBody(testSchema);

    try {
      middleware(req, res, next);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      const ve = err as ValidationError;
      expect(ve.details).toBeDefined();
      const issues = ve.details!.issues as Array<{ path: string; message: string }>;
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0]).toHaveProperty('path');
      expect(issues[0]).toHaveProperty('message');
    }
  });

  it('does not call next() when validation fails', () => {
    const { req, res, next } = createMocks({});
    const middleware = validateBody(testSchema);

    try {
      middleware(req, res, next);
    } catch {
      // expected
    }

    expect(next).not.toHaveBeenCalled();
  });
});

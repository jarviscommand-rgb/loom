import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { asyncHandler, globalErrorHandler } from './error-handler.js';
import { LoomError, ValidationError } from '../errors/index.js';

function mockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

const mockReq = {} as Request;
const mockNext: NextFunction = vi.fn();

describe('asyncHandler', () => {
  it('calls the wrapped async function', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const wrapped = asyncHandler(handler);
    wrapped(mockReq, mockRes(), mockNext);
    await vi.waitFor(() => expect(handler).toHaveBeenCalledOnce());
  });

  it('forwards thrown errors to next()', async () => {
    const error = new Error('async boom');
    const handler = vi.fn().mockRejectedValue(error);
    const next = vi.fn();
    const wrapped = asyncHandler(handler);

    wrapped(mockReq, mockRes(), next);
    await vi.waitFor(() => expect(next).toHaveBeenCalledWith(error));
  });
});

describe('globalErrorHandler', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('returns structured JSON for LoomError subclasses', () => {
    const err = new ValidationError('bad field', { issues: ['name required'] });
    const res = mockRes();

    globalErrorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'ValidationError',
      code: 'VALIDATION_ERROR',
      message: 'bad field',
      details: { issues: ['name required'] },
    });
  });

  it('returns structured JSON for base LoomError', () => {
    const err = new LoomError('custom', 'CUSTOM', 422);
    const res = mockRes();

    globalErrorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      error: 'LoomError',
      code: 'CUSTOM',
      message: 'custom',
    });
  });

  it('exposes message in non-production for generic errors', () => {
    process.env.NODE_ENV = 'development';
    const err = new Error('debug info');
    const res = mockRes();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    globalErrorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'InternalServerError',
      code: 'INTERNAL_ERROR',
      message: 'debug info',
    });
  });

  it('hides message in production for generic errors', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('secret stuff');
    const res = mockRes();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    globalErrorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'InternalServerError',
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
  });

  it('logs generic errors to console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('whoops');
    const res = mockRes();

    globalErrorHandler(err, mockReq, res, mockNext);

    expect(spy).toHaveBeenCalledWith('[LOOM] Unhandled error:', err);
    spy.mockRestore();
  });
});

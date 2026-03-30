import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { LoomError } from '../errors/index.js';

// ============================================================
// LOOM — Error Handling Middleware
//
// Async route wrapper and global error handler.
// ============================================================

/**
 * Wraps an async route handler to catch errors and forward them
 * to the Express error handler instead of causing unhandled rejections.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global error handler middleware.
 * Must be registered AFTER all routes.
 */
export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof LoomError) {
    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  console.error('[LOOM] Unhandled error:', err);

  res.status(500).json({
    error: 'InternalServerError',
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
  });
}

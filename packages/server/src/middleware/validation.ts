import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { ValidationError } from '../errors/index.js';

// ============================================================
// LOOM — Request Validation Middleware
//
// Zod-based request body validation.
// ============================================================

/**
 * Creates middleware that validates the request body against a Zod schema.
 * Throws a ValidationError if the body doesn't match.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      throw new ValidationError('Invalid request body', { issues });
    }

    req.body = result.data;
    next();
  };
}

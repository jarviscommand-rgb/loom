import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

// ============================================================
// LOOM — Rate Limiting Middleware
//
// Applies rate limits to extraction and dream endpoints
// to prevent abuse of expensive LLM calls.
// ============================================================

/** Rate limiter for extraction and dream endpoints. */
export const apiRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: config.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'RateLimitError',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later',
  },
});

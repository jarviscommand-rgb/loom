import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env file if present
dotenv.config();

// ============================================================
// LOOM — Environment Validation
//
// Validates and exports a typed config object from env vars.
// Fails fast at startup if required vars are missing.
// ============================================================

const envSchema = z.object({
  /** OpenAI API key for extraction and dream generation. */
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),

  /** Server port. */
  PORT: z.coerce.number().int().positive().default(3001),

  /** Log level. */
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  /** Rate limit: max requests per window. */
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),

  /** Rate limit: window duration in minutes. */
  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().positive().default(15),

  /** Node environment. */
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type EnvConfig = z.infer<typeof envSchema>;

/** Validate environment and return typed config. Throws on invalid config. */
export function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    console.error(`\n❌ Environment validation failed:\n${issues}\n`);
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  return result.data;
}

/**
 * Exported config singleton.
 * In test environments, we skip validation to avoid requiring real API keys.
 */
export const config: EnvConfig =
  process.env.NODE_ENV === 'test'
    ? {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'test-key',
        PORT: parseInt(process.env.PORT || '3001', 10),
        LOG_LEVEL: 'warn',
        RATE_LIMIT_MAX: 100,
        RATE_LIMIT_WINDOW_MINUTES: 15,
        NODE_ENV: 'test',
      }
    : validateEnv();

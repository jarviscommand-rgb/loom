import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ============================================================
// Environment Validation — Tests
//
// Note: NODE_ENV must be 'test' at import time so the module-level
// config singleton uses the bypass path. We then call validateEnv()
// directly to test validation logic.
// ============================================================

describe('Environment Validation', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    // Restore clean env but keep NODE_ENV=test for safe imports
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('validateEnv', () => {
    it('should return valid config when all required vars are set', async () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      process.env.PORT = '4000';
      process.env.LOG_LEVEL = 'debug';
      process.env.NODE_ENV = 'development';
      process.env.RATE_LIMIT_MAX = '50';
      process.env.RATE_LIMIT_WINDOW_MINUTES = '30';

      const { validateEnv } = await import('./env.js');
      const config = validateEnv();

      expect(config.OPENAI_API_KEY).toBe('sk-test-key');
      expect(config.PORT).toBe(4000);
      expect(config.LOG_LEVEL).toBe('debug');
      expect(config.RATE_LIMIT_MAX).toBe(50);
      expect(config.RATE_LIMIT_WINDOW_MINUTES).toBe(30);
      expect(config.NODE_ENV).toBe('development');
    });

    it('should throw when OPENAI_API_KEY is missing', async () => {
      // Import with NODE_ENV=test so singleton doesn't throw
      const { validateEnv } = await import('./env.js');

      // Now set up the env for the actual test
      delete process.env.OPENAI_API_KEY;
      process.env.NODE_ENV = 'development';

      expect(() => validateEnv()).toThrow('Invalid environment configuration');
    });

    it('should throw when OPENAI_API_KEY is empty string', async () => {
      const { validateEnv } = await import('./env.js');

      process.env.OPENAI_API_KEY = '';
      process.env.NODE_ENV = 'development';

      expect(() => validateEnv()).toThrow('Invalid environment configuration');
    });

    it('should use default values when optional vars are missing', async () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      delete process.env.PORT;
      delete process.env.LOG_LEVEL;
      delete process.env.RATE_LIMIT_MAX;
      delete process.env.RATE_LIMIT_WINDOW_MINUTES;
      process.env.NODE_ENV = 'development';

      const { validateEnv } = await import('./env.js');
      const config = validateEnv();

      expect(config.PORT).toBe(3001);
      expect(config.LOG_LEVEL).toBe('info');
      expect(config.RATE_LIMIT_MAX).toBe(20);
      expect(config.RATE_LIMIT_WINDOW_MINUTES).toBe(15);
    });

    it('should throw for invalid LOG_LEVEL', async () => {
      const { validateEnv } = await import('./env.js');

      process.env.OPENAI_API_KEY = 'sk-test-key';
      process.env.LOG_LEVEL = 'verbose';
      process.env.NODE_ENV = 'development';

      expect(() => validateEnv()).toThrow('Invalid environment configuration');
    });

    it('should throw for invalid NODE_ENV', async () => {
      const { validateEnv } = await import('./env.js');

      process.env.OPENAI_API_KEY = 'sk-test-key';
      process.env.NODE_ENV = 'staging';

      expect(() => validateEnv()).toThrow('Invalid environment configuration');
    });

    it('should include failing field name in error message', async () => {
      const { validateEnv } = await import('./env.js');

      delete process.env.OPENAI_API_KEY;
      process.env.NODE_ENV = 'development';

      expect(() => validateEnv()).toThrow('OPENAI_API_KEY');
    });

    it('should log to console.error on failure', async () => {
      const { validateEnv } = await import('./env.js');
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      delete process.env.OPENAI_API_KEY;
      process.env.NODE_ENV = 'development';

      try {
        validateEnv();
      } catch {
        // expected
      }

      expect(spy).toHaveBeenCalledWith(expect.stringContaining('Environment validation failed'));
      spy.mockRestore();
    });

    it('should coerce PORT string to number', async () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      process.env.PORT = '8080';
      process.env.NODE_ENV = 'development';

      const { validateEnv } = await import('./env.js');
      const config = validateEnv();
      expect(config.PORT).toBe(8080);
      expect(typeof config.PORT).toBe('number');
    });
  });

  describe('config singleton', () => {
    it('should provide test defaults when NODE_ENV is test', async () => {
      process.env.NODE_ENV = 'test';
      delete process.env.OPENAI_API_KEY;

      // Mock dotenv to prevent .env file from overriding our deleted key
      vi.doMock('dotenv', () => ({ default: { config: () => ({}) } }));

      const { config } = await import('./env.js');

      expect(config.OPENAI_API_KEY).toBe('test-key');
      expect(config.PORT).toBe(3001);
      expect(config.LOG_LEVEL).toBe('warn');
      expect(config.RATE_LIMIT_MAX).toBe(100);
      expect(config.NODE_ENV).toBe('test');
    });

    it('should use OPENAI_API_KEY from env even in test mode', async () => {
      process.env.NODE_ENV = 'test';
      process.env.OPENAI_API_KEY = 'sk-real-key';

      const { config } = await import('./env.js');
      expect(config.OPENAI_API_KEY).toBe('sk-real-key');
    });
  });
});

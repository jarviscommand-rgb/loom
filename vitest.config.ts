import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      include: ['packages/server/src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/demo/**'],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@loom/server': '/packages/server/src',
    },
  },
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@packing-list/auth-tests',
    include: ['src/**/*.test.ts'],
    environment: 'jsdom',
    coverage: {
      include: ['src/**/*.ts', 'src/**/*.tsx'],
    },
  },
  resolve: {
    // Handle TypeScript paths and module resolution
    alias: {
      '@packing-list/model': '../../packages/model/src/index.ts',
    },
  },
});

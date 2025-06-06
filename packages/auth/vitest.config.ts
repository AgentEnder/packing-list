import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@packing-list/state-tests',
    include: ['src/**/*.test.ts'],
    environment: 'jsdom',
  },
  resolve: {
    // Handle TypeScript paths and module resolution
    alias: {
      '@packing-list/model': '../../packages/model/src/index.ts',
    },
  },
});

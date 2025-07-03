import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@packing-list/state-tests',
    include: ['src/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['src/test-setup.ts'],
    coverage: {
      include: ['src/**/*.ts', 'src/**/*.tsx'],
    },
  },
  resolve: {},
});

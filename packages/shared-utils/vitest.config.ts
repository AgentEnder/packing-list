import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@packing-list/shared-utils-tests',
    include: ['src/**/*.test.ts'],
    environment: 'node',
    passWithNoTests: true,
  },
});

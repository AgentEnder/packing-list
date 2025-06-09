/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      name: '@packing-list/frontend-test',
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./test/setup.ts'],
      include: ['**/*.{test,spec}.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: [
          'components/**/*.{ts,tsx}',
          'pages/**/*.{ts,tsx}',
          'utils/**/*.{ts,tsx}',
          'layouts/**/*.{ts,tsx}',
          'lib/**/*.{ts,tsx}',
        ],
        exclude: [
          'node_modules/**',
          'dist/**',
          '**/*.d.ts',
          'test/setup.ts',
          'vitest.config.ts',
        ],
      },
    },
  })
);

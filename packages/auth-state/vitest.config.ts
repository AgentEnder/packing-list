import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    name: '@packing-list/auth-state-tests',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      include: ['src/**/*.ts', 'src/**/*.tsx'],
    },
  },
  resolve: {
    // Handle TypeScript paths and module resolution
    alias: {
      '@packing-list/model': join(
        __dirname,
        '../../packages/model/src/index.ts'
      ),
      '@packing-list/auth': join(__dirname, '../../packages/auth/src/index.ts'),
      '@packing-list/auth/src/connectivity.js': join(
        __dirname,
        '../../packages/auth/src/connectivity.js'
      ),
    },
  },
});

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import vike from 'vike/plugin';

export default defineConfig({
  plugins: [
    react({
      // Enable HMR
      include: '**/*.{jsx,tsx}',
    }),
    !process.env.VITEST && vike(),
    tailwindcss(),
  ],
  build: {
    target: 'es2022',
  },
  base: process.env.PUBLIC_ENV__BASE_URL || '/',
  envPrefix: ['VITE_', 'PUBLIC_ENV__'],
  server: {
    hmr: {
      overlay: true,
      // Explicit WebSocket config
      protocol: 'ws',
      host: 'localhost',
      port: 24678,
      clientPort: 24678,
      timeout: 5000,
    },
  },
  // Add logging
  logLevel: 'info',
});

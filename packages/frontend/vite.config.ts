import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import vike from 'vike/plugin';
import { createHash } from 'crypto';
import { copyFileSync, readFileSync } from 'fs';
import { join } from 'path';

// Generate build hash
const buildHash = createHash('sha256')
  .update(Date.now().toString())
  .digest('hex')
  .substring(0, 8);

// Plugin to handle service worker and API endpoints for both dev and build
function serviceWorkerAndApiPlugin() {
  return {
    name: 'service-worker-and-api',
    configureServer(server: any) {
      // Serve service worker during development
      server.middlewares.use('/sw.js', (req: any, res: any, next: any) => {
        try {
          const swPath = join(__dirname, 'assets', 'sw.js');
          const content = readFileSync(swPath, 'utf-8');
          res.setHeader('Content-Type', 'application/javascript');
          res.setHeader('Service-Worker-Allowed', '/');
          res.end(content);
          console.log(
            '🔧 Dev server: Serving service worker from assets/sw.js'
          );
        } catch (error) {
          console.warn('⚠️ Dev server: Could not serve service worker:', error);
          next();
        }
      });

      // Handle version API endpoint
      server.middlewares.use(
        '/api/version',
        (req: any, res: any, next: any) => {
          try {
            const versionInfo = {
              version: process.env.npm_package_version || '1.0.0',
              buildHash: buildHash,
              buildTime: new Date().toISOString(),
              environment: 'development',
              timestamp: Date.now(),
            };

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(versionInfo, null, 2));
            console.log('🔧 Dev server: Serving version API');
          } catch (error) {
            console.warn('⚠️ Dev server: Could not serve version API:', error);
            next();
          }
        }
      );
    },
    writeBundle() {
      // Copy service worker during build
      try {
        const srcPath = join(__dirname, 'assets', 'sw.js');
        const destPath = join(__dirname, 'dist', 'client', 'sw.js');
        copyFileSync(srcPath, destPath);
        console.log('✅ Build: Service worker copied to dist/client/sw.js');
      } catch (error) {
        console.warn('⚠️ Build: Could not copy service worker:', error);
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react({
      // Enable HMR
      include: '**/*.{jsx,tsx}',
    }),
    !process.env.VITEST && vike(),
    tailwindcss(),
    serviceWorkerAndApiPlugin(),
  ],
  build: {
    target: 'es2022',
  },
  base: process.env.PUBLIC_ENV__BASE_URL || '/',
  envPrefix: ['VITE_', 'PUBLIC_ENV__'],

  // Add build-time environment variables
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(
      process.env.npm_package_version || '1.0.0'
    ),
    'import.meta.env.VITE_BUILD_HASH': JSON.stringify(buildHash),
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString()),
  },

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

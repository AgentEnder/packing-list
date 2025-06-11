import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import vike from 'vike/plugin';
import { createHash } from 'crypto';

// Generate build hash
const buildHash = createHash('sha256')
  .update(Date.now().toString())
  .digest('hex')
  .substring(0, 8);

// Plugin to handle API endpoints for both dev and build
function apiPlugin() {
  return {
    name: 'api-endpoints',
    configureServer(server: any) {
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
    apiPlugin(),
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

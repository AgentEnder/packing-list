import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, Plugin } from 'vite';
import vike from 'vike/plugin';
import { createHash } from 'crypto';
import {
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  unlinkSync,
  readFileSync,
} from 'fs';
import { join } from 'path';

// Generate build hash
const buildHash = createHash('sha256')
  .update(Date.now().toString())
  .digest('hex')
  .substring(0, 8);

// Helper function to generate version info
function getVersionInfo(environment: 'development' | 'production') {
  return {
    version: process.env.npm_package_version || '1.0.0',
    buildHash: buildHash,
    buildTime: new Date().toISOString(),
    environment,
    timestamp: Date.now(),
  };
}

// Plugin to handle API endpoints and service worker placement
function apiAndServiceWorkerPlugin(): Plugin {
  return {
    name: 'api-and-service-worker',
    configureServer(server) {
      // Only handle middleware during development
      server.middlewares.use('/api/version.json', (req, res, next) => {
        try {
          const versionInfo = getVersionInfo('development');

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(versionInfo, null, 2));
          console.log('🔧 Dev server: Serving version API');
        } catch (error) {
          console.warn('⚠️ Dev server: Could not serve version API:', error);
          next();
        }
      });
    },
    buildStart() {
      // Generate static version file during build
      if (
        process.env.NODE_ENV === 'production' ||
        process.env.VITE_BUILD_STATIC_API
      ) {
        try {
          const versionInfo = getVersionInfo('production');
          const apiDir = join(process.cwd(), 'public', 'api');

          // Ensure api directory exists
          mkdirSync(apiDir, { recursive: true });

          // Write version file
          const versionFile = join(apiDir, 'version.json');
          writeFileSync(versionFile, JSON.stringify(versionInfo, null, 2));

          console.log(
            '📄 Build: Generated static version API at public/api/version.json'
          );
        } catch (error) {
          console.warn(
            '⚠️ Build: Could not generate static version API:',
            error
          );
        }
      }
    },
    writeBundle() {
      // After build, move service worker from assets to root
      try {
        const distDir = join(process.cwd(), 'dist', 'client');
        const assetsDir = join(distDir, 'assets');

        if (!existsSync(assetsDir)) {
          console.warn('⚠️ Build: Assets directory not found');
          return;
        }

        // Find the service worker file in assets
        const assetFiles = readdirSync(assetsDir);
        console.log('🔍 Build: Asset files:', assetFiles);
        const serviceWorkerFile = assetFiles.find(
          (file) => file.startsWith('service-worker') && file.endsWith('.js')
        );

        if (serviceWorkerFile) {
          const sourceFile = join(assetsDir, serviceWorkerFile);
          const targetFile = join(distDir, 'service-worker.js');

          const contents = readFileSync(sourceFile, 'utf-8');
          const contentsWithBaseUrl = contents.replace(
            'import.meta.env.PUBLIC_ENV__BASE_URL',
            "'" + process.env.PUBLIC_ENV__BASE_URL + "'"
          );
          writeFileSync(targetFile, contentsWithBaseUrl);
          console.log('📦 Build: Moved service worker to root:', targetFile);

          // Remove the original file from assets to avoid confusion
          try {
            unlinkSync(sourceFile);
            console.log(
              '🗑️ Build: Removed original service worker from assets'
            );
          } catch (unlinkError) {
            console.warn(
              '⚠️ Build: Could not remove original service worker from assets:',
              unlinkError
            );
          }
        } else {
          console.warn('⚠️ Build: Service worker file not found in assets');
        }
      } catch (error) {
        console.warn('⚠️ Build: Could not move service worker to root:', error);
      }
    },
    transform(code) {
      return code.replaceAll('%BUILD_TIME%', new Date().toISOString());
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
    apiAndServiceWorkerPlugin(),
  ],
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        // Service worker as separate entry
        'service-worker': 'service-worker.ts',
      },
    },
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

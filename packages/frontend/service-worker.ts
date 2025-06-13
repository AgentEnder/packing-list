// Service Worker for Offline Support
// Caches static assets and API responses while preserving client-side routing

/// <reference lib="webworker" />

// TypeScript types for service worker
declare const self: ServiceWorkerGlobalScope;

const CACHE_VERSION = '1.0.0';
const CACHE_NAME = `packing-list-cache-v${CACHE_VERSION}`;
const STATIC_CACHE = `packing-list-static-v${CACHE_VERSION}`;

// Static assets to pre-cache
const STATIC_ASSETS = [
  '/',
  '/login',
  '/trips',
  '/settings',
  '/people',
  '/days',
  '/packing-list',
  // Don't pre-cache all routes to avoid breaking client-side routing
];

// Cache strategies by URL pattern
const CACHE_STRATEGIES = {
  // Static assets: Cache first with network fallback
  static: [
    /\.js$/,
    /\.css$/,
    /\.woff2?$/,
    /\.png$/,
    /\.jpg$/,
    /\.svg$/,
    /\.ico$/,
  ],
  // API calls: Network first with cache fallback
  api: [/\/api\//, /\/version.*$/],
  // Never cache these endpoints (they need fresh data)
  noCache: [/\/api\/version$.*/, /\/version(\?.*)?$/],
  // Note: Pages are no longer cached to preserve client-side routing
};

self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('🔧 Service Worker: Installing...');

  event.waitUntil(
    Promise.all([
      // Pre-cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Service Worker: Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),

      // Skip waiting to activate immediately
      self.skipWaiting(),
    ])
  );
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('🚀 Service Worker: Activating...');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
              console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Take control of all clients immediately
      self.clients.claim(),
    ])
  );
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip chrome-extension and non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // CRITICAL: Skip navigation requests to preserve client-side routing
  // This allows Vike to handle navigation client-side and maintain Redux state
  if (request.mode === 'navigate') {
    console.log(
      '🚀 Service Worker: Skipping navigation request to preserve client-side routing:',
      request.url
    );
    return; // Let the browser handle navigation normally
  }

  // Only intercept non-navigation requests (assets, API calls, etc.)
  const strategy = getCacheStrategy(url);
  event.respondWith(handleRequest(request, strategy));
});

function getCacheStrategy(url: URL): string {
  const pathname = url.pathname;

  // Check for no-cache endpoints first (highest priority)
  if (CACHE_STRATEGIES.noCache.some((pattern) => pattern.test(pathname))) {
    return 'no-cache';
  }

  // Check for static assets
  if (CACHE_STRATEGIES.static.some((pattern) => pattern.test(pathname))) {
    return 'cache-first';
  }

  // Check for API calls
  if (CACHE_STRATEGIES.api.some((pattern) => pattern.test(pathname))) {
    return 'network-first';
  }

  // Default to network-first for other requests
  return 'network-first';
}

async function handleRequest(
  request: Request,
  strategy: string
): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);

  switch (strategy) {
    case 'cache-first':
      return cacheFirst(request, cache);

    case 'network-first':
      return networkFirst(request, cache);

    case 'no-cache':
      return noCache(request);

    default:
      return fetch(request);
  }
}

async function cacheFirst(request: Request, cache: Cache): Promise<Response> {
  try {
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback to network
    const networkResponse = await fetch(request);

    // Cache successful GET responses only (Cache API only supports GET requests)
    if (networkResponse.ok && request.method === 'GET') {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.warn(
      '⚠️ Service Worker: Cache-first failed for:',
      request.url,
      error
    );

    // Note: Navigation requests are not intercepted, so this shouldn't happen
    if (request.mode === 'navigate') {
      console.warn(
        '⚠️ Service Worker: Unexpected navigation request in cache-first handler'
      );
    }

    throw error;
  }
}

async function networkFirst(request: Request, cache: Cache): Promise<Response> {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful GET responses only (Cache API only supports GET requests)
    if (networkResponse.ok && request.method === 'GET') {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.warn('⚠️ Service Worker: Network failed for:', request.url, error);

    // Fallback to cache (only possible for GET requests anyway)
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Note: Navigation requests are not intercepted, so this shouldn't happen
    if (request.mode === 'navigate') {
      console.warn(
        '⚠️ Service Worker: Unexpected navigation request in network-first handler'
      );
    }

    throw error;
  }
}

async function noCache(request: Request): Promise<Response> {
  try {
    // Always fetch from network, never cache
    const networkResponse = await fetch(request);

    // Add cache-control headers to prevent browser caching
    const headers = new Headers(networkResponse.headers);
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    return new Response(networkResponse.body, {
      status: networkResponse.status,
      statusText: networkResponse.statusText,
      headers: headers,
    });
  } catch (error) {
    console.warn(
      '⚠️ Service Worker: No-cache request failed:',
      request.url,
      error
    );
    throw error;
  }
}

// Handle version checking
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'CHECK_VERSION') {
    checkVersion().then((result) => {
      event.ports[0].postMessage(result);
    });
  }
});

async function checkVersion() {
  try {
    // Use no-cache headers and timeout to ensure fresh version data
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch('/api/version.json', {
      cache: 'no-cache',
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(
        `⚠️ Service Worker: Version endpoint returned ${response.status}`
      );
      return {
        success: false,
        error: `HTTP ${response.status}`,
        offline: response.status >= 500 || response.status === 0,
      };
    }

    const data = await response.json();
    console.log('✅ Service Worker: Version check successful');
    return { success: true, version: data };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isOfflineError =
      error instanceof Error &&
      (error.name === 'AbortError' ||
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('Failed to fetch'));

    if (isOfflineError) {
      console.warn(
        '📡 Service Worker: Version check failed - likely offline:',
        errorMessage
      );
      return {
        success: false,
        error: errorMessage,
        offline: true,
      };
    } else {
      console.warn('⚠️ Service Worker: Version check failed:', error);
      return {
        success: false,
        error: errorMessage,
        offline: false,
      };
    }
  }
}

console.log('✅ Service Worker: Loaded and ready');

// Export for TypeScript, but not used in worker context
export {};

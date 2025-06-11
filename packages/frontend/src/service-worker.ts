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
  api: [/\/api\//, /\/version$/],
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

    default:
      return fetch(request);
  }
}

async function cacheFirst(request: Request, cache: Cache): Promise<Response> {
  try {
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('💾 Service Worker: Serving from cache:', request.url);
      return cachedResponse;
    }

    // Fallback to network
    const networkResponse = await fetch(request);

    // Cache successful GET responses only (Cache API only supports GET requests)
    if (networkResponse.ok && request.method === 'GET') {
      console.log('📥 Service Worker: Caching new asset:', request.url);
      cache.put(request, networkResponse.clone());
    } else if (request.method !== 'GET') {
      console.log(
        '🚫 Service Worker: Skipping cache for non-GET request:',
        request.method,
        request.url
      );
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
      console.log('📥 Service Worker: Caching network response:', request.url);
      cache.put(request, networkResponse.clone());
    } else if (request.method !== 'GET') {
      console.log(
        '🚫 Service Worker: Skipping cache for non-GET request:',
        request.method,
        request.url
      );
    }

    return networkResponse;
  } catch (error) {
    console.warn('⚠️ Service Worker: Network failed for:', request.url, error);

    // Fallback to cache (only possible for GET requests anyway)
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('💾 Service Worker: Serving cached fallback:', request.url);
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
    const response = await fetch('/version');
    const data = await response.json();
    return { success: true, version: data };
  } catch (error: any) {
    console.warn('⚠️ Service Worker: Version check failed:', error);
    return { success: false, error: error.message };
  }
}

console.log('✅ Service Worker: Loaded and ready');

// Export for TypeScript, but not used in worker context
export {};

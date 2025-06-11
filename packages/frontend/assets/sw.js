// Service Worker for Offline Support
// Caches static assets and provides offline navigation

const CACHE_NAME = 'packing-list-v1';
const STATIC_CACHE = 'packing-list-static-v1';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/trips',
  '/login',
  '/settings',
  // Will be populated with actual bundle files during build
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Static assets: Cache first
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
  // Pages: Network first with cache fallback
  pages: [
    /^\/$/,
    /^\/trips/,
    /^\/login/,
    /^\/settings/,
    /^\/auth/,
    /^\/people/,
    /^\/days/,
    /^\/packing-list/,
  ],
};

self.addEventListener('install', (event) => {
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

self.addEventListener('activate', (event) => {
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

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip chrome-extension and non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Determine cache strategy based on URL pattern
  const strategy = getCacheStrategy(url);

  event.respondWith(handleRequest(request, strategy));
});

function getCacheStrategy(url) {
  const pathname = url.pathname;

  // Check for static assets
  if (CACHE_STRATEGIES.static.some((pattern) => pattern.test(pathname))) {
    return 'cache-first';
  }

  // Check for API calls
  if (CACHE_STRATEGIES.api.some((pattern) => pattern.test(pathname))) {
    return 'network-first';
  }

  // Check for pages
  if (CACHE_STRATEGIES.pages.some((pattern) => pattern.test(pathname))) {
    return 'network-first';
  }

  // Default to network-first for other requests
  return 'network-first';
}

async function handleRequest(request, strategy) {
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

async function cacheFirst(request, cache) {
  try {
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('💾 Service Worker: Serving from cache:', request.url);
      return cachedResponse;
    }

    // Fallback to network
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      console.log('📥 Service Worker: Caching new asset:', request.url);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.warn(
      '⚠️ Service Worker: Cache-first failed for:',
      request.url,
      error
    );

    // Try to serve a cached fallback for navigation requests
    if (request.mode === 'navigate') {
      const fallback = await cache.match('/');
      if (fallback) {
        console.log('🏠 Service Worker: Serving fallback page');
        return fallback;
      }
    }

    throw error;
  }
}

async function networkFirst(request, cache) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      console.log('📥 Service Worker: Caching network response:', request.url);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.warn('⚠️ Service Worker: Network failed for:', request.url, error);

    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('💾 Service Worker: Serving cached fallback:', request.url);
      return cachedResponse;
    }

    // For navigation requests, try to serve the main app
    if (request.mode === 'navigate') {
      const fallback = await cache.match('/');
      if (fallback) {
        console.log('🏠 Service Worker: Serving app fallback for navigation');
        return fallback;
      }
    }

    throw error;
  }
}

// Handle version checking
self.addEventListener('message', (event) => {
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
  } catch (error) {
    console.warn('⚠️ Service Worker: Version check failed:', error);
    return { success: false, error: error.message };
  }
}

console.log('✅ Service Worker: Loaded and ready');

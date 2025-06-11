import type { OnHydrationEndAsync } from 'vike/types';
import { registerServiceWorker } from '../utils/serviceWorker.js';

export const onHydrationEnd: OnHydrationEndAsync = async () => {
  console.log('🚀 App hydrated, initializing service worker...');

  // Initialize service worker for offline support
  try {
    await registerServiceWorker();
    console.log('✅ Service worker initialization completed');
  } catch (error) {
    console.warn('⚠️ Service worker initialization failed:', error);
  }
};

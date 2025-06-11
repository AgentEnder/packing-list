import type { PageContextServer } from 'vike/types';

export async function data(pageContext: PageContextServer) {
  // Version information
  const versionInfo = {
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    buildHash: import.meta.env.VITE_BUILD_HASH || 'dev',
    buildTime: import.meta.env.VITE_BUILD_TIME || new Date().toISOString(),
    environment: import.meta.env.MODE || 'development',
    timestamp: Date.now(),
  };

  return {
    versionInfo,
  };
}

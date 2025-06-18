import React from 'react';
import { DevModeBanner } from './DevModeBanner';

export const DevModeBannerContainer: React.FC = () => {
  // Check if we're in development mode
  const isDevMode = React.useMemo(() => {
    // Check various dev mode indicators
    const isDev =
      // Vite dev mode
      import.meta.env.MODE === 'development' ||
      // Development environment variable
      import.meta.env.DEV ||
      // Node environment (fallback)
      process.env.NODE_ENV === 'development' ||
      // HMR availability (Vite specific)
      !!import.meta.hot ||
      // Local development URLs
      (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname.includes('local')));

    console.log('🛠️ [DEV BANNER CONTAINER] Development mode detection:', {
      'import.meta.env.MODE': import.meta.env.MODE,
      'import.meta.env.DEV': import.meta.env.DEV,
      'process.env.NODE_ENV': process.env.NODE_ENV,
      'import.meta.hot': !!import.meta.hot,
      hostname:
        typeof window !== 'undefined' ? window.location.hostname : 'SSR',
      isDevMode: isDev,
    });

    return isDev;
  }, []);

  return <DevModeBanner isVisible={isDevMode} />;
};

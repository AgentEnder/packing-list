import React from 'react';
import { DevModeBanner } from './DevModeBanner';
import { getTimeSinceLastBuild } from '../utils/buildTime';

export const DevModeBannerContainer: React.FC = () => {
  const [timeSinceBuild, setTimeSinceBuild] = React.useState<string>('');

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

    return isDev;
  }, []);

  // Update time since build periodically
  React.useEffect(() => {
    if (!isDevMode) return;

    const updateTimeSinceBuild = () => {
      const time = getTimeSinceLastBuild();
      setTimeSinceBuild(time);
    };

    // Initial update
    updateTimeSinceBuild();

    // Update every 1 second for live updates
    const interval = setInterval(updateTimeSinceBuild, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isDevMode]);

  return (
    <DevModeBanner isVisible={isDevMode} timeSinceBuild={timeSinceBuild} />
  );
};

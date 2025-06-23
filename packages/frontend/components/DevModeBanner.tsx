import React, { useState, useEffect } from 'react';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { Banner } from '@packing-list/shared-components';

interface DevModeBannerProps {
  isVisible: boolean;
}

export const DevModeBanner: React.FC<DevModeBannerProps> = ({ isVisible }) => {
  // Track Vite dev server connection status dynamically
  const [isViteConnected, setIsViteConnected] = useState(() => {
    return typeof import.meta.hot !== 'undefined';
  });

  useEffect(() => {
    // Only set up listeners if HMR is available
    if (typeof import.meta.hot === 'undefined') {
      return;
    }

    const handleConnect = () => {
      setIsViteConnected(true);
    };

    const handleDisconnect = () => {
      setIsViteConnected(false);
    };

    // Listen for Vite HMR connection events
    import.meta.hot.on('vite:ws:connect', handleConnect);
    import.meta.hot.on('vite:ws:disconnect', handleDisconnect);

    // Cleanup listeners
    return () => {
      if (import.meta.hot) {
        import.meta.hot.off('vite:ws:connect', handleConnect);
        import.meta.hot.off('vite:ws:disconnect', handleDisconnect);
      }
    };
  }, []);

  return (
    <Banner
      id="dev-mode"
      priority={15} // Higher priority than most banners (lower number = higher priority)
      visible={isVisible}
      variant="warning"
      className="border-warning-content/20"
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span className="font-medium">
        Development Mode - Not for production use
      </span>

      {/* Vite dev server connection indicator */}
      <span className="text-warning-content/70">•</span>
      <div className="flex items-center gap-1">
        {isViteConnected ? (
          <>
            <Wifi className="w-3 h-3 flex-shrink-0 text-warning-content/80" />
            <span className="text-sm text-warning-content/80">
              Live Updates
            </span>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white rounded-md border border-red-700">
              <WifiOff className="w-3 h-3 flex-shrink-0" />
              <span className="text-sm font-medium">
                STALE CODE - Vite Disconnected
              </span>
            </div>
          </>
        )}
      </div>

      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
    </Banner>
  );
};

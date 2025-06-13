import React from 'react';
import { WifiOff } from 'lucide-react';
import { Banner } from './Banner.js';

interface OfflineBannerProps {
  isOffline: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOffline }) => {
  return (
    <Banner
      id="offline-banner"
      priority={5} // Higher priority than demo (10) and conflicts (20) - appears at bottom
      visible={isOffline}
      variant="warning"
    >
      <div className="flex items-center gap-1.5">
        <WifiOff className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
        <span className="text-center">
          You appear to be offline. Some features may not work properly.
        </span>
      </div>
    </Banner>
  );
};

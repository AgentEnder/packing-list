import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Banner } from '@packing-list/shared-components';

interface DevModeBannerProps {
  isVisible: boolean;
}

export const DevModeBanner: React.FC<DevModeBannerProps> = ({ isVisible }) => {
  React.useEffect(() => {
    console.log('🛠️ [DEV BANNER] Banner visibility changed:', isVisible);
  }, [isVisible]);

  return (
    <Banner
      id="dev-mode"
      priority={10} // Higher priority than most banners (lower number = higher priority)
      visible={isVisible}
      variant="warning"
      className="border-warning-content/20"
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span className="font-medium">
        Development Mode - Not for production use
      </span>
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
    </Banner>
  );
};

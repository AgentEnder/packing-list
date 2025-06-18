import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { Banner } from '@packing-list/shared-components';

interface DevModeBannerProps {
  isVisible: boolean;
  timeSinceBuild?: string;
}

export const DevModeBanner: React.FC<DevModeBannerProps> = ({
  isVisible,
  timeSinceBuild,
}) => {
  React.useEffect(() => {
    console.log(
      '🛠️ [DEV BANNER] Banner visibility changed:',
      isVisible,
      'Time since build:',
      timeSinceBuild
    );
  }, [isVisible, timeSinceBuild]);

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
      {timeSinceBuild && (
        <>
          <span className="text-warning-content/70">•</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span className="text-sm">Built {timeSinceBuild} ago</span>
          </div>
        </>
      )}
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
    </Banner>
  );
};

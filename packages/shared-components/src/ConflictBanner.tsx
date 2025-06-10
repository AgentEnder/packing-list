import React from 'react';
import { AlertTriangle, Eye, X } from 'lucide-react';
import type { SyncConflict } from '@packing-list/model';
import { Banner } from './Banner.js';

interface ConflictBannerProps {
  conflicts: SyncConflict[];
  onViewConflicts: () => void;
  onDismiss?: () => void;
}

export const ConflictBanner: React.FC<ConflictBannerProps> = ({
  conflicts,
  onViewConflicts,
  onDismiss,
}) => {
  const conflictCount = conflicts.length;
  const hasMultiple = conflictCount > 1;

  return (
    <Banner
      id="conflict-banner"
      priority={20} // Higher priority than demo banner (10)
      visible={conflictCount > 0}
      variant="warning"
    >
      <div className="flex items-center gap-1.5">
        <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
        <span className="text-center">
          {hasMultiple
            ? `${conflictCount} sync conflicts need attention`
            : '1 sync conflict needs attention'}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onViewConflicts}
          className="btn btn-xs btn-ghost gap-1 h-6 min-h-0"
        >
          <Eye className="w-3 h-3" />
          Resolve
        </button>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="btn btn-xs btn-ghost gap-1 h-6 min-h-0"
            aria-label="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </Banner>
  );
};

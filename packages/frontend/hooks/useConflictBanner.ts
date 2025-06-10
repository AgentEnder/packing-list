import React, { useState, useCallback } from 'react';
import { useSyncContext } from '../components/SyncProvider.js';

export const useConflictBanner = () => {
  const { syncState } = useSyncContext();
  const [isDismissed, setIsDismissed] = useState(false);

  const conflicts = syncState.conflicts || [];

  // Auto-show banner when new conflicts appear
  const shouldShowBanner = conflicts.length > 0 && !isDismissed;

  const handleViewConflicts = useCallback(() => {
    // Navigate to sync demo page where conflicts can be resolved
    window.location.href = '/sync-demo';
  }, []);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  // Reset dismissal when conflicts are resolved
  React.useEffect(() => {
    if (conflicts.length === 0) {
      setIsDismissed(false);
    }
  }, [conflicts.length]);

  return {
    conflicts,
    shouldShowBanner,
    handleViewConflicts,
    handleDismiss,
  };
};

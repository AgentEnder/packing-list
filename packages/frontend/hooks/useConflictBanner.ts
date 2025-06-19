import React, { useState, useCallback } from 'react';
import { useAppSelector } from '@packing-list/state';
import { navigate } from 'vike/client/router';

export const useConflictBanner = () => {
  // Use try-catch to handle potential context errors during initialization
  let syncState, hasSyncContext;

  try {
    syncState = useAppSelector((state) => state.sync.syncState);
    hasSyncContext = true;
  } catch (error) {
    console.warn(
      '⚠️ [CONFLICT BANNER] Sync context not available yet:',
      error instanceof Error ? error.message : String(error)
    );
    syncState = {
      lastSyncTimestamp: null,
      pendingChanges: [],
      isOnline: true,
      isSyncing: false,
      conflicts: [],
    };
    hasSyncContext = false;
  }

  const [isDismissed, setIsDismissed] = useState(false);

  const conflicts = syncState.conflicts || [];

  // Auto-show banner when new conflicts appear
  const shouldShowBanner =
    conflicts.length > 0 && !isDismissed && hasSyncContext;

  const handleViewConflicts = useCallback(() => {
    // Navigate to settings page with sync dashboard tab
    navigate('/settings#sync');
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

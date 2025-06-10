import { useState, useEffect, useCallback } from 'react';
import type { SyncConflict, SyncState } from '@packing-list/model';
import { getConflictResolver } from './conflict-resolver.js';
import { getSyncService } from './sync.js';

interface ConflictResolutionState {
  conflicts: SyncConflict[];
  isResolving: boolean;
  error: string | null;
}

interface ConflictResolutionActions {
  resolveConflict: (
    conflictId: string,
    strategy: 'local' | 'server' | 'manual',
    manualData?: unknown
  ) => Promise<void>;
  resolveAllConflicts: (strategy: 'local' | 'server') => Promise<void>;
  refreshConflicts: () => Promise<void>;
}

export function useConflictResolution(): ConflictResolutionState &
  ConflictResolutionActions {
  const [state, setState] = useState<ConflictResolutionState>({
    conflicts: [],
    isResolving: false,
    error: null,
  });

  const conflictResolver = getConflictResolver();
  const syncService = getSyncService();

  const refreshConflicts = useCallback(async () => {
    try {
      const conflicts = await conflictResolver.getConflicts();
      setState((prev) => ({ ...prev, conflicts, error: null }));
    } catch (error) {
      console.error(
        '[useConflictResolution] Failed to refresh conflicts:',
        error
      );
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : 'Failed to load conflicts',
      }));
    }
  }, [conflictResolver]);

  const resolveConflict = useCallback(
    async (
      conflictId: string,
      strategy: 'local' | 'server' | 'manual',
      manualData?: unknown
    ) => {
      setState((prev) => ({ ...prev, isResolving: true, error: null }));

      try {
        await conflictResolver.resolveConflict(conflictId, {
          strategy,
          manualData,
          reason: `User selected ${strategy} resolution`,
        });

        await refreshConflicts();
        console.log(
          `[useConflictResolution] Resolved conflict ${conflictId} with ${strategy} strategy`
        );
      } catch (error) {
        console.error(
          '[useConflictResolution] Failed to resolve conflict:',
          error
        );
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to resolve conflict',
        }));
      } finally {
        setState((prev) => ({ ...prev, isResolving: false }));
      }
    },
    [conflictResolver, refreshConflicts]
  );

  const resolveAllConflicts = useCallback(
    async (strategy: 'local' | 'server') => {
      setState((prev) => ({ ...prev, isResolving: true, error: null }));

      try {
        await conflictResolver.resolveAllConflicts(strategy);
        await refreshConflicts();
        console.log(
          `[useConflictResolution] Resolved all conflicts with ${strategy} strategy`
        );
      } catch (error) {
        console.error(
          '[useConflictResolution] Failed to resolve all conflicts:',
          error
        );
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to resolve conflicts',
        }));
      } finally {
        setState((prev) => ({ ...prev, isResolving: false }));
      }
    },
    [conflictResolver, refreshConflicts]
  );

  // Subscribe to sync state changes to auto-refresh conflicts
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const subscribe = async () => {
      // Initial load
      await refreshConflicts();

      // Subscribe to sync state changes
      unsubscribe = syncService.subscribe(async (syncState: SyncState) => {
        // Refresh conflicts when sync state changes
        setState((prev) => ({ ...prev, conflicts: syncState.conflicts }));
      });
    };

    subscribe().catch(console.error);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [syncService, refreshConflicts]);

  return {
    ...state,
    resolveConflict,
    resolveAllConflicts,
    refreshConflicts,
  };
}

export default useConflictResolution;

import React, { createContext, useContext, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@packing-list/state';
import { reloadFromIndexedDB } from '@packing-list/state';
import type { SyncState } from '@packing-list/model';

interface SyncContextValue {
  syncState: SyncState;
  isInitialized: boolean;
  lastError: string | null;
  forceSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export const useSyncContext = (): SyncContextValue => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within SyncProvider');
  }
  return context;
};

interface SyncProviderProps {
  children: React.ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();

  // Get sync state from Redux
  const syncState = useAppSelector((state) => state.sync.syncState);
  const isInitialized = useAppSelector((state) => state.sync.isInitialized);
  const lastError = useAppSelector((state) => state.sync.lastError);
  const user = useAppSelector((state) => state.auth.user);

  // Initialize sync service when authenticated
  useEffect(() => {
    let syncService: any = null;
    let unsubscribe: (() => void) | null = null;

    const initializeSync = async () => {
      try {
        console.log(
          '🚀 [SYNC PROVIDER] Initializing real sync service with Redux dispatch...'
        );
        console.log('👤 [SYNC PROVIDER] Current user:', user);

        // Reset the singleton and sync state when user changes
        const { getSyncService, resetSyncService } = await import(
          '@packing-list/sync'
        );

        // Force reset the sync service singleton to ensure fresh instance with new user
        if (isInitialized) {
          console.log(
            '🔄 [SYNC PROVIDER] Resetting sync service for new user...'
          );
          resetSyncService();
        }

        // Create a function to handle IndexedDB reload
        const handleReloadFromIndexedDB = (payload: {
          syncedCount: number;
          isInitialSync: boolean;
          userId: string;
        }) => {
          console.log('🔄 [SYNC PROVIDER] Dispatching reload thunk:', payload);
          dispatch(reloadFromIndexedDB(payload) as any);
        };

        // Pass Redux dispatch and current user ID to sync service options
        syncService = getSyncService({
          dispatch: dispatch, // Provide Redux dispatch to sync service
          reloadFromIndexedDB: handleReloadFromIndexedDB, // Thunk dispatcher for IndexedDB reload
          userId: user?.id, // Pass current user ID for data filtering
        });

        // Subscribe to sync state changes and update Redux
        unsubscribe = syncService.subscribe((state: SyncState) => {
          console.log('🔄 [SYNC PROVIDER] Sync state updated:', state);
          dispatch({ type: 'SET_SYNC_STATE', payload: state });
        });

        // Start the sync service
        await syncService.start();

        // Mark as initialized
        dispatch({ type: 'SET_SYNC_INITIALIZED', payload: true });

        console.log(
          '✅ [SYNC PROVIDER] Sync service initialized successfully with Redux integration'
        );
      } catch (error) {
        console.error(
          '❌ [SYNC PROVIDER] Failed to initialize sync service:',
          error
        );
        dispatch({
          type: 'SET_SYNC_ERROR',
          payload:
            error instanceof Error
              ? error.message
              : 'Sync initialization failed',
        });
      }
    };

    // Only initialize if we have a user
    if (user) {
      // Reset sync state when user changes to force re-initialization
      if (isInitialized) {
        console.log('🔄 [SYNC PROVIDER] User changed, resetting sync state...');
        dispatch({ type: 'RESET_SYNC_STATE' });
      }

      initializeSync();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (syncService) {
        syncService.stop();
      }
    };
  }, [dispatch, user]); // Remove isInitialized from dependencies

  const forceSync = async (): Promise<void> => {
    try {
      console.log('🔄 [SYNC PROVIDER] Forcing sync with Redux integration...');
      dispatch({ type: 'SET_SYNC_SYNCING_STATUS', payload: true });

      // Get the sync service and force sync
      const { getSyncService } = await import('@packing-list/sync');
      const syncService = getSyncService({
        dispatch: dispatch, // Ensure dispatch is available for force sync too
      });
      await syncService.forceSync();

      // Sync completion and Redux updates are handled automatically via the dispatch callbacks
      dispatch({ type: 'UPDATE_LAST_SYNC_TIMESTAMP', payload: Date.now() });
      dispatch({ type: 'SET_SYNC_SYNCING_STATUS', payload: false });

      console.log('✅ [SYNC PROVIDER] Force sync completed with Redux updates');
    } catch (error) {
      console.error('❌ [SYNC PROVIDER] Force sync error:', error);
      dispatch({
        type: 'SET_SYNC_ERROR',
        payload: error instanceof Error ? error.message : 'Sync failed',
      });
      dispatch({ type: 'SET_SYNC_SYNCING_STATUS', payload: false });
    }
  };

  const contextValue: SyncContextValue = {
    syncState,
    isInitialized,
    lastError,
    forceSync,
  };

  // Expose sync context to window for e2e testing
  React.useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      (process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV === 'test')
    ) {
      console.log(
        '🔧 [SYNC PROVIDER] Exposing sync context to window for e2e testing'
      );
      console.log('🔧 [SYNC PROVIDER] Context value:', {
        hasForceSync: typeof forceSync === 'function',
        isInitialized,
        syncStateKeys: Object.keys(syncState || {}),
      });

      (window as any).__SYNC_CONTEXT__ = {
        syncState,
        isInitialized,
        lastError,
        forceSync,
      };

      console.log(
        '✅ [SYNC PROVIDER] Sync context exposed to window.__SYNC_CONTEXT__'
      );
    }
  }, [syncState, isInitialized, lastError, forceSync]);

  return (
    <SyncContext.Provider value={contextValue}>{children}</SyncContext.Provider>
  );
};

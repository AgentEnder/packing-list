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
    console.error(
      '🚨 [SYNC CONTEXT] Context is null - possible timing issue or missing SyncProvider'
    );
    console.error(
      '🚨 [SYNC CONTEXT] Check if component is wrapped in SyncProvider'
    );
    throw new Error(
      'useSyncContext must be used within SyncProvider. Ensure the component is wrapped in <SyncProvider>.'
    );
  }
  return context;
};

interface SyncProviderProps {
  children: React.ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();

  // Get sync state from Redux with fallback defaults
  const syncState = useAppSelector((state) => state.sync?.syncState) || {
    lastSyncTimestamp: null,
    pendingChanges: [],
    isOnline: true,
    isSyncing: false,
    conflicts: [],
  };
  const isInitialized =
    useAppSelector((state) => state.sync?.isInitialized) || false;
  const lastError = useAppSelector((state) => state.sync?.lastError) || null;
  const user = useAppSelector((state) => state.auth?.user);

  // Detect demo mode - when selected trip is the demo trip
  const selectedTripId = useAppSelector((state) => state.trips?.selectedTripId);
  const isDemoMode = selectedTripId === 'DEMO_TRIP';

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
        console.log('🎭 [SYNC PROVIDER] Demo mode:', isDemoMode);

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
          demoMode: isDemoMode, // Enable demo mode when using demo trip
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
  }, [dispatch, user, selectedTripId]); // React to demo mode changes via selectedTripId

  const forceSync = async (): Promise<void> => {
    try {
      console.log('🔄 [SYNC PROVIDER] Forcing sync with Redux integration...');
      dispatch({ type: 'SET_SYNC_SYNCING_STATUS', payload: true });

      // Get the sync service and force sync
      const { getSyncService } = await import('@packing-list/sync');
      const syncService = getSyncService({
        dispatch: dispatch, // Ensure dispatch is available for force sync too
        demoMode: isDemoMode, // Pass demo mode for consistency
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
    syncState: syncState || {
      lastSyncTimestamp: null,
      pendingChanges: [],
      isOnline: true,
      isSyncing: false,
      conflicts: [],
    },
    isInitialized: isInitialized || false,
    lastError: lastError || null,
    forceSync,
  };

  return (
    <SyncContext.Provider value={contextValue}>{children}</SyncContext.Provider>
  );
};

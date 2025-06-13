import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useAppSelector, useAppDispatch } from '@packing-list/state';
import { reloadFromIndexedDB } from '@packing-list/state';
import type { SyncState } from '@packing-list/model';
import {
  getSyncService,
  resetSyncService,
  SyncService,
} from '@packing-list/sync';

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
  const dispatchRef = useRef(dispatch);
  const currentUserRef = useRef<string | null>(null);
  const syncServiceRef = useRef<SyncService | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isInitializingRef = useRef<boolean>(false);

  // Update dispatch ref when it changes
  useEffect(() => {
    dispatchRef.current = dispatch;
  }, [dispatch]);

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

  const cleanupSync = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (syncServiceRef.current) {
      syncServiceRef.current.stop();
      syncServiceRef.current = null;
    }
    isInitializingRef.current = false;
  }, []);

  const initializeSync = useCallback(
    async (userId: string) => {
      if (isInitializingRef.current) {
        console.log('🔍 [SYNC PROVIDER] Already initializing, skipping...');
        return;
      }

      try {
        isInitializingRef.current = true;
        console.log('🚀 [SYNC PROVIDER] Initializing sync service...');
        console.log('👤 [SYNC PROVIDER] User ID:', userId);
        console.log('🎭 [SYNC PROVIDER] Demo mode:', isDemoMode);

        if (isDemoMode) {
          console.log(
            '🎭 [SYNC PROVIDER] Demo mode active, skipping sync service initialization'
          );
          return;
        }

        // Create a function to handle IndexedDB reload
        const handleReloadFromIndexedDB = (payload: {
          syncedCount: number;
          isInitialSync: boolean;
          userId: string;
        }) => {
          console.log('🔄 [SYNC PROVIDER] Dispatching reload thunk:', payload);
          dispatchRef.current(reloadFromIndexedDB(payload));
        };

        // Pass Redux dispatch and current user ID to sync service options
        syncServiceRef.current = getSyncService({
          dispatch: dispatchRef.current,
          reloadFromIndexedDB: handleReloadFromIndexedDB,
          userId: userId,
          demoMode: isDemoMode,
        });

        // Subscribe to sync state changes and update Redux
        unsubscribeRef.current = syncServiceRef.current.subscribe(
          (state: SyncState) => {
            console.log('🔄 [SYNC PROVIDER] Sync state updated:', state);
            dispatchRef.current({ type: 'SET_SYNC_STATE', payload: state });
          }
        );

        // Start the sync service
        await syncServiceRef.current.start();

        // Mark as initialized
        dispatchRef.current({ type: 'SET_SYNC_INITIALIZED', payload: true });

        console.log('✅ [SYNC PROVIDER] Sync service initialized successfully');
      } catch (error) {
        console.error(
          '❌ [SYNC PROVIDER] Failed to initialize sync service:',
          error
        );
        dispatchRef.current({
          type: 'SET_SYNC_ERROR',
          payload:
            error instanceof Error
              ? error.message
              : 'Sync initialization failed',
        });
      } finally {
        isInitializingRef.current = false;
      }
    },
    [isDemoMode]
  ); // Only depend on isDemoMode

  // Initialize sync service when authenticated
  useEffect(() => {
    const currentUserId = user?.id || null;
    const hasUserChanged = currentUserRef.current !== currentUserId;

    console.log('🔍 [SYNC PROVIDER] useEffect triggered:', {
      currentUserId,
      previousUserId: currentUserRef.current,
      hasUserChanged,
      isDemoMode,
      isInitializing: isInitializingRef.current,
    });

    if (user && !isDemoMode && hasUserChanged && !isInitializingRef.current) {
      console.log(
        '🔄 [SYNC PROVIDER] Auth status changed, initializing sync...'
      );

      // Clean up existing sync service if any
      cleanupSync();

      // Reset sync state for new user (but only if we had a previous user)
      if (currentUserRef.current !== null) {
        console.log(
          '🔄 [SYNC PROVIDER] Resetting sync state for user change...'
        );
        dispatchRef.current({ type: 'RESET_SYNC_STATE' });
        resetSyncService();
      }

      // Update the current user ref BEFORE initializing to prevent re-entry
      currentUserRef.current = currentUserId;

      // Initialize sync service
      initializeSync(currentUserId!);
    } else if (!user && currentUserRef.current !== null) {
      // User logged out, reset everything
      console.log('🔄 [SYNC PROVIDER] User logged out, cleaning up sync...');
      cleanupSync();
      currentUserRef.current = null;
      dispatchRef.current({ type: 'RESET_SYNC_STATE' });
      resetSyncService();
    } else {
      console.log('🔍 [SYNC PROVIDER] No action needed:', {
        hasUser: !!user,
        isDemoMode,
        hasUserChanged,
        isInitializing: isInitializingRef.current,
      });
    }

    // Only cleanup on unmount, not on every render
    return () => {
      console.log('🧹 [SYNC PROVIDER] Component unmounting, cleaning up...');
      cleanupSync();
    };
  }, [user?.id, isDemoMode]); // Remove callback dependencies to prevent re-creation loops

  const forceSync = async (): Promise<void> => {
    try {
      console.log('🔄 [SYNC PROVIDER] Forcing sync...');
      dispatchRef.current({ type: 'SET_SYNC_SYNCING_STATUS', payload: true });

      // Get the sync service and force sync
      const syncService = getSyncService({
        dispatch: dispatchRef.current,
        demoMode: isDemoMode,
      });
      await syncService.forceSync();

      // Sync completion and Redux updates are handled automatically via the dispatch callbacks
      dispatchRef.current({
        type: 'UPDATE_LAST_SYNC_TIMESTAMP',
        payload: Date.now(),
      });
      dispatchRef.current({ type: 'SET_SYNC_SYNCING_STATUS', payload: false });

      console.log('✅ [SYNC PROVIDER] Force sync completed');
    } catch (error) {
      console.error('❌ [SYNC PROVIDER] Force sync error:', error);
      dispatchRef.current({
        type: 'SET_SYNC_ERROR',
        payload: error instanceof Error ? error.message : 'Sync failed',
      });
      dispatchRef.current({ type: 'SET_SYNC_SYNCING_STATUS', payload: false });
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

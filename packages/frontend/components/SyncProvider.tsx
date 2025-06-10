import React, { createContext, useContext, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@packing-list/state';
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

  // Initialize sync service when authenticated
  useEffect(() => {
    console.log('🚀 [SYNC PROVIDER] Initializing with Redux-only mode');

    // Mark as initialized since we're using Redux state
    dispatch({ type: 'SET_SYNC_INITIALIZED', payload: true });
  }, [dispatch]);

  const forceSync = async (): Promise<void> => {
    try {
      console.log('🔄 [SYNC PROVIDER] Simulating force sync...');
      dispatch({ type: 'SET_SYNC_SYNCING_STATUS', payload: true });

      // Simulate sync delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      dispatch({ type: 'UPDATE_LAST_SYNC_TIMESTAMP', payload: Date.now() });
      dispatch({ type: 'SET_SYNC_SYNCING_STATUS', payload: false });
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

  return (
    <SyncContext.Provider value={contextValue}>{children}</SyncContext.Provider>
  );
};

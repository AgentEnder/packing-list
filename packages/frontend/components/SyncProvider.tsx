import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import type { SyncState } from '@packing-list/model';
import {
  initializeSyncService,
  useConflictResolution,
} from '@packing-list/sync';
import type { SyncService } from '@packing-list/sync';
import { useAuth } from '@packing-list/shared-components';

interface SyncContextType {
  syncState: SyncState;
  syncService: SyncService | null;
  isInitialized: boolean;
  forceSync: () => Promise<void>;
  conflictResolution: ReturnType<typeof useConflictResolution>;
}

const SyncContext = createContext<SyncContextType | null>(null);

interface SyncProviderProps {
  children: ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const [syncState, setSyncState] = useState<SyncState>({
    lastSyncTimestamp: 0,
    pendingChanges: [],
    isOnline: navigator?.onLine || true,
    isSyncing: false,
    conflicts: [],
  });
  const [syncService, setSyncService] = useState<SyncService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { user, isRemotelyAuthenticated } = useAuth();
  const conflictResolution = useConflictResolution();

  // Initialize sync service when user is authenticated
  useEffect(() => {
    const initSync = async () => {
      if (user && isRemotelyAuthenticated && !isInitialized) {
        try {
          console.log(
            '[SyncProvider] Initializing sync service for user:',
            user.id
          );

          const service = await initializeSyncService({
            autoSyncInterval: 30000, // 30 seconds
          });

          setSyncService(service);
          setIsInitialized(true);

          // Subscribe to sync state changes
          const unsubscribe = service.subscribe((state: SyncState) => {
            setSyncState(state);
          });

          // Get initial state
          const initialState = await service.getSyncState();
          setSyncState(initialState);

          console.log('[SyncProvider] Sync service initialized successfully');

          return unsubscribe;
        } catch (error) {
          console.error(
            '[SyncProvider] Failed to initialize sync service:',
            error
          );
        }
      }
    };

    let unsubscribe: (() => void) | undefined;

    initSync().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (syncService) {
        syncService.stop();
        setSyncService(null);
        setIsInitialized(false);
      }
    };
  }, [user, isRemotelyAuthenticated, isInitialized, syncService]);

  const forceSync = async () => {
    if (syncService) {
      try {
        await syncService.forceSync();
      } catch (error) {
        console.error('[SyncProvider] Force sync failed:', error);
      }
    }
  };

  const contextValue: SyncContextType = {
    syncState,
    syncService,
    isInitialized,
    forceSync,
    conflictResolution,
  };

  return (
    <SyncContext.Provider value={contextValue}>{children}</SyncContext.Provider>
  );
};

export const useSync = (): SyncContextType => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};

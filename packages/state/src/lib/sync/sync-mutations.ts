import type { StoreType } from '../../store.js';
import type { SyncState, SyncConflict } from '@packing-list/model';

export type SyncActions =
  | { type: 'SET_SYNC_STATE'; payload: Partial<SyncState> }
  | { type: 'SET_SYNC_INITIALIZED'; payload: boolean }
  | { type: 'ADD_SYNC_CONFLICT'; payload: SyncConflict }
  | { type: 'REMOVE_SYNC_CONFLICT'; payload: string }
  | { type: 'CLEAR_SYNC_CONFLICTS' }
  | { type: 'SET_SYNC_CONFLICTS'; payload: SyncConflict[] }
  | { type: 'SET_SYNC_ONLINE_STATUS'; payload: boolean }
  | { type: 'SET_SYNC_SYNCING_STATUS'; payload: boolean }
  | { type: 'UPDATE_LAST_SYNC_TIMESTAMP'; payload: number }
  | { type: 'SET_SYNC_PENDING_CHANGES'; payload: SyncState['pendingChanges'] }
  | { type: 'SET_SYNC_ERROR'; payload: string | null }
  | { type: 'RESET_SYNC_STATE' };

// Sync state mutations
export const setSyncState = (
  state: StoreType,
  action: { type: 'SET_SYNC_STATE'; payload: Partial<SyncState> }
): StoreType => {
  console.log('🔄 [SYNC MUTATION] Setting sync state:', action.payload);
  return {
    ...state,
    sync: {
      ...state.sync,
      syncState: { ...state.sync.syncState, ...action.payload },
    },
  };
};

export const setSyncInitialized = (
  state: StoreType,
  action: { type: 'SET_SYNC_INITIALIZED'; payload: boolean }
): StoreType => {
  console.log('🚀 [SYNC MUTATION] Setting initialized:', action.payload);
  return {
    ...state,
    sync: {
      ...state.sync,
      isInitialized: action.payload,
    },
  };
};

export const addSyncConflict = (
  state: StoreType,
  action: { type: 'ADD_SYNC_CONFLICT'; payload: SyncConflict }
): StoreType => {
  console.log('⚠️ [SYNC MUTATION] Adding conflict:', action.payload.id);
  const exists = state.sync.syncState.conflicts.some(
    (c) => c.id === action.payload.id
  );
  if (exists) {
    return state;
  }

  return {
    ...state,
    sync: {
      ...state.sync,
      syncState: {
        ...state.sync.syncState,
        conflicts: [...state.sync.syncState.conflicts, action.payload],
      },
    },
  };
};

export const removeSyncConflict = (
  state: StoreType,
  action: { type: 'REMOVE_SYNC_CONFLICT'; payload: string }
): StoreType => {
  console.log('✅ [SYNC MUTATION] Removing conflict:', action.payload);
  return {
    ...state,
    sync: {
      ...state.sync,
      syncState: {
        ...state.sync.syncState,
        conflicts: state.sync.syncState.conflicts.filter(
          (c) => c.id !== action.payload
        ),
      },
    },
  };
};

export const clearSyncConflicts = (
  state: StoreType,
  action: { type: 'CLEAR_SYNC_CONFLICTS' }
): StoreType => {
  console.log('🧹 [SYNC MUTATION] Clearing all conflicts');
  return {
    ...state,
    sync: {
      ...state.sync,
      syncState: {
        ...state.sync.syncState,
        conflicts: [],
      },
    },
  };
};

export const setSyncConflicts = (
  state: StoreType,
  action: { type: 'SET_SYNC_CONFLICTS'; payload: SyncConflict[] }
): StoreType => {
  console.log('📋 [SYNC MUTATION] Setting conflicts:', action.payload.length);
  return {
    ...state,
    sync: {
      ...state.sync,
      syncState: {
        ...state.sync.syncState,
        conflicts: action.payload,
      },
    },
  };
};

export const setSyncOnlineStatus = (
  state: StoreType,
  action: { type: 'SET_SYNC_ONLINE_STATUS'; payload: boolean }
): StoreType => {
  console.log('🌐 [SYNC MUTATION] Setting online status:', action.payload);
  return {
    ...state,
    sync: {
      ...state.sync,
      syncState: {
        ...state.sync.syncState,
        isOnline: action.payload,
      },
    },
  };
};

export const setSyncSyncingStatus = (
  state: StoreType,
  action: { type: 'SET_SYNC_SYNCING_STATUS'; payload: boolean }
): StoreType => {
  console.log('⏳ [SYNC MUTATION] Setting syncing status:', action.payload);
  return {
    ...state,
    sync: {
      ...state.sync,
      syncState: {
        ...state.sync.syncState,
        isSyncing: action.payload,
      },
    },
  };
};

export const updateLastSyncTimestamp = (
  state: StoreType,
  action: { type: 'UPDATE_LAST_SYNC_TIMESTAMP'; payload: number }
): StoreType => {
  console.log(
    '🕐 [SYNC MUTATION] Updating last sync timestamp:',
    new Date(action.payload)
  );
  return {
    ...state,
    sync: {
      ...state.sync,
      syncState: {
        ...state.sync.syncState,
        lastSyncTimestamp: action.payload,
      },
    },
  };
};

export const setSyncPendingChanges = (
  state: StoreType,
  action: {
    type: 'SET_SYNC_PENDING_CHANGES';
    payload: SyncState['pendingChanges'];
  }
): StoreType => {
  console.log(
    '📝 [SYNC MUTATION] Setting pending changes:',
    action.payload.length
  );
  return {
    ...state,
    sync: {
      ...state.sync,
      syncState: {
        ...state.sync.syncState,
        pendingChanges: action.payload,
      },
    },
  };
};

export const setSyncError = (
  state: StoreType,
  action: { type: 'SET_SYNC_ERROR'; payload: string | null }
): StoreType => {
  console.log('❌ [SYNC MUTATION] Setting error:', action.payload);
  return {
    ...state,
    sync: {
      ...state.sync,
      lastError: action.payload,
    },
  };
};

export const resetSyncState = (
  state: StoreType,
  action: { type: 'RESET_SYNC_STATE' }
): StoreType => {
  console.log('🔄 [SYNC MUTATION] Resetting sync state');
  return {
    ...state,
    sync: {
      syncState: {
        lastSyncTimestamp: null,
        pendingChanges: [],
        isOnline: true,
        isSyncing: false,
        conflicts: [],
      },
      isInitialized: false,
      lastError: null,
    },
  };
};

import type { StoreType } from '../../store.js';
import { syncStateReducer } from './reducers.js';
import type {
  SyncState,
  SyncConflict,
  Trip,
  Person,
  TripItem,
  Change,
} from '@packing-list/model';

// Sync state action handlers that work with the main store
export const setSyncStateHandler = (
  state: StoreType,
  action: { type: 'SET_SYNC_STATE'; payload: Partial<SyncState> }
): StoreType => {
  const newSyncState = syncStateReducer(state.sync, action);
  return {
    ...state,
    sync: newSyncState,
  };
};

export const setSyncInitializedHandler = (
  state: StoreType,
  action: { type: 'SET_SYNC_INITIALIZED'; payload: boolean }
): StoreType => {
  const newSyncState = syncStateReducer(state.sync, action);
  return {
    ...state,
    sync: newSyncState,
  };
};

export const addSyncConflictHandler = (
  state: StoreType,
  action: { type: 'ADD_SYNC_CONFLICT'; payload: SyncConflict }
): StoreType => {
  const newSyncState = syncStateReducer(state.sync, action);
  return {
    ...state,
    sync: newSyncState,
  };
};

export const removeSyncConflictHandler = (
  state: StoreType,
  action: { type: 'REMOVE_SYNC_CONFLICT'; payload: string }
): StoreType => {
  const newSyncState = syncStateReducer(state.sync, action);
  return {
    ...state,
    sync: newSyncState,
  };
};

export const clearSyncConflictsHandler = (
  state: StoreType,
  action: { type: 'CLEAR_SYNC_CONFLICTS' }
): StoreType => {
  const newSyncState = syncStateReducer(state.sync, action);
  return {
    ...state,
    sync: newSyncState,
  };
};

export const setSyncConflictsHandler = (
  state: StoreType,
  action: { type: 'SET_SYNC_CONFLICTS'; payload: SyncConflict[] }
): StoreType => {
  const newSyncState = syncStateReducer(state.sync, action);
  return {
    ...state,
    sync: newSyncState,
  };
};

export const setSyncOnlineStatusHandler = (
  state: StoreType,
  action: { type: 'SET_SYNC_ONLINE_STATUS'; payload: boolean }
): StoreType => {
  const newSyncState = syncStateReducer(state.sync, action);
  return {
    ...state,
    sync: newSyncState,
  };
};

export const setSyncSyncingStatusHandler = (
  state: StoreType,
  action: { type: 'SET_SYNC_SYNCING_STATUS'; payload: boolean }
): StoreType => {
  const newSyncState = syncStateReducer(state.sync, action);
  return {
    ...state,
    sync: newSyncState,
  };
};

export const updateLastSyncTimestampHandler = (
  state: StoreType,
  action: { type: 'UPDATE_LAST_SYNC_TIMESTAMP'; payload: number }
): StoreType => {
  const newSyncState = syncStateReducer(state.sync, action);
  return {
    ...state,
    sync: newSyncState,
  };
};

export const setSyncPendingChangesHandler = (
  state: StoreType,
  action: { type: 'SET_SYNC_PENDING_CHANGES'; payload: Change[] }
): StoreType => {
  const newSyncState = syncStateReducer(state.sync, action);
  return {
    ...state,
    sync: newSyncState,
  };
};

export const setSyncErrorHandler = (
  state: StoreType,
  action: { type: 'SET_SYNC_ERROR'; payload: string | null }
): StoreType => {
  const newSyncState = syncStateReducer(state.sync, action);
  return {
    ...state,
    sync: newSyncState,
  };
};

export const resetSyncStateHandler = (
  state: StoreType,
  action: { type: 'RESET_SYNC_STATE' }
): StoreType => {
  const newSyncState = syncStateReducer(state.sync, action);
  return {
    ...state,
    sync: newSyncState,
  };
};

export const mergeSyncedTripHandler = (
  state: StoreType,
  action: { type: 'MERGE_SYNCED_TRIP'; payload: Trip }
): StoreType => {
  const newSyncState = syncStateReducer(state.sync, action);
  return {
    ...state,
    sync: newSyncState,
  };
};

export const mergeSyncedPersonHandler = (
  state: StoreType,
  action: { type: 'MERGE_SYNCED_PERSON'; payload: Person }
): StoreType => {
  const newSyncState = syncStateReducer(state.sync, action);
  return {
    ...state,
    sync: newSyncState,
  };
};

export const mergeSyncedItemHandler = (
  state: StoreType,
  action: { type: 'MERGE_SYNCED_ITEM'; payload: TripItem }
): StoreType => {
  const newSyncState = syncStateReducer(state.sync, action);
  return {
    ...state,
    sync: newSyncState,
  };
};

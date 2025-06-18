import type { SyncActions } from './types.js';
import type {
  SyncState,
  SyncConflict,
  Trip,
  Person,
  TripItem,
  Change,
} from '@packing-list/model';

// Basic sync state actions
export const setSyncState = (payload: Partial<SyncState>): SyncActions => ({
  type: 'SET_SYNC_STATE',
  payload,
});

export const setSyncInitialized = (payload: boolean): SyncActions => ({
  type: 'SET_SYNC_INITIALIZED',
  payload,
});

export const addSyncConflict = (payload: SyncConflict): SyncActions => ({
  type: 'ADD_SYNC_CONFLICT',
  payload,
});

export const removeSyncConflict = (payload: string): SyncActions => ({
  type: 'REMOVE_SYNC_CONFLICT',
  payload,
});

export const clearSyncConflicts = (): SyncActions => ({
  type: 'CLEAR_SYNC_CONFLICTS',
});

export const setSyncConflicts = (payload: SyncConflict[]): SyncActions => ({
  type: 'SET_SYNC_CONFLICTS',
  payload,
});

export const setSyncOnlineStatus = (payload: boolean): SyncActions => ({
  type: 'SET_SYNC_ONLINE_STATUS',
  payload,
});

export const setSyncSyncingStatus = (payload: boolean): SyncActions => ({
  type: 'SET_SYNC_SYNCING_STATUS',
  payload,
});

export const updateLastSyncTimestamp = (payload: number): SyncActions => ({
  type: 'UPDATE_LAST_SYNC_TIMESTAMP',
  payload,
});

export const setSyncPendingChanges = (
  payload: SyncState['pendingChanges']
): SyncActions => ({
  type: 'SET_SYNC_PENDING_CHANGES',
  payload,
});

export const setSyncError = (payload: string | null): SyncActions => ({
  type: 'SET_SYNC_ERROR',
  payload,
});

export const resetSyncState = (): SyncActions => ({
  type: 'RESET_SYNC_STATE',
});

// Entity merge actions
export const mergeSyncedTrip = (payload: Trip): SyncActions => ({
  type: 'MERGE_SYNCED_TRIP',
  payload,
});

export const mergeSyncedPerson = (payload: Person): SyncActions => ({
  type: 'MERGE_SYNCED_PERSON',
  payload,
});

export const mergeSyncedItem = (payload: TripItem): SyncActions => ({
  type: 'MERGE_SYNCED_ITEM',
  payload,
});

// Change tracking action
export const trackSyncChange = (
  payload: Omit<Change, 'id' | 'timestamp' | 'synced'>
): SyncActions => ({
  type: 'TRACK_SYNC_CHANGE',
  payload,
});

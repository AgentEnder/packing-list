import type {
  SyncState,
  SyncConflict,
  Trip,
  Person,
  TripItem,
  Change,
} from '@packing-list/model';

// Core sync state structure
export interface SyncStateSlice {
  syncState: SyncState;
  isInitialized: boolean;
  lastError: string | null;
}

// Sync action types
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
  | { type: 'RESET_SYNC_STATE' }
  | { type: 'MERGE_SYNCED_TRIP'; payload: Trip }
  | { type: 'MERGE_SYNCED_PERSON'; payload: Person }
  | { type: 'MERGE_SYNCED_ITEM'; payload: TripItem }
  | {
      type: 'TRACK_SYNC_CHANGE';
      payload: Omit<Change, 'id' | 'timestamp' | 'synced'>;
    };

// Callback types for integration with different state management systems
export type SyncStateUpdateCallback = (slice: SyncStateSlice) => void;
export type TrackChangeCallback = (
  change: Omit<Change, 'id' | 'timestamp' | 'synced'>
) => void;

// Entity callbacks for create/update operations
export interface EntityCallbacks {
  onTripUpsert?: (trip: Trip) => void;
  onPersonUpsert?: (person: Person) => void;
  onItemUpsert?: (item: TripItem) => void;
}

// Helper type for determining if an entity exists
export interface EntityExistence {
  tripExists: (tripId: string) => boolean;
  personExists: (personId: string, tripId: string) => boolean;
  itemExists: (itemId: string, tripId: string) => boolean;
}

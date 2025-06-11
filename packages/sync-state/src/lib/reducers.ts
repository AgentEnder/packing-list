import type {
  SyncStateSlice,
  SyncActions,
  EntityCallbacks,
  EntityExistence,
} from './types.js';
import type {
  SyncState,
  Trip,
  Person,
  TripItem,
  SyncConflict,
} from '@packing-list/model';

/**
 * Initial sync state
 */
export const initialSyncState: SyncStateSlice = {
  syncState: {
    lastSyncTimestamp: null,
    pendingChanges: [],
    isOnline: true,
    isSyncing: false,
    conflicts: [],
  },
  isInitialized: false,
  lastError: null,
};

/**
 * Core sync state reducer
 */
export function syncStateReducer(
  state: SyncStateSlice = initialSyncState,
  action: SyncActions
): SyncStateSlice {
  switch (action.type) {
    case 'SET_SYNC_STATE':
      console.log('🔄 [SYNC STATE] Setting sync state:', action.payload);
      return {
        ...state,
        syncState: { ...state.syncState, ...action.payload },
      };

    case 'SET_SYNC_INITIALIZED':
      console.log('🚀 [SYNC STATE] Setting initialized:', action.payload);
      return {
        ...state,
        isInitialized: action.payload,
      };

    case 'ADD_SYNC_CONFLICT': {
      console.log('⚠️ [SYNC STATE] Adding conflict:', action.payload.id);
      const exists = state.syncState.conflicts.some(
        (c: SyncConflict) => c.id === action.payload.id
      );
      if (exists) {
        return state;
      }
      return {
        ...state,
        syncState: {
          ...state.syncState,
          conflicts: [...state.syncState.conflicts, action.payload],
        },
      };
    }

    case 'REMOVE_SYNC_CONFLICT':
      console.log('✅ [SYNC STATE] Removing conflict:', action.payload);
      return {
        ...state,
        syncState: {
          ...state.syncState,
          conflicts: state.syncState.conflicts.filter(
            (c: SyncConflict) => c.id !== action.payload
          ),
        },
      };

    case 'CLEAR_SYNC_CONFLICTS':
      console.log('🧹 [SYNC STATE] Clearing all conflicts');
      return {
        ...state,
        syncState: {
          ...state.syncState,
          conflicts: [],
        },
      };

    case 'SET_SYNC_CONFLICTS':
      console.log('📋 [SYNC STATE] Setting conflicts:', action.payload.length);
      return {
        ...state,
        syncState: {
          ...state.syncState,
          conflicts: action.payload,
        },
      };

    case 'SET_SYNC_ONLINE_STATUS':
      console.log('🌐 [SYNC STATE] Setting online status:', action.payload);
      return {
        ...state,
        syncState: {
          ...state.syncState,
          isOnline: action.payload,
        },
      };

    case 'SET_SYNC_SYNCING_STATUS':
      console.log('⏳ [SYNC STATE] Setting syncing status:', action.payload);
      return {
        ...state,
        syncState: {
          ...state.syncState,
          isSyncing: action.payload,
        },
      };

    case 'UPDATE_LAST_SYNC_TIMESTAMP':
      console.log(
        '🕐 [SYNC STATE] Updating last sync timestamp:',
        new Date(action.payload)
      );
      return {
        ...state,
        syncState: {
          ...state.syncState,
          lastSyncTimestamp: action.payload,
        },
      };

    case 'SET_SYNC_PENDING_CHANGES':
      console.log(
        '📝 [SYNC STATE] Setting pending changes:',
        action.payload.length
      );
      return {
        ...state,
        syncState: {
          ...state.syncState,
          pendingChanges: action.payload,
        },
      };

    case 'SET_SYNC_ERROR':
      console.log('❌ [SYNC STATE] Setting error:', action.payload);
      return {
        ...state,
        lastError: action.payload,
      };

    case 'RESET_SYNC_STATE':
      console.log('🔄 [SYNC STATE] Resetting sync state');
      return initialSyncState;

    default:
      return state;
  }
}

/**
 * Entity merge reducer that handles create vs update logic
 */
export function createEntityMergeReducer(
  entityCallbacks: EntityCallbacks,
  entityExistence: EntityExistence
) {
  return function entityMergeReducer(
    state: SyncStateSlice,
    action: SyncActions
  ): SyncStateSlice {
    switch (action.type) {
      case 'MERGE_SYNCED_TRIP': {
        const trip = action.payload;
        const exists = entityExistence.tripExists(trip.id);

        console.log(
          `${exists ? '🔄' : '🆕'} [SYNC MERGE] ${
            exists ? 'Updating' : 'Creating'
          } trip: ${trip.title} (${trip.id})`
        );

        if (entityCallbacks.onTripUpsert) {
          entityCallbacks.onTripUpsert(trip);
        }

        return state;
      }

      case 'MERGE_SYNCED_PERSON': {
        const person = action.payload;
        const exists = entityExistence.personExists(person.id, person.tripId);

        console.log(
          `${exists ? '🔄' : '🆕'} [SYNC MERGE] ${
            exists ? 'Updating' : 'Creating'
          } person: ${person.name} (${person.id})`
        );

        if (entityCallbacks.onPersonUpsert) {
          entityCallbacks.onPersonUpsert(person);
        }

        return state;
      }

      case 'MERGE_SYNCED_ITEM': {
        const item = action.payload;
        const exists = entityExistence.itemExists(item.id, item.tripId);

        console.log(
          `${exists ? '🔄' : '🆕'} [SYNC MERGE] ${
            exists ? 'Updating' : 'Creating'
          } item: ${item.name} (${item.id})`
        );

        if (entityCallbacks.onItemUpsert) {
          entityCallbacks.onItemUpsert(item);
        }

        return state;
      }

      default:
        return state;
    }
  };
}

/**
 * Change tracking reducer
 */
export function createChangeTrackingReducer(
  trackChangeCallback: (change: any) => void
) {
  return function changeTrackingReducer(
    state: SyncStateSlice,
    action: SyncActions
  ): SyncStateSlice {
    switch (action.type) {
      case 'TRACK_SYNC_CHANGE':
        console.log(
          `📋 [SYNC TRACK] Tracking ${action.payload.operation} ${action.payload.entityType}:${action.payload.entityId}`
        );
        trackChangeCallback(action.payload);
        return state;

      default:
        return state;
    }
  };
}

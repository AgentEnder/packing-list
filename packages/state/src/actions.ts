import { StoreType } from './store.js';
import type { SyncActions } from '@packing-list/sync-state';
import {
  addPersonHandler,
  AddPersonAction,
} from './action-handlers/add-person.js';
import {
  removePersonHandler,
  RemovePersonAction,
} from './action-handlers/remove-person.js';
import {
  updatePersonHandler,
  UpdatePersonAction,
} from './action-handlers/update-person.js';
import {
  calculateDefaultItems,
  CalculateDefaultItemsAction,
} from './action-handlers/calculate-default-items.js';
import {
  updateTripEventsHandler,
  UpdateTripEventsAction,
} from './action-handlers/update-trip-events.js';
import {
  calculateDaysHandler,
  CalculateDaysAction,
} from './action-handlers/calculate-days.js';
import {
  createItemRuleHandler,
  CreateItemRuleAction,
} from './action-handlers/create-item-rule.js';
import {
  updateItemRuleHandler,
  UpdateItemRuleAction,
} from './action-handlers/update-item-rule.js';
import {
  deleteItemRuleHandler,
  DeleteItemRuleAction,
} from './action-handlers/delete-item-rule.js';
import {
  addRuleOverrideHandler,
  AddRuleOverrideAction,
} from './action-handlers/add-rule-override.js';
import {
  updatePackingListViewHandler,
  UpdatePackingListViewAction,
} from './action-handlers/update-packing-list-view.js';
import {
  calculatePackingListHandler,
  CalculatePackingListAction,
} from './action-handlers/calculate-packing-list.js';
import {
  toggleItemPackedHandler,
  ToggleItemPackedAction,
} from './action-handlers/toggle-item-packed.js';
import {
  loadDemoDataHandler,
  LoadDemoDataAction,
} from './action-handlers/load-demo-data.js';
import {
  clearDemoDataHandler,
  clearDemoDataThunk,
  ClearDemoDataAction,
} from './action-handlers/clear-demo-data.js';
import {
  clearTripDataHandler,
  ClearTripDataAction,
} from './action-handlers/clear-trip-data.js';
import {
  toggleRulePackHandler,
  ToggleRulePackAction,
} from './action-handlers/toggle-rule-pack.js';
import {
  CreateRulePackAction,
  createRulePackHandler,
} from './action-handlers/create-rule-pack.js';
import {
  UpdateRulePackAction,
  updateRulePackHandler,
} from './action-handlers/update-rule-pack.js';
import {
  DeleteRulePackAction,
  deleteRulePackHandler,
} from './action-handlers/delete-rule-pack.js';
import {
  openRulePackModalHandler,
  OpenRulePackModalAction,
  closeRulePackModalHandler,
  CloseRulePackModalAction,
  setRulePackModalTabHandler,
  SetRulePackModalTabAction,
} from './action-handlers/rule-pack-modal.js';
import {
  openLoginModalHandler,
  OpenLoginModalAction,
  closeLoginModalHandler,
  CloseLoginModalAction,
} from './action-handlers/login-modal.js';
import {
  hydrateOfflineHandler,
  HydrateOfflineAction,
} from './action-handlers/hydrate-offline.js';
import {
  createTripHandler,
  CreateTripAction,
  selectTripHandler,
  SelectTripAction,
  deleteTripHandler,
  DeleteTripAction,
  updateTripSummaryHandler,
  UpdateTripSummaryAction,
} from './action-handlers/trip-management.js';
import {
  InitFlowAction,
  AdvanceFlowAction,
  ResetFlowAction,
  SetWizardStepAction,
  ResetWizardAction,
  initFlow,
  advanceFlow,
  resetFlow,
  setWizardStep,
  resetWizard,
  initFlowHandler,
  advanceFlowHandler,
  resetFlowHandler,
  setWizardStepHandler,
  resetWizardHandler,
} from './action-handlers/flow.js';
import {
  setSyncStateHandler,
  setSyncInitializedHandler,
  addSyncConflictHandler,
  removeSyncConflictHandler,
  clearSyncConflictsHandler,
  setSyncConflictsHandler,
  setSyncOnlineStatusHandler,
  setSyncSyncingStatusHandler,
  updateLastSyncTimestampHandler,
  setSyncPendingChangesHandler,
  setSyncErrorHandler,
  resetSyncStateHandler,
  mergeSyncedTripHandler,
  mergeSyncedPersonHandler,
  mergeSyncedItemHandler,
} from './lib/sync/sync-handlers.js';
import {
  SyncIntegrationActions,
  upsertSyncedTrip,
  upsertSyncedPerson,
  upsertSyncedItem,
} from './lib/sync/sync-integration.js';
import {
  TripStorage,
  PersonStorage,
  ItemStorage,
} from '@packing-list/offline-storage';
import { enableSyncMode, disableSyncMode } from '@packing-list/sync';

export type ActionHandler<T extends AllActions> = (
  state: StoreType,
  action: T
) => StoreType;

export type StoreActions = AllActions['type'];

export type AllActions =
  | AddPersonAction
  | RemovePersonAction
  | UpdatePersonAction
  | CalculateDefaultItemsAction
  | UpdateTripEventsAction
  | CalculateDaysAction
  | CreateItemRuleAction
  | UpdateItemRuleAction
  | DeleteItemRuleAction
  | AddRuleOverrideAction
  | UpdatePackingListViewAction
  | CalculatePackingListAction
  | ToggleItemPackedAction
  | LoadDemoDataAction
  | ClearDemoDataAction
  | ClearTripDataAction
  | ToggleRulePackAction
  | CreateRulePackAction
  | UpdateRulePackAction
  | DeleteRulePackAction
  | OpenRulePackModalAction
  | CloseRulePackModalAction
  | SetRulePackModalTabAction
  | OpenLoginModalAction
  | CloseLoginModalAction
  | CreateTripAction
  | SelectTripAction
  | DeleteTripAction
  | UpdateTripSummaryAction
  | InitFlowAction
  | AdvanceFlowAction
  | ResetFlowAction
  | SetWizardStepAction
  | ResetWizardAction
  | HydrateOfflineAction
  | SyncActions
  | SyncIntegrationActions
  | {
      type: 'RELOAD_FROM_INDEXEDDB';
      payload: { syncedCount: number; isInitialSync: boolean };
    }
  | {
      type: 'SYNC_UPDATE_TRIP_SUMMARIES';
      payload: {
        summaries: Array<{
          tripId: string;
          title: string;
          description: string;
          createdAt: string;
          updatedAt: string;
          totalItems: number;
          packedItems: number;
          totalPeople: number;
        }>;
      };
    };

export const Mutations: {
  [K in StoreActions]: ActionHandler<Extract<AllActions, { type: K }>>;
} = {
  ADD_PERSON: addPersonHandler,
  REMOVE_PERSON: removePersonHandler,
  UPDATE_PERSON: updatePersonHandler,
  CALCULATE_DEFAULT_ITEMS: calculateDefaultItems,
  UPDATE_TRIP_EVENTS: updateTripEventsHandler,
  CALCULATE_DAYS: calculateDaysHandler,
  CREATE_ITEM_RULE: createItemRuleHandler,
  UPDATE_ITEM_RULE: updateItemRuleHandler,
  DELETE_ITEM_RULE: deleteItemRuleHandler,
  ADD_RULE_OVERRIDE: addRuleOverrideHandler,
  UPDATE_PACKING_LIST_VIEW: updatePackingListViewHandler,
  CALCULATE_PACKING_LIST: calculatePackingListHandler,
  TOGGLE_ITEM_PACKED: toggleItemPackedHandler,
  LOAD_DEMO_DATA: loadDemoDataHandler,
  CLEAR_DEMO_DATA: clearDemoDataHandler,
  CLEAR_TRIP_DATA: clearTripDataHandler,
  TOGGLE_RULE_PACK: toggleRulePackHandler,
  CREATE_RULE_PACK: createRulePackHandler,
  UPDATE_RULE_PACK: updateRulePackHandler,
  DELETE_RULE_PACK: deleteRulePackHandler,
  OPEN_RULE_PACK_MODAL: openRulePackModalHandler,
  CLOSE_RULE_PACK_MODAL: closeRulePackModalHandler,
  SET_RULE_PACK_MODAL_TAB: setRulePackModalTabHandler,
  OPEN_LOGIN_MODAL: openLoginModalHandler,
  CLOSE_LOGIN_MODAL: closeLoginModalHandler,
  CREATE_TRIP: createTripHandler,
  SELECT_TRIP: selectTripHandler,
  DELETE_TRIP: deleteTripHandler,
  UPDATE_TRIP_SUMMARY: updateTripSummaryHandler,
  INIT_FLOW: initFlowHandler,
  ADVANCE_FLOW: advanceFlowHandler,
  RESET_FLOW: resetFlowHandler,
  SET_WIZARD_STEP: setWizardStepHandler,
  RESET_WIZARD: resetWizardHandler,
  HYDRATE_OFFLINE: hydrateOfflineHandler,
  SET_SYNC_STATE: setSyncStateHandler,
  SET_SYNC_INITIALIZED: setSyncInitializedHandler,
  ADD_SYNC_CONFLICT: addSyncConflictHandler,
  REMOVE_SYNC_CONFLICT: removeSyncConflictHandler,
  CLEAR_SYNC_CONFLICTS: clearSyncConflictsHandler,
  SET_SYNC_CONFLICTS: setSyncConflictsHandler,
  SET_SYNC_ONLINE_STATUS: setSyncOnlineStatusHandler,
  SET_SYNC_SYNCING_STATUS: setSyncSyncingStatusHandler,
  UPDATE_LAST_SYNC_TIMESTAMP: updateLastSyncTimestampHandler,
  SET_SYNC_PENDING_CHANGES: setSyncPendingChangesHandler,
  SET_SYNC_ERROR: setSyncErrorHandler,
  RESET_SYNC_STATE: resetSyncStateHandler,
  MERGE_SYNCED_TRIP: mergeSyncedTripHandler,
  MERGE_SYNCED_PERSON: mergeSyncedPersonHandler,
  MERGE_SYNCED_ITEM: mergeSyncedItemHandler,
  TRACK_SYNC_CHANGE: (state: StoreType) => state, // Placeholder - no-op for now
  UPSERT_SYNCED_TRIP: upsertSyncedTrip,
  UPSERT_SYNCED_PERSON: upsertSyncedPerson,
  UPSERT_SYNCED_ITEM: upsertSyncedItem,
  RELOAD_FROM_INDEXEDDB: (
    state: StoreType,
    action: {
      type: 'RELOAD_FROM_INDEXEDDB';
      payload: { syncedCount: number; isInitialSync: boolean };
    }
  ) => {
    // This is just a placeholder - the actual work is done by the thunk
    console.log(
      `🔄 [RELOAD] Sync completed: ${action.payload.syncedCount} records synced (initial: ${action.payload.isInitialSync})`
    );
    return state;
  },
  SYNC_UPDATE_TRIP_SUMMARIES: (
    state: StoreType,
    action: {
      type: 'SYNC_UPDATE_TRIP_SUMMARIES';
      payload: {
        summaries: Array<{
          tripId: string;
          title: string;
          description: string;
          createdAt: string;
          updatedAt: string;
          totalItems: number;
          packedItems: number;
          totalPeople: number;
        }>;
      };
    }
  ) => {
    console.log(
      `🔄 [SYNC_UPDATE_TRIP_SUMMARIES] Updating ${action.payload.summaries.length} trip summaries from sync`
    );

    return {
      ...state,
      trips: {
        ...state.trips,
        summaries: action.payload.summaries,
      },
    };
  },
};

/**
 * Thunk to reload trip data from IndexedDB after sync
 */
export const reloadFromIndexedDB = (payload: {
  syncedCount: number;
  isInitialSync: boolean;
  userId: string;
}) => {
  return async (dispatch: (action: AllActions) => void) => {
    console.log(
      `🔄 [RELOAD_THUNK] Starting reload: ${payload.syncedCount} records synced (initial: ${payload.isInitialSync})`
    );

    try {
      // Import storage and sync utilities dynamically to avoid circular dependencies

      // Enable sync mode to prevent change tracking during sync operations
      enableSyncMode();

      try {
        // Get trips for the current user
        const trips = await TripStorage.getUserTrips(payload.userId);
        console.log(
          `📋 [RELOAD_THUNK] Loaded ${trips.length} trips from IndexedDB`
        );

        // First dispatch the placeholder action to trigger any sync state updates
        dispatch({
          type: 'RELOAD_FROM_INDEXEDDB',
          payload: {
            syncedCount: payload.syncedCount,
            isInitialSync: payload.isInitialSync,
          },
        });

        // Use UPSERT_SYNCED_TRIP to properly populate tripsById with full TripData objects
        // This ensures that tripsById[tripId] is populated and not undefined
        for (const trip of trips) {
          console.log(
            `🔄 [RELOAD_THUNK] Upserting trip: ${trip.title} (${trip.id})`
          );
          dispatch({
            type: 'UPSERT_SYNCED_TRIP',
            payload: trip,
          });

          // Also load related people and items for each trip
          try {
            const people = await PersonStorage.getTripPeople(trip.id);
            const items = await ItemStorage.getTripItems(trip.id);

            console.log(
              `👥 [RELOAD_THUNK] Loading ${people.length} people for trip ${trip.id}`
            );
            for (const person of people) {
              dispatch({
                type: 'UPSERT_SYNCED_PERSON',
                payload: person,
              });
            }

            console.log(
              `📦 [RELOAD_THUNK] Loading ${items.length} items for trip ${trip.id}`
            );
            for (const item of items) {
              dispatch({
                type: 'UPSERT_SYNCED_ITEM',
                payload: item,
              });
            }
          } catch (relationError) {
            console.error(
              `❌ [RELOAD_THUNK] Failed to load people/items for trip ${trip.id}:`,
              relationError
            );
          }
        }

        console.log(
          `✅ [RELOAD_THUNK] Successfully upserted ${trips.length} trips into Redux state (tripsById populated)`
        );
      } finally {
        // Always disable sync mode, even if an error occurred
        disableSyncMode();
      }
    } catch (error) {
      console.error(
        '❌ [RELOAD_THUNK] Failed to reload from IndexedDB:',
        error
      );
    }
  };
};

export const actions = {
  advanceFlow,
  resetFlow,
  initFlow,
  setWizardStep,
  resetWizard,
  reloadFromIndexedDB,
  clearDemoData: clearDemoDataThunk,
};

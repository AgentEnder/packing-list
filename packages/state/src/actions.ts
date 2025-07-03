import { initialState, StoreType } from './store.js';
import type { SyncActions } from './lib/sync/types.js';
import {
  addPersonHandler,
  AddPersonAction,
  addPerson,
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
  createItemRule,
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
  TriggerConfettiBurstAction,
  triggerConfettiBurstHandler,
} from './action-handlers/trigger-confetti-burst.js';
import {
  hydrateOfflineHandler,
  HydrateOfflineAction,
} from './action-handlers/hydrate-offline.js';
import {
  createTripHandler,
  CreateTripAction,
  createTrip,
  selectTripHandler,
  SelectTripAction,
  deleteTripHandler,
  DeleteTripAction,
  updateTripSummaryHandler,
  UpdateTripSummaryAction,
} from './action-handlers/trip-management.js';
import {
  createPersonFromProfileHandler,
  CreatePersonFromProfileAction,
  createPersonFromProfile,
} from './action-handlers/create-person-from-profile.js';
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
  processSyncedTripItemsHandler,
  bulkUpsertSyncedEntitiesHandler,
  type SyncIntegrationActions,
} from './lib/sync/sync-integration.js';

import {
  loadUserPreferencesHandler,
  updateUserPreferencesHandler,
  updateLastSelectedTripIdHandler,
  syncUserPreferencesHandler,
  LoadUserPreferencesAction,
  UpdateUserPreferencesAction,
  UpdateLastSelectedTripIdAction,
  SyncUserPreferencesAction,
} from './action-handlers/user-preferences-handlers.js';

// Import sync actions and thunks
import {
  syncFromServer,
  setSyncState,
  setSyncInitialized,
  addSyncConflict,
  removeSyncConflict,
  clearSyncConflicts,
  setSyncConflicts,
  setSyncOnlineStatus,
  setSyncSyncingStatus,
  updateLastSyncTimestamp,
  setSyncPendingChanges,
  setSyncError,
  resetSyncState,
} from './lib/sync/actions.js';

export type ActionHandler<T extends AllActions> = (
  state: StoreType,
  action: T
) => StoreType;

export type StoreActions = AllActions['type'];

export type AllActions =
  | AddPersonAction
  | RemovePersonAction
  | UpdatePersonAction
  | CreatePersonFromProfileAction
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
  | { type: 'CLEAR_ALL_DATA' }
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
  | TriggerConfettiBurstAction
  | LoadUserPreferencesAction
  | UpdateUserPreferencesAction
  | UpdateLastSelectedTripIdAction
  | SyncUserPreferencesAction
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
  CREATE_PERSON_FROM_PROFILE: createPersonFromProfileHandler,
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
  CLEAR_ALL_DATA: (state: StoreType) => {
    console.log('🧹 [CLEAR_ALL_DATA] Clearing all data except auth');
    return {
      ...initialState,
      auth: state.auth,
    };
  },
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
  TRIGGER_CONFETTI_BURST: triggerConfettiBurstHandler,
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
  MERGE_SYNCED_USER_PERSON: (s) => {
    // TODO: This will be needed when we have more than just the user profile
    return s;
  },
  TRACK_SYNC_CHANGE: (state: StoreType) => state, // Placeholder - no-op for now
  PROCESS_SYNCED_TRIP_ITEMS: processSyncedTripItemsHandler,
  BULK_UPSERT_SYNCED_ENTITIES: bulkUpsertSyncedEntitiesHandler,
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

  // User preferences handlers
  LOAD_USER_PREFERENCES: loadUserPreferencesHandler,
  UPDATE_USER_PREFERENCES: updateUserPreferencesHandler,
  UPDATE_LAST_SELECTED_TRIP_ID: updateLastSelectedTripIdHandler,
  SYNC_USER_PREFERENCES: syncUserPreferencesHandler,
};

export const actions = {
  advanceFlow,
  resetFlow,
  initFlow,
  setWizardStep,
  resetWizard,
  clearDemoData: clearDemoDataThunk,
  triggerConfettiBurst: (payload?: {
    x: number;
    y: number;
  }): TriggerConfettiBurstAction => ({
    type: 'TRIGGER_CONFETTI_BURST',
    payload,
  }),
  addPerson,
  createTrip,
  createItemRule,
  createPersonFromProfile,

  // Sync actions and thunks
  syncFromServer,
  setSyncState,
  setSyncInitialized,
  addSyncConflict,
  removeSyncConflict,
  clearSyncConflicts,
  setSyncConflicts,
  setSyncOnlineStatus,
  setSyncSyncingStatus,
  updateLastSyncTimestamp,
  setSyncPendingChanges,
  setSyncError,
  resetSyncState,
};

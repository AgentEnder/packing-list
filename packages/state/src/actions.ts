import { StoreType } from './store.js';
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
  | HydrateOfflineAction;

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
};

export const actions = {
  advanceFlow,
  resetFlow,
  initFlow,
  setWizardStep,
  resetWizard,
};

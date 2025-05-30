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
  clearTripDataHandler,
  ClearTripDataAction,
} from './action-handlers/clear-trip-data.js';
import {
  toggleRulePackHandler,
  ToggleRulePackAction,
} from './action-handlers/toggle-rule-pack.js';

export type ActionHandler<T extends AllActions> = (
  state: StoreType,
  action: T
) => StoreType;

export type StoreActions =
  | 'ADD_PERSON'
  | 'REMOVE_PERSON'
  | 'UPDATE_PERSON'
  | 'CALCULATE_DEFAULT_ITEMS'
  | 'UPDATE_TRIP_EVENTS'
  | 'CALCULATE_DAYS'
  | 'CREATE_ITEM_RULE'
  | 'UPDATE_ITEM_RULE'
  | 'DELETE_ITEM_RULE'
  | 'ADD_RULE_OVERRIDE'
  | 'UPDATE_PACKING_LIST_VIEW'
  | 'CALCULATE_PACKING_LIST'
  | 'TOGGLE_ITEM_PACKED'
  | 'LOAD_DEMO_DATA'
  | 'CLEAR_TRIP_DATA'
  | 'TOGGLE_RULE_PACK';

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
  | ClearTripDataAction
  | ToggleRulePackAction;

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
  CLEAR_TRIP_DATA: clearTripDataHandler,
  TOGGLE_RULE_PACK: toggleRulePackHandler,
};

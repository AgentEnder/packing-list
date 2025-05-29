import {
  AddPersonAction,
  addPersonHandler,
} from './action-handlers/add-person.js';
import {
  CalculateDaysAction,
  calculateDaysHandler,
} from './action-handlers/calculate-days.js';
import {
  CalculateDefaultItemsAction,
  calculateDefaultItems,
} from './action-handlers/calculate-default-items.js';
import {
  removePersonHandler,
  RemovePersonAction,
} from './action-handlers/remove-person.js';
import {
  updatePersonHandler,
  UpdatePersonAction,
} from './action-handlers/update-person.js';
import {
  updateTripEventsHandler,
  UpdateTripEventsAction,
} from './action-handlers/update-trip-events.js';
import {
  CreateItemRuleAction,
  createItemRuleHandler,
} from './action-handlers/create-item-rule.js';
import {
  UpdateItemRuleAction,
  updateItemRuleHandler,
} from './action-handlers/update-item-rule.js';
import {
  DeleteItemRuleAction,
  deleteItemRuleHandler,
} from './action-handlers/delete-item-rule.js';
import {
  AddRuleOverrideAction,
  addRuleOverrideHandler,
} from './action-handlers/add-rule-override.js';
import {
  UpdatePackingListViewAction,
  updatePackingListViewHandler,
} from './action-handlers/update-packing-list-view.js';
import {
  CalculatePackingListAction,
  calculatePackingListHandler,
} from './action-handlers/calculate-packing-list.js';
import {
  ToggleItemPackedAction,
  toggleItemPackedHandler,
} from './action-handlers/toggle-item-packed.js';

import { StoreType } from './store.js';

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
  | ToggleItemPackedAction;

export type StoreActions = AllActions['type'];

export type ActionHandler<T extends AllActions> = (
  state: StoreType,
  action: T
) => StoreType;

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
};

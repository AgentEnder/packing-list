import {
  AddPersonAction,
  addPersonHandler,
} from './action-handlers/add-person.js';
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

import { StoreType } from './store.js';

export type AllActions =
  | AddPersonAction
  | RemovePersonAction
  | UpdatePersonAction
  | CalculateDefaultItemsAction
  | UpdateTripEventsAction;

export type StoreActions = AllActions['type'];

export const Mutations: {
  [Action in AllActions as Action['type']]: (
    state: StoreType,
    action: Action
  ) => StoreType;
} = {
  ADD_PERSON: addPersonHandler,
  REMOVE_PERSON: removePersonHandler,
  UPDATE_PERSON: updatePersonHandler,
  CALCULATE_DEFAULT_ITEMS: calculateDefaultItems,
  UPDATE_TRIP_EVENTS: updateTripEventsHandler,
};

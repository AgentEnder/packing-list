import { Person } from '@packing-list/model';
import { StoreType } from '../store.js';
import { calculateDefaultItems } from './calculate-default-items.js';
import { calculatePackingListHandler } from './calculate-packing-list.js';

export type AddPersonAction = {
  type: 'ADD_PERSON';
  payload: Person;
};

export const addPersonHandler = (
  state: StoreType,
  action: AddPersonAction
): StoreType => {
  // First add the person
  const stateWithNewPerson = {
    ...state,
    people: [...state.people, action.payload],
  };

  // Then recalculate default items
  const stateWithDefaultItems = calculateDefaultItems(stateWithNewPerson, {
    type: 'CALCULATE_DEFAULT_ITEMS',
  });

  // Finally recalculate packing list
  return calculatePackingListHandler(stateWithDefaultItems, {
    type: 'CALCULATE_PACKING_LIST',
  });
};

import { LegacyPerson as Person } from '@packing-list/model';
import { StoreType } from '../store.js';
import { calculateDefaultItems } from './calculate-default-items.js';
import { calculatePackingListHandler } from './calculate-packing-list.js';

export type UpdatePersonAction = {
  type: 'UPDATE_PERSON';
  payload: Person;
};

export const updatePersonHandler = (
  state: StoreType,
  action: UpdatePersonAction
): StoreType => {
  // First update the person
  const stateWithUpdatedPerson = {
    ...state,
    people: state.people.map((person) =>
      person.id === action.payload.id ? action.payload : person
    ),
  };

  // Then recalculate default items
  const stateWithDefaultItems = calculateDefaultItems(stateWithUpdatedPerson);

  // Finally recalculate packing list
  return calculatePackingListHandler(stateWithDefaultItems);
};

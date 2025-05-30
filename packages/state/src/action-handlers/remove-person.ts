import { StoreType } from '../store.js';
import { calculateDefaultItems } from './calculate-default-items.js';
import { calculatePackingListHandler } from './calculate-packing-list.js';

export type RemovePersonAction = {
  type: 'REMOVE_PERSON';
  payload: {
    id: string;
  };
};

export const removePersonHandler = (
  state: StoreType,
  action: RemovePersonAction
): StoreType => {
  // First remove the person
  const stateWithPersonRemoved = {
    ...state,
    people: state.people.filter((person) => person.id !== action.payload.id),
  };

  // Then recalculate default items
  const stateWithDefaultItems = calculateDefaultItems(stateWithPersonRemoved, {
    type: 'CALCULATE_DEFAULT_ITEMS',
  });

  // Finally recalculate packing list
  return calculatePackingListHandler(stateWithDefaultItems, {
    type: 'CALCULATE_PACKING_LIST',
  });
};

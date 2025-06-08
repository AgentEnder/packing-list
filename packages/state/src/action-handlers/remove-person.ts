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
  const selectedTripId = state.trips.selectedTripId;

  // Early return if no trip is selected
  if (!selectedTripId || !state.trips.byId[selectedTripId]) {
    console.warn('Cannot remove person: no trip selected');
    return state;
  }

  const selectedTripData = state.trips.byId[selectedTripId];

  // First remove the person from the selected trip
  const updatedTripData = {
    ...selectedTripData,
    people: selectedTripData.people.filter(
      (person) => person.id !== action.payload.id
    ),
  };

  const stateWithPersonRemoved = {
    ...state,
    trips: {
      ...state.trips,
      byId: {
        ...state.trips.byId,
        [selectedTripId]: updatedTripData,
      },
    },
  };

  // Then recalculate default items
  const stateWithDefaultItems = calculateDefaultItems(stateWithPersonRemoved);

  // Finally recalculate packing list
  return calculatePackingListHandler(stateWithDefaultItems);
};

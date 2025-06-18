import { StoreType } from '../store.js';
import { calculatePackingListHandler } from './calculate-packing-list.js';

export type RemovePersonAction = {
  type: 'REMOVE_PERSON';
  payload: { id: string };
};

export const removePersonHandler = (
  state: StoreType,
  action: RemovePersonAction
): StoreType => {
  const selectedTripId = state.trips.selectedTripId;

  // Early return if no trip is selected
  if (!selectedTripId || !state.trips.byId[selectedTripId]) {
    return state;
  }

  const selectedTripData = state.trips.byId[selectedTripId];

  // Find the person to remove (for tracking purposes)
  const personToRemove = selectedTripData.people.find(
    (person) => person.id === action.payload.id
  );

  if (!personToRemove) {
    return state; // Person not found, nothing to remove
  }

  // Remove the person from the trip
  const updatedTripData = {
    ...selectedTripData,
    people: selectedTripData.people.filter(
      (person) => person.id !== action.payload.id
    ),
  };

  const stateWithRemovedPerson = {
    ...state,
    trips: {
      ...state.trips,
      byId: {
        ...state.trips.byId,
        [selectedTripId]: updatedTripData,
      },
    },
  };

  // Recalculate packing list without the removed person
  return calculatePackingListHandler(stateWithRemovedPerson);
};

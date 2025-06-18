import { Person } from '@packing-list/model';
import { StoreType } from '../store.js';
import { calculatePackingListHandler } from './calculate-packing-list.js';

export type UpdatePersonAction = {
  type: 'UPDATE_PERSON';
  payload: Person;
};

export const updatePersonHandler = (
  state: StoreType,
  action: UpdatePersonAction
): StoreType => {
  const selectedTripId = state.trips.selectedTripId;

  // Early return if no trip is selected
  if (!selectedTripId || !state.trips.byId[selectedTripId]) {
    return state;
  }

  const selectedTripData = state.trips.byId[selectedTripId];

  // Update the person in the trip
  const updatedPeople = selectedTripData.people.map((person) =>
    person.id === action.payload.id ? action.payload : person
  );

  const updatedTripData = {
    ...selectedTripData,
    people: updatedPeople,
  };

  const stateWithUpdatedPerson = {
    ...state,
    trips: {
      ...state.trips,
      byId: {
        ...state.trips.byId,
        [selectedTripId]: updatedTripData,
      },
    },
  };

  // Recalculate packing list with updated person
  return calculatePackingListHandler(stateWithUpdatedPerson);
};

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
  const selectedTripId = state.trips.selectedTripId;

  // Early return if no trip is selected
  if (!selectedTripId || !state.trips.byId[selectedTripId]) {
    console.warn('Cannot update person: no trip selected');
    return state;
  }

  const selectedTripData = state.trips.byId[selectedTripId];

  // First update the person in the selected trip
  const updatedTripData = {
    ...selectedTripData,
    people: selectedTripData.people.map((person) =>
      person.id === action.payload.id ? action.payload : person
    ),
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

  // Then recalculate default items
  const stateWithDefaultItems = calculateDefaultItems(stateWithUpdatedPerson);

  // Finally recalculate packing list
  return calculatePackingListHandler(stateWithDefaultItems);
};

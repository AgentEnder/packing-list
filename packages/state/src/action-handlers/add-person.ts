import { LegacyPerson as Person } from '@packing-list/model';
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
  const selectedTripId = state.trips.selectedTripId;

  // Early return if no trip is selected
  if (!selectedTripId || !state.trips.byId[selectedTripId]) {
    console.warn('Cannot add person: no trip selected');
    return state;
  }

  const selectedTripData = state.trips.byId[selectedTripId];

  // Create updated trip data with new person
  const updatedTripData = {
    ...selectedTripData,
    people: [...selectedTripData.people, action.payload],
  };

  // Update state with new trip data
  const stateWithNewPerson = {
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
  const stateWithDefaultItems = calculateDefaultItems(stateWithNewPerson);

  // Finally recalculate packing list
  return calculatePackingListHandler(stateWithDefaultItems);
};

import { Person } from '@packing-list/model';
import { StoreType } from '../store.js';
import { calculatePackingListHandler } from './calculate-packing-list.js';
import { PersonStorage } from '@packing-list/offline-storage';

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
    return state;
  }

  const selectedTripData = state.trips.byId[selectedTripId];

  // Check if person already exists
  const existingPerson = selectedTripData.people.find(
    (p) => p.id === action.payload.id
  );

  if (existingPerson) {
    return state; // Person already exists, no need to add
  }

  const updatedTripData = {
    ...selectedTripData,
    people: [...selectedTripData.people, action.payload],
  };

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

  PersonStorage.savePerson(action.payload).catch(console.error);

  // Recalculate packing list with new person
  return calculatePackingListHandler(stateWithNewPerson);
};

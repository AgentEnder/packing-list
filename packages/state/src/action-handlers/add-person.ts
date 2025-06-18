import { Person } from '@packing-list/model';
import { uuid } from '@packing-list/shared-utils';
import { StoreType } from '../store.js';
import { calculatePackingListHandler } from './calculate-packing-list.js';

export type AddPersonAction = {
  type: 'ADD_PERSON';
  payload: Person;
};

// Action creator
export const addPerson = (payload: {
  name: string;
  age: number;
  gender?: string;
}): AddPersonAction => {
  const now = new Date().toISOString();
  return {
    type: 'ADD_PERSON',
    payload: {
      id: uuid(),
      name: payload.name,
      age: payload.age,
      gender: payload.gender as
        | 'male'
        | 'female'
        | 'other'
        | 'prefer-not-to-say'
        | undefined,
      settings: {},
      createdAt: now,
      updatedAt: now,
      version: 1,
      isDeleted: false,
      tripId: '', // Will be set by the handler from selected trip
    },
  };
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

  // Set the tripId on the person since action creator uses placeholder
  const personWithTripId = {
    ...action.payload,
    tripId: selectedTripId,
  };

  const updatedTripData = {
    ...selectedTripData,
    people: [...selectedTripData.people, personWithTripId],
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

  // Recalculate packing list with new person
  return calculatePackingListHandler(stateWithNewPerson);
};

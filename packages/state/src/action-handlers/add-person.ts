import {
  LegacyPerson as Person,
  type Person as PersonModel,
} from '@packing-list/model';
import { PersonStorage } from '@packing-list/offline-storage';
import { getChangeTracker } from '@packing-list/sync';
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

  // Persist and track change asynchronously
  const userId = state.auth.user?.id || 'local-user';
  const now = new Date().toISOString();
  const personModel: PersonModel = {
    id: action.payload.id,
    tripId: selectedTripId,
    name: action.payload.name,
    age: action.payload.age,
    gender: action.payload.gender as PersonModel['gender'],
    createdAt: now,
    updatedAt: now,
    version: 1,
    isDeleted: false,
  };
  PersonStorage.savePerson(personModel).catch(console.error);
  getChangeTracker()
    .trackPersonChange('create', personModel, userId, selectedTripId)
    .catch(console.error);

  // Then recalculate default items
  const stateWithDefaultItems = calculateDefaultItems(stateWithNewPerson);

  // Finally recalculate packing list
  return calculatePackingListHandler(stateWithDefaultItems);
};

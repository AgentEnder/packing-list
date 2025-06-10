import {
  LegacyPerson as Person,
  type Person as PersonModel,
} from '@packing-list/model';
import { PersonStorage } from '@packing-list/offline-storage';
import { getChangeTracker } from '@packing-list/sync';
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

  // Persist and track change asynchronously
  const userId = state.auth.user?.id || 'local-user';
  const now = new Date().toISOString();
  const personModel: PersonModel = {
    id: action.payload.id,
    tripId: selectedTripId,
    name: action.payload.name,
    age: action.payload.age,
    gender: action.payload.gender as any,
    createdAt: now,
    updatedAt: now,
    version: 1,
    isDeleted: false,
  };
  PersonStorage.savePerson(personModel).catch(console.error);
  getChangeTracker()
    .trackPersonChange('update', personModel, userId, selectedTripId)
    .catch(console.error);

  // Then recalculate default items
  const stateWithDefaultItems = calculateDefaultItems(stateWithUpdatedPerson);

  // Finally recalculate packing list
  return calculatePackingListHandler(stateWithDefaultItems);
};

import { StoreType } from '../store.js';
import { calculateDefaultItems } from './calculate-default-items.js';
import { calculatePackingListHandler } from './calculate-packing-list.js';
import { Person as PersonModel } from '@packing-list/model';
import { PersonStorage } from '@packing-list/offline-storage';
import { getChangeTracker } from '@packing-list/sync';

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

  // Persist deletion and track change asynchronously
  const userId = state.auth.user?.id || 'local-user';
  const now = new Date().toISOString();
  const removed = selectedTripData.people.find((p) => p.id === action.payload.id);
  if (removed) {
    const personModel: PersonModel = {
      id: removed.id,
      tripId: selectedTripId,
      name: removed.name,
      age: removed.age,
      gender: removed.gender as any,
      createdAt: now,
      updatedAt: now,
      version: 1,
      isDeleted: true,
    };
    PersonStorage.deletePerson(removed.id).catch(console.error);
    getChangeTracker()
      .trackPersonChange('delete', personModel, userId, selectedTripId)
      .catch(console.error);
  }

  // Then recalculate default items
  const stateWithDefaultItems = calculateDefaultItems(stateWithPersonRemoved);

  // Finally recalculate packing list
  return calculatePackingListHandler(stateWithDefaultItems);
};

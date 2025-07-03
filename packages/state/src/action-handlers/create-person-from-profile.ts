import { calculateCurrentAge, Person, UserPerson } from '@packing-list/model';
import { uuid } from '@packing-list/shared-utils';
import { StoreType } from '../store.js';
import { calculatePackingListHandler } from './calculate-packing-list.js';

export type CreatePersonFromProfileAction = {
  type: 'CREATE_PERSON_FROM_PROFILE';
  payload: {
    userPersonId: string;
    userPerson: UserPerson;
    tripId: string;
  };
};

// Action creator
export const createPersonFromProfile = (payload: {
  userPersonId: string;
  userPerson: UserPerson;
  tripId: string;
}): CreatePersonFromProfileAction => {
  return {
    type: 'CREATE_PERSON_FROM_PROFILE',
    payload,
  };
};

// Action handler
export const createPersonFromProfileHandler = (
  state: StoreType,
  action: CreatePersonFromProfileAction
): StoreType => {
  const { userPersonId, userPerson, tripId } = action.payload;

  // Get the target trip data
  const targetTripData = state.trips.byId[tripId];

  if (!targetTripData) {
    console.warn(`[CREATE_PERSON_FROM_PROFILE] Trip not found: ${tripId}`);
    return state;
  }

  // Check if a person from this user profile already exists in the trip
  const existingPersonFromProfile = targetTripData.people.find(
    (p) => p.userPersonId === userPersonId
  );

  if (existingPersonFromProfile && !existingPersonFromProfile.isDeleted) {
    console.log(
      `[CREATE_PERSON_FROM_PROFILE] Person from profile already exists in trip: ${existingPersonFromProfile.name}`
    );
    return state; // Don't add duplicate
  }

  // Create a new trip person based on the user profile
  const now = new Date().toISOString();
  const newPerson: Person = {
    id: uuid(),
    tripId,
    name: userPerson.name,
    age: userPerson.birthDate
      ? calculateCurrentAge(userPerson.birthDate)
      : undefined,
    gender: userPerson.gender,
    settings: userPerson.settings || {},
    userPersonId, // Link to the user profile
    createdAt: now,
    updatedAt: now,
    version: 1,
    isDeleted: false,
  };

  if (!newPerson.age) {
    console.warn(
      `[CREATE_PERSON_FROM_PROFILE] No age found for user profile: ${userPerson.name}`,
      userPerson
    );
    return state;
  }

  // Update the trip data with the new person
  const updatedTripData = {
    ...targetTripData,
    people: [...targetTripData.people, newPerson],
  };

  const stateWithNewPerson = {
    ...state,
    trips: {
      ...state.trips,
      byId: {
        ...state.trips.byId,
        [tripId]: updatedTripData,
      },
    },
  };

  console.log(
    `✅ [CREATE_PERSON_FROM_PROFILE] Added ${userPerson.name} from profile to trip ${tripId}`
  );

  // Recalculate packing list with new person
  return calculatePackingListHandler(stateWithNewPerson);
};

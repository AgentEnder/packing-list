import { StoreType, TripData } from '../store.js';
import { Trip, TripSummary } from '@packing-list/model';
import { uuid } from '@packing-list/shared-utils';
import { createEmptyTripData, initialState } from '../store.js';
import { createPersonFromProfileHandler } from './create-person-from-profile.js';
import { selectUserProfile } from '../user-people-slice.js';

// Action types
export interface CreateTripAction {
  type: 'CREATE_TRIP';
  payload: {
    tripId: string;
    title: string;
    description?: string;
  };
}

export interface SelectTripAction {
  type: 'SELECT_TRIP';
  payload: {
    tripId: string;
  };
}

export interface DeleteTripAction {
  type: 'DELETE_TRIP';
  payload: {
    tripId: string;
  };
}

export interface UpdateTripSummaryAction {
  type: 'UPDATE_TRIP_SUMMARY';
  payload: {
    tripId: string;
    title: string;
    description?: string;
  };
}

// Action creator
export const createTrip = (payload: {
  title: string;
  description?: string;
}): CreateTripAction => {
  return {
    type: 'CREATE_TRIP',
    payload: {
      tripId: uuid(),
      title: payload.title,
      description: payload.description,
    },
  };
};

// Action handlers
export function createTripHandler(
  state: StoreType,
  action: CreateTripAction
): StoreType {
  console.log('🚀 [CREATE_TRIP_HANDLER] Handler called with action:', action);

  const { tripId, title, description } = action.payload;
  console.log('🚀 [CREATE_TRIP_HANDLER] Extracted payload:', {
    tripId,
    title,
    description,
  });

  // Create new trip summary
  const newTripSummary: TripSummary = {
    tripId,
    title,
    description: description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalItems: 0,
    packedItems: 0,
    totalPeople: 0,
  };

  // Create empty trip data
  const newTripData: TripData = createEmptyTripData(tripId);

  // Build trip model for persistence
  const userId = state.auth.user?.id || 'local-user';
  console.log(
    '🔧 [CREATE_TRIP] Creating trip for user:',
    userId,
    'Auth user:',
    state.auth.user
  );

  const tripModel: Trip = {
    id: tripId,
    userId,
    title,
    description: description || '',
    days: [],
    tripEvents: [],
    createdAt: newTripSummary.createdAt,
    updatedAt: newTripSummary.updatedAt,
    settings: { defaultTimeZone: 'UTC', packingViewMode: 'by-day' },
    version: 1,
    isDeleted: false,
    defaultItemRules: [],
  };

  // Update the trip data with the correct title and description
  newTripData.trip = {
    ...newTripData.trip,
    title,
    description: description || '',
    userId,
    createdAt: newTripSummary.createdAt,
    updatedAt: newTripSummary.updatedAt,
  };

  console.log('🔧 [CREATE_TRIP] Trip model to save:', {
    id: tripModel.id,
    userId: tripModel.userId,
    title: tripModel.title,
  });

  // Create the initial state with the new trip
  let stateWithNewTrip: StoreType = {
    ...state,
    trips: {
      ...state.trips,
      summaries: [...state.trips.summaries, newTripSummary],
      selectedTripId: tripId, // Auto-select new trip
      byId: {
        ...state.trips.byId,
        [tripId]: newTripData,
      },
    },
    sync:
      state.trips.selectedTripId === 'DEMO_TRIP'
        ? initialState.sync
        : state.sync,
  };

  // Sprint 3: Auto-add user profile to new trips
  const userProfile = selectUserProfile(stateWithNewTrip);
  if (userProfile && userProfile.isUserProfile) {
    console.log(
      `👤 [CREATE_TRIP] Auto-adding user profile to trip: ${userProfile.name}`
    );

    // Use the createPersonFromProfileHandler to add the profile
    stateWithNewTrip = createPersonFromProfileHandler(stateWithNewTrip, {
      type: 'CREATE_PERSON_FROM_PROFILE',
      payload: {
        userPersonId: userProfile.id,
        userPerson: userProfile,
        tripId,
      },
    });

    console.log(
      `✅ [CREATE_TRIP] Successfully auto-added user profile to trip`
    );
  } else {
    console.log(
      `📋 [CREATE_TRIP] No user profile found for auto-add. User will need to add manually or create profile.`
    );
  }

  return stateWithNewTrip;
}

export function selectTripHandler(
  state: StoreType,
  action: { type: 'SELECT_TRIP'; payload: { tripId: string } }
): StoreType {
  return {
    ...state,
    trips: {
      ...state.trips,
      selectedTripId: action.payload.tripId,
    },
  };
}

export function deleteTripHandler(
  state: StoreType,
  action: DeleteTripAction
): StoreType {
  const { tripId } = action.payload;

  // Remove from summaries
  const updatedSummaries = state.trips.summaries.filter(
    (summary) => summary.tripId !== tripId
  );

  // Remove from byId - create a new object without the deleted trip
  const remainingTrips = Object.fromEntries(
    Object.entries(state.trips.byId).filter(([id]) => id !== tripId)
  );

  // Handle selectedTripId if we're deleting the currently selected trip
  let newSelectedTripId = state.trips.selectedTripId;
  if (state.trips.selectedTripId === tripId) {
    // If there are other trips, select the first one, otherwise null
    newSelectedTripId =
      updatedSummaries.length > 0 ? updatedSummaries[0].tripId : null;
  }

  return {
    ...state,
    trips: {
      summaries: updatedSummaries,
      selectedTripId: newSelectedTripId,
      byId: remainingTrips,
    },
  };
}

export function updateTripSummaryHandler(
  state: StoreType,
  action: UpdateTripSummaryAction
): StoreType {
  const { tripId, title, description } = action.payload;

  // Update trip summary
  const updatedSummaries = state.trips.summaries.map((summary) =>
    summary.tripId === tripId
      ? {
          ...summary,
          title,
          description: description || '',
          updatedAt: new Date().toISOString(),
        }
      : summary
  );

  return {
    ...state,
    trips: {
      ...state.trips,
      summaries: updatedSummaries,
    },
  };
}

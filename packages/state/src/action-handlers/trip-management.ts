import type { StoreType, TripData } from '../store.js';
import { createEmptyTripData } from '../store.js';
import type { TripSummary } from '@packing-list/model';

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

// Action handlers
export function createTripHandler(
  state: StoreType,
  action: CreateTripAction
): StoreType {
  const { tripId, title, description } = action.payload;

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
  const newTripData: TripData = {
    ...createEmptyTripData(tripId),
    trip: {
      id: tripId,
      days: [],
    },
  };

  return {
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
  };
}

export function selectTripHandler(
  state: StoreType,
  action: SelectTripAction
): StoreType {
  const { tripId } = action.payload;

  return {
    ...state,
    trips: {
      ...state.trips,
      selectedTripId: tripId,
    },
  };
}

export const deleteTripHandler = (
  state: StoreType,
  action: DeleteTripAction
): StoreType => {
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
};

export const updateTripSummaryHandler = (
  state: StoreType,
  action: UpdateTripSummaryAction
): StoreType => {
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
};

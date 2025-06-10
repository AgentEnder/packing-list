import type { StoreType, TripData } from '../store.js';
import { createEmptyTripData } from '../store.js';
import type { TripSummary, Trip } from '@packing-list/model';
import { TripStorage } from '@packing-list/offline-storage';
import { getChangeTracker } from '@packing-list/sync';

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

  // Build trip model for persistence
  const userId = state.auth.user?.id || 'local-user';
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
  };

  // Persist trip and track change asynchronously
  TripStorage.saveTrip(tripModel).catch(console.error);
  getChangeTracker()
    .trackTripChange('create', tripModel, userId)
    .catch(console.error);

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

  const userId = state.auth.user?.id || 'local-user';
  const existingTrip = state.trips.byId[tripId]?.trip;

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

  // Persist deletion and track change asynchronously
  if (existingTrip) {
    TripStorage.deleteTrip(tripId).catch(console.error);
    getChangeTracker()
      .trackTripChange('delete', {
        ...(existingTrip as Trip),
        isDeleted: true,
        updatedAt: new Date().toISOString(),
      }, userId)
      .catch(console.error);
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

  // Persist update and track change asynchronously
  const userId = state.auth.user?.id || 'local-user';
  const tripData = state.trips.byId[tripId];
  if (tripData) {
    const updatedTrip: Trip = {
      ...(tripData.trip as Trip),
      title,
      description: description || '',
      updatedAt: new Date().toISOString(),
    };
    TripStorage.saveTrip(updatedTrip).catch(console.error);
    getChangeTracker()
      .trackTripChange('update', updatedTrip, userId)
      .catch(console.error);
  }

  return {
    ...state,
    trips: {
      ...state.trips,
      summaries: updatedSummaries,
    },
  };
};

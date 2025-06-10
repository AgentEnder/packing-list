import { StoreType, createEmptyTripData } from '../store.js';
import { TripSummary, Trip } from '@packing-list/model';
import { TripStorage } from '@packing-list/offline-storage';
import { getChangeTracker } from '@packing-list/sync';

export type ClearDemoDataAction = {
  type: 'CLEAR_DEMO_DATA';
};

export const clearDemoDataHandler = (state: StoreType): StoreType => {
  // Create a new fresh trip to replace the demo
  const now = new Date().toISOString();
  const newTripId = `trip-${Date.now()}`;

  // Remove any demo trips
  const filteredSummaries = state.trips.summaries.filter(
    (summary) => summary.tripId !== 'DEMO_TRIP'
  );

  const filteredTripsById = Object.fromEntries(
    Object.entries(state.trips.byId).filter(([id]) => id !== 'DEMO_TRIP')
  );

  // Always create a new trip to replace the demo
  // Create a new trip summary
  const newTripSummary: TripSummary = {
    tripId: newTripId,
    title: 'New Trip',
    description: 'Plan your next adventure',
    createdAt: now,
    updatedAt: now,
    totalItems: 0,
    packedItems: 0,
    totalPeople: 0,
  };

  // Create empty trip data
  const newTripData = createEmptyTripData(newTripId);

  // Build trip model for persistence
  const userId = state.auth.user?.id || 'local-user';
  const tripModel: Trip = {
    id: newTripId,
    userId,
    title: newTripSummary.title,
    description: newTripSummary.description || '',
    days: [],
    tripEvents: [],
    createdAt: now,
    updatedAt: now,
    settings: { defaultTimeZone: 'UTC', packingViewMode: 'by-day' },
    version: 1,
    isDeleted: false,
  };

  // Persist trip and track change asynchronously
  TripStorage.saveTrip(tripModel).catch(console.error);
  getChangeTracker()
    .trackTripChange('create', tripModel, userId)
    .catch(console.error);

  // Add the new trip
  filteredSummaries.push(newTripSummary);
  filteredTripsById[newTripId] = newTripData;

  return {
    ...state,
    trips: {
      summaries: filteredSummaries,
      selectedTripId: newTripId, // Always select the new trip
      byId: filteredTripsById,
    },
  };
};

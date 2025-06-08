import { StoreType, createEmptyTripData } from '../store.js';
import { TripSummary } from '@packing-list/model';

export type ClearDemoDataAction = {
  type: 'CLEAR_DEMO_DATA';
};

export const clearDemoDataHandler = (state: StoreType): StoreType => {
  // Create a new fresh trip to replace the demo
  const newTripId = `trip-${Date.now()}`;
  const now = new Date().toISOString();

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

  // Remove any demo trips and add the new fresh trip
  const filteredSummaries = state.trips.summaries.filter(
    (summary) => summary.tripId !== 'DEMO_TRIP'
  );

  const filteredTripsById = Object.fromEntries(
    Object.entries(state.trips.byId).filter(([id]) => id !== 'DEMO_TRIP')
  );

  return {
    ...state,
    trips: {
      summaries: [...filteredSummaries, newTripSummary],
      selectedTripId: newTripId,
      byId: {
        ...filteredTripsById,
        [newTripId]: newTripData,
      },
    },
  };
};

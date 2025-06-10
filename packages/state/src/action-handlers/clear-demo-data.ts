import { StoreType } from '../store.js';

export type ClearDemoDataAction = {
  type: 'CLEAR_DEMO_DATA';
};

export const clearDemoDataHandler = (state: StoreType): StoreType => {
  // Remove any demo trips
  const filteredSummaries = state.trips.summaries.filter(
    (summary) => summary.tripId !== 'DEMO_TRIP'
  );

  const filteredTripsById = Object.fromEntries(
    Object.entries(state.trips.byId).filter(([id]) => id !== 'DEMO_TRIP')
  );

  return {
    ...state,
    trips: {
      summaries: filteredSummaries,
      selectedTripId: null, // Always select the new trip
      byId: filteredTripsById,
    },
  };
};

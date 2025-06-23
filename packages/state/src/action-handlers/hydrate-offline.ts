import type { StoreType } from '../store.js';

export type HydrateOfflineAction = {
  type: 'HYDRATE_OFFLINE';
  payload: Omit<StoreType, 'auth' | 'rulePacks' | 'ui' | 'sync'>;
};

/**
 * Check if a trip ID indicates demo data
 */
function isDemoTripId(tripId: string): boolean {
  return (
    tripId === 'DEMO_TRIP' ||
    tripId.startsWith('demo-') ||
    tripId.includes('demo')
  );
}

export const hydrateOfflineHandler = (
  state: StoreType,
  action: HydrateOfflineAction
): StoreType => {
  console.log('🔄 [HYDRATE_OFFLINE] Processing hydration with payload:', {
    tripsCount: Object.keys(action.payload.trips.byId).length,
    selectedTripId: action.payload.trips.selectedTripId,
  });

  // Preserve demo trips from current state
  const currentDemoTrips = Object.entries(state.trips.byId).filter(([tripId]) =>
    isDemoTripId(tripId)
  );
  const currentDemoSummaries = state.trips.summaries.filter((summary) =>
    isDemoTripId(summary.tripId)
  );

  if (currentDemoTrips.length > 0) {
    console.log(
      `🎭 [HYDRATE_OFFLINE] Preserving ${currentDemoTrips.length} demo trips from being cleared by IndexedDB reload:`,
      currentDemoTrips.map(([id, data]) => ({ id, title: data.trip.title }))
    );
  }

  // Start with the hydrated state
  const hydratedState = {
    ...state,
    ...action.payload,
  };

  // If we had demo trips in the current state, preserve them
  if (currentDemoTrips.length > 0) {
    // Merge demo trips back into the hydrated state
    const demoTripsById = Object.fromEntries(currentDemoTrips);

    hydratedState.trips = {
      ...hydratedState.trips,
      summaries: [...hydratedState.trips.summaries, ...currentDemoSummaries],
      byId: {
        ...hydratedState.trips.byId,
        ...demoTripsById,
      },
    };

    // If the current state had a demo trip selected and no trip is selected after hydration,
    // restore the demo trip selection
    if (
      isDemoTripId(state.trips.selectedTripId || '') &&
      !hydratedState.trips.selectedTripId
    ) {
      hydratedState.trips.selectedTripId = state.trips.selectedTripId;
      console.log(
        `🎭 [HYDRATE_OFFLINE] Restored demo trip selection: ${state.trips.selectedTripId}`
      );
    }
  }

  console.log(
    `✅ [HYDRATE_OFFLINE] Hydration complete with ${
      Object.keys(hydratedState.trips.byId).length
    } total trips (${currentDemoTrips.length} demo trips preserved)`
  );

  return hydratedState;
};

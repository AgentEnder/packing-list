import { StoreType, createEmptyTripData } from '../store.js';

export type ClearTripDataAction = {
  type: 'CLEAR_TRIP_DATA';
};

export const clearTripDataHandler = (state: StoreType): StoreType => {
  const selectedTripId = state.trips.selectedTripId;

  // Early return if no trip is selected
  if (!selectedTripId || !state.trips.byId[selectedTripId]) {
    console.warn('Cannot clear trip data: no trip selected');
    return state;
  }

  // Clear the selected trip data while preserving trip ID and basic structure
  const clearedTripData = createEmptyTripData(selectedTripId);

  return {
    ...state,
    trips: {
      ...state.trips,
      byId: {
        ...state.trips.byId,
        [selectedTripId]: clearedTripData,
      },
    },
  };
};

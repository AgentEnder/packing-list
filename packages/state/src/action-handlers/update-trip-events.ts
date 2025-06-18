import { TripEvent } from '@packing-list/model';
import { StoreType } from '../store.js';
import { enumerateTripDays } from './calculate-days.js';
import { calculatePackingListHandler } from './calculate-packing-list.js';

export type UpdateTripEventsAction = {
  type: 'UPDATE_TRIP_EVENTS';
  payload: TripEvent[];
};

export const updateTripEventsHandler = (
  state: StoreType,
  action: UpdateTripEventsAction
): StoreType => {
  const selectedTripId = state.trips.selectedTripId;

  // Early return if no trip is selected
  if (!selectedTripId || !state.trips.byId[selectedTripId]) {
    return state;
  }

  const selectedTripData = state.trips.byId[selectedTripId];

  // Calculate days from the new trip events
  const calculatedDays = enumerateTripDays(action.payload);

  // Update the trip events and days
  const updatedTrip = {
    ...selectedTripData.trip,
    tripEvents: action.payload,
    days: calculatedDays,
  };

  const updatedTripData = {
    ...selectedTripData,
    trip: updatedTrip,
  };

  const updatedState = {
    ...state,
    trips: {
      ...state.trips,
      byId: {
        ...state.trips.byId,
        [selectedTripId]: updatedTripData,
      },
    },
  };

  // Recalculate packing list with the new days
  return calculatePackingListHandler(updatedState);
};

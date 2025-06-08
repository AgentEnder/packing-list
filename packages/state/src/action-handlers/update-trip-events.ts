import { TripEvent } from '@packing-list/model';
import { StoreType } from '../store.js';
import { enumerateTripDays } from './calculate-days.js';
import { calculateDefaultItems } from './calculate-default-items.js';
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
    console.warn('Cannot update trip events: no trip selected');
    return state;
  }

  const tripEvents = action.payload;
  const days = enumerateTripDays(tripEvents);
  const selectedTripData = state.trips.byId[selectedTripId];

  // First update trip events and days in the selected trip
  const updatedTripData = {
    ...selectedTripData,
    trip: {
      ...selectedTripData.trip,
      tripEvents,
      days,
    },
  };

  const stateWithUpdatedTrip = {
    ...state,
    trips: {
      ...state.trips,
      byId: {
        ...state.trips.byId,
        [selectedTripId]: updatedTripData,
      },
    },
  };

  // Then recalculate default items
  const stateWithDefaultItems = calculateDefaultItems(stateWithUpdatedTrip);

  // Finally recalculate packing list
  return calculatePackingListHandler(stateWithDefaultItems);
};

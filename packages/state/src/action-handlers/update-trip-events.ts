import { TripEvent, Trip } from '@packing-list/model';
import { StoreType, TripData } from '../store.js';
import { enumerateTripDays } from './calculate-days.js';
import { calculateDefaultItems } from './calculate-default-items.js';
import { calculatePackingListHandler } from './calculate-packing-list.js';
import { TripStorage } from '@packing-list/offline-storage';
import { getChangeTracker } from '@packing-list/sync';

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
  const updatedTripData: TripData = {
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

  // Persist the updated trip to storage and track change asynchronously
  const userId = state.auth.user?.id || 'local-user';
  const updatedTrip: Trip = {
    ...(updatedTripData.trip as Trip),
    updatedAt: new Date().toISOString(),
  };
  TripStorage.saveTrip(updatedTrip).catch(console.error);
  getChangeTracker()
    .trackTripChange('update', updatedTrip, userId)
    .catch(console.error);

  // Then recalculate default items
  const stateWithDefaultItems = calculateDefaultItems(stateWithUpdatedTrip);

  // Finally recalculate packing list
  return calculatePackingListHandler(stateWithDefaultItems);
};

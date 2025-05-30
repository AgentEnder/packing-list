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
  const tripEvents = action.payload;
  const days = enumerateTripDays(tripEvents);

  // First update trip events and days
  const stateWithUpdatedTrip = {
    ...state,
    trip: {
      ...state.trip,
      tripEvents,
      days,
    },
  };

  // Then recalculate default items
  const stateWithDefaultItems = calculateDefaultItems(stateWithUpdatedTrip, {
    type: 'CALCULATE_DEFAULT_ITEMS',
  });

  // Finally recalculate packing list
  return calculatePackingListHandler(stateWithDefaultItems, {
    type: 'CALCULATE_PACKING_LIST',
  });
};

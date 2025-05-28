import { TripEvent } from '@packing-list/model';
import { StoreType } from '../store.js';

export type UpdateTripEventsAction = {
  type: 'UPDATE_TRIP_EVENTS';
  payload: TripEvent[];
};

export function updateTripEventsHandler(
  state: StoreType,
  action: UpdateTripEventsAction
): StoreType {
  return {
    ...state,
    trip: {
      ...state.trip,
      tripEvents: action.payload,
    },
  };
}

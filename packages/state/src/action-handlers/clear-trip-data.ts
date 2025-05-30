import { StoreType } from '../store.js';
import { initialState } from '../store.js';

export type ClearTripDataAction = {
  type: 'CLEAR_TRIP_DATA';
};

export const clearTripDataHandler = (): StoreType => {
  return {
    ...initialState,
  };
};

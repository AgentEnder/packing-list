import { StoreType } from '../store.js';

export const selectTrip = (state: StoreType) => state.trip;
export const selectDefaultItemRules = (state: StoreType) =>
  state.defaultItemRules;

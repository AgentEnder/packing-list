import { createSelector } from '@reduxjs/toolkit';
import type { StoreType } from './store.js';

export const selectPeople = createSelector(
  (state: StoreType) => state.people,
  (people) => people
);

export const selectTripDays = createSelector(
  (state: StoreType) => state.trip.days,
  (days) => days
);

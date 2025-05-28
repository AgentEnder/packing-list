import { createSelector } from '@reduxjs/toolkit';
import { StoreType } from './store';

export const selectPeople = createSelector(
  (state: StoreType) => state.people,
  (people) => people
);

export const selectTripDays = createSelector(
  (state: StoreType) => state.trip.days,
  (days) => days
);

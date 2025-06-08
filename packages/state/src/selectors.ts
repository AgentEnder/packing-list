import { createSelector } from '@reduxjs/toolkit';
import type { Selector } from '@reduxjs/toolkit';
import type { StoreType } from './store.js';
import type { Day, LegacyPerson as Person } from '@packing-list/model';

export const selectPeople: Selector<StoreType, Person[]> = createSelector(
  (state: StoreType) => state.people,
  (people) => people
);

export const selectTripDays: Selector<StoreType, Day[]> = createSelector(
  (state: StoreType) => state.trip.days,
  (days) => days
);

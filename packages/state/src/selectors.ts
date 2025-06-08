import { createSelector } from '@reduxjs/toolkit';
import type { Selector } from '@reduxjs/toolkit';
import type { StoreType, TripData } from './store.js';
import type {
  Day,
  LegacyPerson as Person,
  TripSummary,
} from '@packing-list/model';

// Multi-trip selectors
export const selectTripSummaries: Selector<StoreType, TripSummary[]> = (
  state
) => state.trips.summaries;

export const selectSelectedTripId: Selector<StoreType, string | null> = (
  state
) => state.trips.selectedTripId;

export const selectTripById =
  (tripId: string): Selector<StoreType, TripData | undefined> =>
  (state) =>
    state.trips.byId[tripId];

export const selectSelectedTripData: Selector<StoreType, TripData | undefined> =
  createSelector(
    [selectSelectedTripId, (state: StoreType) => state.trips.byId],
    (selectedTripId, tripsById) =>
      selectedTripId ? tripsById[selectedTripId] : undefined
  );

// Backward compatibility selectors - these provide the old interface
export const selectPeople: Selector<StoreType, Person[]> = createSelector(
  [selectSelectedTripData],
  (selectedTrip) => selectedTrip?.people || []
);

export const selectTripDays: Selector<StoreType, Day[]> = createSelector(
  [selectSelectedTripData],
  (selectedTrip) => selectedTrip?.trip.days || []
);

export const selectCurrentTrip = createSelector(
  [selectSelectedTripData],
  (selectedTrip) => selectedTrip?.trip || { id: 'no-trip', days: [] }
);

export const selectRuleOverrides = createSelector(
  [selectSelectedTripData],
  (selectedTrip) => selectedTrip?.ruleOverrides || []
);

export const selectPackingListView = createSelector(
  [selectSelectedTripData],
  (selectedTrip) =>
    selectedTrip?.packingListView || {
      viewMode: 'by-day' as const,
      filters: { packed: true, unpacked: true, excluded: false },
    }
);

export const selectCalculatedItems = createSelector(
  [selectSelectedTripData],
  (selectedTrip) =>
    selectedTrip?.calculated || {
      defaultItems: [],
      packingListItems: [],
    }
);

// UI selectors
export const selectTripSelectorOpen: Selector<StoreType, boolean> = (state) =>
  state.ui.tripSelector.isOpen;

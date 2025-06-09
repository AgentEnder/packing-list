import { createSelector } from '@reduxjs/toolkit';
import type { Selector } from '@reduxjs/toolkit';
import type { StoreType, TripData } from './store.js';
import type {
  Day,
  LegacyPerson as Person,
  TripSummary,
  RulePack,
} from '@packing-list/model';

// Multi-trip selectors
export const selectTripSummaries: Selector<StoreType, TripSummary[]> = (
  state
) => state.trips.summaries;

// Calculate accurate trip summaries from current data
export const selectAccurateTripSummaries: Selector<StoreType, TripSummary[]> =
  createSelector(
    [selectTripSummaries, (state: StoreType) => state.trips.byId],
    (summaries, tripsById) => {
      return summaries.map((summary) => {
        const tripData = tripsById[summary.tripId];
        if (!tripData) {
          return summary;
        }

        // Calculate people count
        const totalPeople = tripData.people.length;

        // Calculate item counts from packing list
        const packingListItems = tripData.calculated.packingListItems;
        const totalItems = packingListItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        const packedItems = packingListItems
          .filter((item) => item.isPacked)
          .reduce((sum, item) => sum + item.quantity, 0);

        return {
          ...summary,
          totalPeople,
          totalItems,
          packedItems,
        };
      });
    }
  );

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

export const selectRulePacks: Selector<StoreType, RulePack[]> = (state) =>
  state.rulePacks;

// Trip-specific rule selectors
export const selectDefaultItemRules = createSelector(
  [selectSelectedTripData],
  (selectedTrip) => selectedTrip?.defaultItemRules || []
);

// UI selectors
export const selectRulePackModalOpen: Selector<StoreType, boolean> = (state) =>
  state.ui.rulePackModal.isOpen;

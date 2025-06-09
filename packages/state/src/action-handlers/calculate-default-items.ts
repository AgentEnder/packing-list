import { StoreType } from '../store.js';
import { calculateRuleTotal } from '@packing-list/shared-utils';
import type { Person } from '@packing-list/model';

export type CalculateDefaultItemsAction = {
  type: 'CALCULATE_DEFAULT_ITEMS';
};

export const calculateDefaultItems = (state: StoreType): StoreType => {
  const selectedTripId = state.trips.selectedTripId;

  // Early return if no trip is selected
  if (!selectedTripId || !state.trips.byId[selectedTripId]) {
    return state;
  }

  const selectedTripData = state.trips.byId[selectedTripId];

  const defaultItems = selectedTripData.defaultItemRules.map((rule) => ({
    name: rule.name,
    quantity: calculateRuleTotal(
      rule,
      selectedTripData.people as Person[],
      selectedTripData.trip.days
    ),
    ruleId: rule.id,
  }));

  const updatedTripData = {
    ...selectedTripData,
    calculated: {
      ...selectedTripData.calculated,
      defaultItems,
    },
  };

  return {
    ...state,
    trips: {
      ...state.trips,
      byId: {
        ...state.trips.byId,
        [selectedTripId]: updatedTripData,
      },
    },
  };
};

import { RuleOverride } from '@packing-list/model';
import { StoreType } from '../store.js';

export type AddRuleOverrideAction = {
  type: 'ADD_RULE_OVERRIDE';
  payload: RuleOverride;
};

export const addRuleOverrideHandler = (
  state: StoreType,
  action: AddRuleOverrideAction
): StoreType => {
  const selectedTripId = state.trips.selectedTripId;

  // Early return if no trip is selected
  if (!selectedTripId || !state.trips.byId[selectedTripId]) {
    console.warn('Cannot add rule override: no trip selected');
    return state;
  }

  const selectedTripData = state.trips.byId[selectedTripId];

  // Add the rule override to the selected trip
  const updatedTripData = {
    ...selectedTripData,
    ruleOverrides: [...selectedTripData.ruleOverrides, action.payload],
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

import { DefaultItemRule } from '@packing-list/model';
import { StoreType } from '../store.js';
import { calculateDefaultItems } from './calculate-default-items.js';
import { calculatePackingListHandler } from './calculate-packing-list.js';

export type UpdateItemRuleAction = {
  type: 'UPDATE_ITEM_RULE';
  payload: DefaultItemRule;
};

export const updateItemRuleHandler = (
  state: StoreType,
  action: UpdateItemRuleAction
): StoreType => {
  const selectedTripId = state.trips.selectedTripId;

  // Early return if no trip is selected
  if (!selectedTripId || !state.trips.byId[selectedTripId]) {
    return state;
  }

  const selectedTripData = state.trips.byId[selectedTripId];

  // First update the rule in the current trip
  const updatedTripData = {
    ...selectedTripData,
    defaultItemRules: selectedTripData.defaultItemRules.map((rule) =>
      rule.id === action.payload.id ? action.payload : rule
    ),
  };

  const stateWithUpdatedRule = {
    ...state,
    trips: {
      ...state.trips,
      byId: {
        ...state.trips.byId,
        [selectedTripId]: updatedTripData,
      },
    },
  };

  // Then recalculate default items
  const stateWithDefaultItems = calculateDefaultItems(stateWithUpdatedRule);

  // Finally recalculate packing list
  return calculatePackingListHandler(stateWithDefaultItems);
};

import { StoreType } from '../store.js';
import { calculateDefaultItems } from './calculate-default-items.js';
import { calculatePackingListHandler } from './calculate-packing-list.js';

export type DeleteItemRuleAction = {
  type: 'DELETE_ITEM_RULE';
  payload: {
    id: string;
  };
};

export const deleteItemRuleHandler = (
  state: StoreType,
  action: DeleteItemRuleAction
): StoreType => {
  const selectedTripId = state.trips.selectedTripId;

  // Early return if no trip is selected
  if (!selectedTripId || !state.trips.byId[selectedTripId]) {
    return state;
  }

  const selectedTripData = state.trips.byId[selectedTripId];

  // First delete the rule from the current trip
  const updatedTripData = {
    ...selectedTripData,
    defaultItemRules: selectedTripData.defaultItemRules.filter(
      (rule) => rule.id !== action.payload.id
    ),
  };

  const stateWithDeletedRule = {
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
  const stateWithDefaultItems = calculateDefaultItems(stateWithDeletedRule);

  // Finally recalculate packing list
  return calculatePackingListHandler(stateWithDefaultItems);
};

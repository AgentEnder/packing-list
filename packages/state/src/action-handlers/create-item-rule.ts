import { DefaultItemRule } from '@packing-list/model';
import { StoreType } from '../store.js';
import { calculateDefaultItems } from './calculate-default-items.js';
import { calculatePackingListHandler } from './calculate-packing-list.js';

export type CreateItemRuleAction = {
  type: 'CREATE_ITEM_RULE';
  payload: DefaultItemRule;
};

export const createItemRuleHandler = (
  state: StoreType,
  action: CreateItemRuleAction
): StoreType => {
  const selectedTripId = state.trips.selectedTripId;

  // Early return if no trip is selected
  if (!selectedTripId || !state.trips.byId[selectedTripId]) {
    return state;
  }

  const selectedTripData = state.trips.byId[selectedTripId];

  // Add the rule to the current trip
  const updatedTripData = {
    ...selectedTripData,
    trip: {
      ...selectedTripData.trip,
      defaultItemRules: [
        ...(selectedTripData.trip.defaultItemRules ?? []),
        action.payload,
      ],
    },
  };

  const stateWithNewRule = {
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
  const stateWithDefaultItems = calculateDefaultItems(stateWithNewRule);

  // Finally recalculate packing list
  return calculatePackingListHandler(stateWithDefaultItems);
};

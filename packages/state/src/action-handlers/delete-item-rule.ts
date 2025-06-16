import type { StoreType } from '../store.js';
import { calculateDefaultItems } from './calculate-default-items.js';
import { calculatePackingListHandler } from './calculate-packing-list.js';
import {
  DefaultItemRulesStorage,
  TripRuleStorage,
} from '@packing-list/offline-storage';

export type DeleteItemRuleAction = {
  type: 'DELETE_ITEM_RULE';
  payload: { id: string };
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

  // Remove the rule from the current trip
  const updatedRules =
    selectedTripData.trip.defaultItemRules?.filter(
      (rule) => rule.id !== action.payload.id
    ) ?? [];

  const updatedTripData = {
    ...selectedTripData,
    trip: {
      ...selectedTripData.trip,
      defaultItemRules: updatedRules,
    },
  };

  const stateWithoutRule = {
    ...state,
    trips: {
      ...state.trips,
      byId: {
        ...state.trips.byId,
        [selectedTripId]: updatedTripData,
      },
    },
  };

  // Soft delete the rule from global storage
  // Note: We keep it in global storage as other trips might still use it
  DefaultItemRulesStorage.deleteDefaultItemRule(action.payload.id).catch(
    console.error
  );

  // Remove the trip rule association
  TripRuleStorage.deleteTripRule(selectedTripId, action.payload.id).catch(
    console.error
  );

  // Then recalculate default items
  const stateWithDefaultItems = calculateDefaultItems(stateWithoutRule);

  // Finally recalculate packing list
  return calculatePackingListHandler(stateWithDefaultItems);
};

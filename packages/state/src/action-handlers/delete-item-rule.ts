import { StoreType } from '../store.js';
import { calculateDefaultItems } from './calculate-default-items.js';
import { calculatePackingListHandler } from './calculate-packing-list.js';
import { DefaultItemRulesStorage, TripRulesStorage } from '@packing-list/offline-storage';
import { getChangeTracker } from '@packing-list/sync';

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

  const userId = state.auth.user?.id || 'local-user';
  DefaultItemRulesStorage.deleteDefaultItemRule(action.payload.id).catch(console.error);
  TripRulesStorage.deleteTripRule(action.payload.id).catch(console.error);
  const deletedRule = selectedTripData.defaultItemRules.find(
    (r) => r.id === action.payload.id
  );
  if (deletedRule) {
    getChangeTracker()
      .trackDefaultItemRuleChange('delete', deletedRule, userId)
      .catch(console.error);
    getChangeTracker()
      .trackTripRuleChange('delete',
        {
          id: deletedRule.id,
          tripId: selectedTripId,
          ruleId: deletedRule.id,
          createdAt: deletedRule.createdAt ?? new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: deletedRule.version ?? 1,
          isDeleted: true,
        },
        userId,
        selectedTripId)
      .catch(console.error);
  }

  // Then recalculate default items
  const stateWithDefaultItems = calculateDefaultItems(stateWithDeletedRule);

  // Finally recalculate packing list
  return calculatePackingListHandler(stateWithDefaultItems);
};

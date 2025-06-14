import { DefaultItemRule } from '@packing-list/model';
import { StoreType } from '../store.js';
import { calculateDefaultItems } from './calculate-default-items.js';
import { calculatePackingListHandler } from './calculate-packing-list.js';
import { DefaultItemRulesStorage, TripRulesStorage } from '@packing-list/offline-storage';
import { getChangeTracker } from '@packing-list/sync';

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

  // First create the rule in the current trip
  const updatedTripData = {
    ...selectedTripData,
    defaultItemRules: [...selectedTripData.defaultItemRules, action.payload],
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

  const userId = state.auth.user?.id || 'local-user';
  DefaultItemRulesStorage.saveDefaultItemRule(action.payload).catch(console.error);
  TripRulesStorage.saveTripRule({
    id: action.payload.id,
    tripId: selectedTripId,
    ruleId: action.payload.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    isDeleted: false,
  }).catch(console.error);
  getChangeTracker()
    .trackDefaultItemRuleChange('create', action.payload, userId)
    .catch(console.error);
  getChangeTracker()
    .trackTripRuleChange('create', {
      id: action.payload.id,
      tripId: selectedTripId,
      ruleId: action.payload.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      isDeleted: false,
    }, userId, selectedTripId)
    .catch(console.error);

  // Then recalculate default items
  const stateWithDefaultItems = calculateDefaultItems(stateWithNewRule);

  // Finally recalculate packing list
  return calculatePackingListHandler(stateWithDefaultItems);
};

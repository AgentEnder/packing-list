import { DefaultItemRule } from '@packing-list/model';
import { StoreType } from '../store.js';
import { calculateDefaultItems } from './calculate-default-items.js';
import { calculatePackingListHandler } from './calculate-packing-list.js';
import {
  DefaultItemRulesStorage,
  TripRuleStorage,
} from '@packing-list/offline-storage';
import type { TripRule } from '@packing-list/model';

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

  // Save the rule definition to global storage for reuse across trips
  DefaultItemRulesStorage.saveDefaultItemRule(action.payload).catch(
    console.error
  );

  // Save the trip rule association
  const now = new Date().toISOString();
  const tripRule: TripRule = {
    id: `${selectedTripId}-${action.payload.id}`,
    tripId: selectedTripId,
    ruleId: action.payload.id,
    createdAt: now,
    updatedAt: now,
    version: 1,
    isDeleted: false,
  };

  TripRuleStorage.saveTripRule(tripRule).catch(console.error);

  // Then recalculate default items
  const stateWithDefaultItems = calculateDefaultItems(stateWithNewRule);

  // Finally recalculate packing list
  return calculatePackingListHandler(stateWithDefaultItems);
};

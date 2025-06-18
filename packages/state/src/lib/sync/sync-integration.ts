import type { StoreType, TripData } from '../../store.js';
import type {
  Trip,
  Person,
  TripItem,
  DefaultItemRule,
  RulePack,
  TripRule,
} from '@packing-list/model';
import type { EntityExistence } from '@packing-list/sync-state';
import type { AllActions } from '../../actions.js';
import { DefaultItemRulesStorage } from '@packing-list/offline-storage';
import { createEmptyTripData } from '../../store.js';
import { calculateDefaultItems } from '../../action-handlers/calculate-default-items.js';
import { calculatePackingListHandler } from '../../action-handlers/calculate-packing-list.js';

interface PackingListItem {
  id: string;
  name: string;
  itemName: string;
  ruleId: string;
  ruleHash: string;
  isPacked: boolean;
  isOverridden: boolean;
  dayIndex?: number;
  personId?: string;
  personName?: string;
  notes?: string;
  dayStart?: number;
  dayEnd?: number;
  isExtra: boolean;
  quantity: number;
  categoryId?: string;
  subcategoryId?: string;
}

// Helper function to map TripItem to PackingListItem format
function mapItem(item: TripItem): PackingListItem {
  return {
    id: item.id,
    name: item.name,
    itemName: item.name,
    ruleId: 'imported',
    ruleHash: '',
    isPacked: item.packed,
    isOverridden: false,
    dayIndex: item.dayIndex,
    personId: item.personId,
    personName: undefined,
    notes: item.notes,
    dayStart: undefined,
    dayEnd: undefined,
    isExtra: false,
    quantity: item.quantity,
    categoryId: item.category,
    subcategoryId: undefined,
  };
}

// Queue for trip rules that couldn't be applied because trips weren't loaded
let pendingTripRules: Array<{ rule: DefaultItemRule; tripId: string }> = [];

/**
 * Process any pending trip rules that were queued while trips were loading
 */
export const processPendingTripRules = (
  dispatch: (action: AllActions) => void
) => {
  if (pendingTripRules.length === 0) {
    return;
  }

  console.log(
    `📋 [SYNC INTEGRATION] Processing ${pendingTripRules.length} pending trip rules`
  );

  const rulesToProcess = [...pendingTripRules];
  pendingTripRules = []; // Clear the queue

  // Process each queued rule
  for (const { rule, tripId } of rulesToProcess) {
    console.log(
      `📋 [SYNC INTEGRATION] Processing queued rule: ${rule.name} (${rule.id}) for trip ${tripId}`
    );
    applySyncedRuleToTrip(dispatch, { rule, tripId });
  }
};

/**
 * Create entity existence checker based on current Redux state
 */
export function createEntityExistence(state: StoreType): EntityExistence {
  return {
    tripExists: (tripId: string) => {
      return (
        state.trips.summaries.some((s) => s.tripId === tripId) ||
        state.trips.byId[tripId] !== undefined
      );
    },
    personExists: (personId: string, tripId: string) => {
      const tripData = state.trips.byId[tripId];
      return tripData?.people.some((p) => p.id === personId) ?? false;
    },
    itemExists: (itemId: string, tripId: string) => {
      const tripData = state.trips.byId[tripId];
      return (
        tripData?.calculated.packingListItems.some(
          (item) => item.id === itemId
        ) ?? false
      );
    },
  };
}

/**
 * Create entity callbacks for sync integration
 */
export const createEntityCallbacks = (
  dispatch: (action: AllActions) => void
) => {
  return {
    onTripUpsert: (trip: Trip) => {
      dispatch({ type: 'UPSERT_SYNCED_TRIP', payload: trip });
    },
    onPersonUpsert: (person: Person) => {
      dispatch({ type: 'UPSERT_SYNCED_PERSON', payload: person });
    },
    onItemUpsert: (item: TripItem) => {
      dispatch({ type: 'UPSERT_SYNCED_ITEM', payload: item });
    },
    onRulePackUpsert: (pack: RulePack) => {
      dispatch({ type: 'UPSERT_SYNCED_RULE_PACK', payload: pack });
    },
    onTripRuleUpsert: (tripRule: TripRule) => {
      console.log(
        `🔗 [SYNC INTEGRATION] Associating rule ${tripRule.ruleId} with trip ${tripRule.tripId}`
      );

      // Fetch the rule and then apply it
      DefaultItemRulesStorage.getDefaultItemRule(tripRule.ruleId)
        .then((rule) => {
          if (rule) {
            applySyncedRuleToTrip(dispatch, {
              rule,
              tripId: tripRule.tripId,
            });
          } else {
            console.warn(
              `[SYNC INTEGRATION] Rule ${tripRule.ruleId} not found for trip association`
            );
          }
        })
        .catch(console.error);
    },
  };
};

/**
 * Redux actions for sync integration
 */
export type SyncIntegrationActions =
  | { type: 'UPSERT_SYNCED_TRIP'; payload: Trip }
  | { type: 'UPSERT_SYNCED_PERSON'; payload: Person }
  | { type: 'UPSERT_SYNCED_ITEM'; payload: TripItem }
  | {
      type: 'UPSERT_SYNCED_DEFAULT_ITEM_RULE';
      payload: { rule: DefaultItemRule; tripId: string };
    }
  | { type: 'UPSERT_SYNCED_RULE_PACK'; payload: RulePack };

/**
 * Redux reducers for sync integration
 */
export const upsertSyncedTrip = (
  state: StoreType,
  action: { type: 'UPSERT_SYNCED_TRIP'; payload: Trip }
): StoreType => {
  const syncedTrip = action.payload;
  console.log(
    `🔄 [SYNC REDUCER] Upserting trip: ${syncedTrip.title} (${syncedTrip.id})`
  );

  // Update trip summary if it exists
  const summaryIndex = state.trips.summaries.findIndex(
    (s) => s.tripId === syncedTrip.id
  );

  const updatedSummaries = [...state.trips.summaries];
  if (summaryIndex >= 0) {
    updatedSummaries[summaryIndex] = {
      ...updatedSummaries[summaryIndex],
      title: syncedTrip.title,
      description: syncedTrip.description,
      updatedAt: syncedTrip.updatedAt,
    };
    console.log(
      `📝 [SYNC REDUCER] Updated existing trip summary: ${syncedTrip.id}`
    );
  } else {
    // Add new trip summary
    updatedSummaries.push({
      tripId: syncedTrip.id,
      title: syncedTrip.title,
      description: syncedTrip.description,
      createdAt: syncedTrip.createdAt,
      updatedAt: syncedTrip.updatedAt,
      totalItems: 0, // Will be recalculated
      packedItems: 0, // Will be recalculated
      totalPeople: 0, // Will be recalculated
    });
    console.log(`➕ [SYNC REDUCER] Added new trip summary: ${syncedTrip.id}`);
  }

  // Update or add trip data
  const existingTripData = state.trips.byId[syncedTrip.id];
  let updatedTripData: TripData;

  if (existingTripData) {
    // Merge with existing data, preserving UI state
    updatedTripData = {
      ...existingTripData,
      trip: {
        ...existingTripData.trip,
        ...syncedTrip,
        // Preserve any local UI state
        id: syncedTrip.id,
      },
      lastSynced: syncedTrip.lastSyncedAt,
    };
    console.log(
      `🔄 [SYNC REDUCER] Merged existing trip data: ${syncedTrip.id}`
    );
  } else {
    // Create new trip data
    updatedTripData = {
      ...createEmptyTripData(syncedTrip.id),
      trip: syncedTrip,
      lastSynced: syncedTrip.lastSyncedAt,
    };
    console.log(`🆕 [SYNC REDUCER] Created new trip data: ${syncedTrip.id}`);
  }

  return {
    ...state,
    trips: {
      ...state.trips,
      summaries: updatedSummaries,
      byId: {
        ...state.trips.byId,
        [syncedTrip.id]: updatedTripData,
      },
    },
  };
};

export const upsertSyncedPerson = (
  state: StoreType,
  action: { type: 'UPSERT_SYNCED_PERSON'; payload: Person }
): StoreType => {
  const syncedPerson = action.payload;
  console.log(
    `👤 [SYNC REDUCER] Upserting person: ${syncedPerson.name} (${syncedPerson.id})`
  );

  const tripData = state.trips.byId[syncedPerson.tripId];
  if (!tripData) {
    console.warn(
      `⚠️ [SYNC REDUCER] Trip not found for person: ${syncedPerson.tripId}`
    );
    return state;
  }

  // Update or add person in the trip data
  const existingPersonIndex = tripData.people.findIndex(
    (p) => p.id === syncedPerson.id
  );
  const updatedPeople = [...tripData.people];

  if (existingPersonIndex >= 0) {
    updatedPeople[existingPersonIndex] = syncedPerson;
    console.log(
      `🔄 [SYNC REDUCER] Updated existing person: ${syncedPerson.id}`
    );
  } else {
    updatedPeople.push(syncedPerson);
    console.log(`➕ [SYNC REDUCER] Added new person: ${syncedPerson.id}`);
  }

  return {
    ...state,
    trips: {
      ...state.trips,
      byId: {
        ...state.trips.byId,
        [syncedPerson.tripId]: {
          ...tripData,
          people: updatedPeople,
        },
      },
    },
  };
};

export const upsertSyncedItem = (
  state: StoreType,
  action: { type: 'UPSERT_SYNCED_ITEM'; payload: TripItem }
): StoreType => {
  const syncedItem = action.payload;
  console.log(
    `📦 [SYNC REDUCER] Upserting item: ${syncedItem.name} (${syncedItem.id})`
  );

  const tripData = state.trips.byId[syncedItem.tripId];
  if (!tripData) {
    console.warn(
      `⚠️ [SYNC REDUCER] Trip not found for item: ${syncedItem.tripId}`
    );
    return state;
  }

  // Convert TripItem to PackingListItem format
  const packingListItem = mapItem(syncedItem);

  // Update or add item in the packing list
  const existingItemIndex = tripData.calculated.packingListItems.findIndex(
    (item) => item.id === syncedItem.id
  );
  const updatedItems = [...tripData.calculated.packingListItems];

  if (existingItemIndex >= 0) {
    // Preserve any local UI state when merging
    updatedItems[existingItemIndex] = {
      ...updatedItems[existingItemIndex],
      ...packingListItem,
    };
    console.log(`🔄 [SYNC REDUCER] Updated existing item: ${syncedItem.id}`);
  } else {
    updatedItems.push(packingListItem);
    console.log(`➕ [SYNC REDUCER] Added new item: ${syncedItem.id}`);
  }

  return {
    ...state,
    trips: {
      ...state.trips,
      byId: {
        ...state.trips.byId,
        [syncedItem.tripId]: {
          ...tripData,
          calculated: {
            ...tripData.calculated,
            packingListItems: updatedItems,
          },
        },
      },
    },
  };
};

/**
 * Upsert a default item rule that came from sync (reducer function)
 * This is called when rules are synced from the server
 */
export const upsertSyncedDefaultItemRule = (
  state: StoreType,
  action: {
    type: 'UPSERT_SYNCED_DEFAULT_ITEM_RULE';
    payload: { rule: DefaultItemRule; tripId: string };
  }
): StoreType => {
  const { rule, tripId } = action.payload;

  console.log(
    `📋 [SYNC REDUCER] Upserting default item rule: ${rule.name} (${rule.id}) for trip ${tripId}`
  );

  const tripData = state.trips.byId[tripId];
  if (!tripData) {
    console.warn(`⚠️ [SYNC REDUCER] Trip not found for rule: ${tripId}`);
    return state;
  }

  // Update or add rule in the specific trip
  const existingRuleIndex = tripData.trip.defaultItemRules.findIndex(
    (r) => r.id === rule.id
  );
  const updatedRules = [...tripData.trip.defaultItemRules];

  if (existingRuleIndex >= 0) {
    updatedRules[existingRuleIndex] = rule;
    console.log(
      `🔄 [SYNC REDUCER] Updated existing rule in trip ${tripId}: ${rule.id}`
    );
  } else {
    updatedRules.push(rule);
    console.log(
      `➕ [SYNC REDUCER] Added new rule to trip ${tripId}: ${rule.id}`
    );
  }

  // Update the trip with the new rules
  const updatedTripData = {
    ...tripData,
    trip: { ...tripData.trip, defaultItemRules: updatedRules },
  };

  let updatedState = {
    ...state,
    trips: {
      ...state.trips,
      byId: {
        ...state.trips.byId,
        [tripId]: updatedTripData,
      },
    },
  };

  // Recalculate default items and packing list for this specific trip
  console.log(
    `🔄 [SYNC REDUCER] Recalculating items for trip ${tripId} after rule update: ${rule.id}`
  );

  // Temporarily set the selected trip to trigger calculations
  const tempState = {
    ...updatedState,
    trips: {
      ...updatedState.trips,
      selectedTripId: tripId,
    },
  };

  // Calculate default items first
  const stateWithDefaultItems = calculateDefaultItems(tempState);

  // Then calculate packing list
  const stateWithPackingList = calculatePackingListHandler(
    stateWithDefaultItems
  );

  // Update the trip data in our final state and restore original selected trip
  updatedState = {
    ...updatedState,
    trips: {
      ...updatedState.trips,
      selectedTripId: state.trips.selectedTripId,
      byId: {
        ...updatedState.trips.byId,
        [tripId]: stateWithPackingList.trips.byId[tripId],
      },
    },
  };

  return updatedState;
};

/**
 * Helper function to apply a synced rule to a trip (used by callbacks)
 */
const applySyncedRuleToTrip = (
  dispatch: (action: AllActions) => void,
  payload: { rule: DefaultItemRule; tripId: string }
): void => {
  const { rule, tripId } = payload;

  console.log(
    `📋 [SYNC INTEGRATION] Applying synced rule: ${rule.name} (${rule.id}) to trip ${tripId}`
  );

  // Check if the trip exists in the store
  const state = (
    dispatch as unknown as { getState?: () => StoreType }
  ).getState?.();
  const trip = state?.trips?.byId?.[tripId];

  if (!trip) {
    console.log(
      `⏳ [SYNC INTEGRATION] Trip not loaded yet, queuing rule: ${tripId}`
    );
    // Queue the rule for later processing when trips are loaded
    pendingTripRules.push({ rule, tripId });
    return;
  }

  console.log(
    `✅ [SYNC INTEGRATION] Trip found, applying rule to trip ${tripId}`
  );

  // Dispatch the action to update the rule in the specific trip
  dispatch({
    type: 'UPSERT_SYNCED_DEFAULT_ITEM_RULE',
    payload: { rule, tripId },
  });
};

export const upsertSyncedRulePack = (
  state: StoreType,
  action: { type: 'UPSERT_SYNCED_RULE_PACK'; payload: RulePack }
): StoreType => {
  const pack = action.payload;
  const idx = state.rulePacks.findIndex((p) => p.id === pack.id);
  const packs = [...state.rulePacks];
  if (idx >= 0) {
    packs[idx] = pack;
  } else {
    packs.push(pack);
  }
  return { ...state, rulePacks: packs };
};

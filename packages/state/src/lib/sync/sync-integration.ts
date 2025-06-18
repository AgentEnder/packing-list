import type { StoreType, TripData } from '../../store.js';
import type {
  Trip,
  Person,
  TripItem,
  DefaultItemRule,
  RulePack,
  TripRule,
} from '@packing-list/model';
import type { EntityExistence } from './types.js';
import type { AllActions } from '../../actions.js';
import { DefaultItemRulesStorage } from '@packing-list/offline-storage';
import { createEmptyTripData } from '../../store.js';
import { calculateDefaultItems } from '../../action-handlers/calculate-default-items.js';
import { calculatePackingListHandler } from '../../action-handlers/calculate-packing-list.js';
import { TripRuleStorage } from '@packing-list/offline-storage';

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
function mapItem(
  item: TripItem,
  rulesMap: Map<string, DefaultItemRule>
): PackingListItem {
  // Look up the rule to get the correct itemName
  const rule = rulesMap.get(item.ruleId || '');
  const itemName = rule ? rule.name : item.name; // Fallback to item.name for legacy items

  return {
    id: item.id,
    name: item.name,
    itemName: itemName,
    // Use actual rule information if available, fallback to 'imported' for legacy items
    ruleId: item.ruleId || 'imported',
    ruleHash: item.ruleHash || '',
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

// Queue for items that can't be processed until rules are loaded
let pendingItems: Array<TripItem> = [];

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
 * Process any pending items that were queued while rules were loading
 */
export const processPendingItems = (dispatch: (action: AllActions) => void) => {
  if (pendingItems.length === 0) {
    return;
  }

  console.log(
    `📦 [SYNC INTEGRATION] Processing ${pendingItems.length} pending items after rules are loaded`
  );

  const itemsToProcess = [...pendingItems];
  pendingItems = []; // Clear the queue

  // Group items by trip for efficient processing
  const itemsByTrip = new Map<string, TripItem[]>();
  for (const item of itemsToProcess) {
    if (!itemsByTrip.has(item.tripId)) {
      itemsByTrip.set(item.tripId, []);
    }
    itemsByTrip.get(item.tripId)!.push(item);
  }

  // Process each trip's items together
  for (const [tripId, tripItems] of itemsByTrip) {
    console.log(
      `📦 [SYNC INTEGRATION] Processing ${tripItems.length} items for trip ${tripId}`
    );
    dispatch({
      type: 'PROCESS_PENDING_TRIP_ITEMS',
      payload: { tripId, items: tripItems },
    });
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
      // Queue items instead of processing immediately
      // Items will be processed after rules are loaded
      console.log(
        `📦 [SYNC INTEGRATION] Queueing item for later processing: ${item.name} (${item.id})`
      );
      pendingItems.push(item);
    },
    onRulePackUpsert: (pack: RulePack) => {
      dispatch({ type: 'UPSERT_SYNCED_RULE_PACK', payload: pack });
    },
    onTripRuleUpsert: (tripRule: TripRule) => {
      console.log(
        `🔗 [SYNC INTEGRATION] Associating rule ${tripRule.ruleId} with trip ${tripRule.tripId}`
      );

      // Save the TripRule association to IndexedDB first
      TripRuleStorage.saveTripRule(tripRule)
        .then(() => {
          console.log(
            `💾 [SYNC INTEGRATION] Saved TripRule association: ${tripRule.id}`
          );

          // Fetch the rule and then apply it to the trip
          return DefaultItemRulesStorage.getDefaultItemRule(tripRule.ruleId);
        })
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
  | { type: 'UPSERT_SYNCED_RULE_PACK'; payload: RulePack }
  | {
      type: 'PROCESS_PENDING_TRIP_ITEMS';
      payload: { tripId: string; items: TripItem[] };
    };

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

  // Instead of manipulating the calculated items directly,
  // we need to trigger a recalculation and then preserve packed status
  console.log(
    `🔄 [SYNC REDUCER] Triggering recalculation for trip ${syncedItem.tripId} after item sync`
  );

  // Temporarily set the selected trip to trigger calculations
  const tempState = {
    ...state,
    trips: {
      ...state.trips,
      selectedTripId: syncedItem.tripId,
    },
  };

  // Calculate default items first
  const stateWithDefaultItems = calculateDefaultItems(tempState);

  // Then calculate packing list
  const stateWithPackingList = calculatePackingListHandler(
    stateWithDefaultItems
  );

  // Get the recalculated trip data
  const recalculatedTripData =
    stateWithPackingList.trips.byId[syncedItem.tripId];
  if (!recalculatedTripData) {
    console.error(
      `❌ [SYNC REDUCER] Failed to recalculate trip data for ${syncedItem.tripId}`
    );
    return state;
  }

  // Create rules map for efficient lookup when mapping synced item
  const rulesMap = new Map(
    tripData.trip.defaultItemRules.map((rule) => [rule.id, rule])
  );

  // Convert synced item to PackingListItem format for matching
  const syncedPackingListItem = mapItem(syncedItem, rulesMap);

  // Now preserve packed status from the synced item by matching against calculated items
  const finalItems = recalculatedTripData.calculated.packingListItems.map(
    (calculatedItem) => {
      // Try to match this calculated item with the synced item
      let isMatch = false;

      // First try to match by ruleId and ruleHash (for items with rule information)
      if (
        syncedPackingListItem.ruleId === calculatedItem.ruleId &&
        syncedPackingListItem.ruleHash === calculatedItem.ruleHash &&
        syncedPackingListItem.dayIndex === calculatedItem.dayIndex &&
        syncedPackingListItem.personId === calculatedItem.personId
      ) {
        isMatch = true;
      }

      // If no match found by rule info, try matching by logical properties
      if (!isMatch) {
        isMatch =
          syncedPackingListItem.itemName === calculatedItem.itemName &&
          syncedPackingListItem.dayIndex === calculatedItem.dayIndex &&
          syncedPackingListItem.personId === calculatedItem.personId &&
          syncedPackingListItem.quantity === calculatedItem.quantity;
      }

      // Preserve packed status if we found a match
      if (isMatch) {
        console.log(
          `🔄 [SYNC REDUCER] Preserved packed status for ${calculatedItem.itemName}: ${syncedPackingListItem.isPacked}`
        );
        return { ...calculatedItem, isPacked: syncedPackingListItem.isPacked };
      }

      return calculatedItem;
    }
  );

  // Return state with recalculated items and preserved packed status, restoring original selectedTripId
  return {
    ...state,
    trips: {
      ...state.trips,
      selectedTripId: state.trips.selectedTripId, // Restore original selected trip
      byId: {
        ...state.trips.byId,
        [syncedItem.tripId]: {
          ...recalculatedTripData,
          calculated: {
            ...recalculatedTripData.calculated,
            packingListItems: finalItems,
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

  // Always dispatch the action - the reducer will handle checking if the trip exists
  // If the trip doesn't exist yet, the reducer will warn and skip the update
  console.log(`✅ [SYNC INTEGRATION] Dispatching rule to trip ${tripId}`);

  // Dispatch the action to update the rule in the specific trip
  dispatch({
    type: 'UPSERT_SYNCED_DEFAULT_ITEM_RULE',
    payload: { rule, tripId },
  });

  // After applying the rule, check if there are pending items for this trip
  // and process them if the trip now has sufficient rules
  console.log(
    `🔄 [SYNC INTEGRATION] Checking for pending items after rule application`
  );
  processPendingItems(dispatch);
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

/**
 * Process pending items for a specific trip (batch processing)
 * This is called after all rules have been loaded for a trip
 */
export const processPendingTripItemsHandler = (
  state: StoreType,
  action: {
    type: 'PROCESS_PENDING_TRIP_ITEMS';
    payload: { tripId: string; items: TripItem[] };
  }
): StoreType => {
  const { tripId, items } = action.payload;

  console.log(
    `📦 [SYNC REDUCER] Processing ${items.length} pending items for trip ${tripId}`
  );

  const tripData = state.trips.byId[tripId];
  if (!tripData) {
    console.warn(
      `⚠️ [SYNC REDUCER] Trip not found for pending items: ${tripId}`
    );
    return state;
  }

  // Trigger recalculation with all rules loaded
  console.log(
    `🔄 [SYNC REDUCER] Triggering recalculation for trip ${tripId} with ${tripData.trip.defaultItemRules.length} rules`
  );

  // Temporarily set the selected trip to trigger calculations
  const tempState = {
    ...state,
    trips: {
      ...state.trips,
      selectedTripId: tripId,
    },
  };

  // Calculate default items first
  const stateWithDefaultItems = calculateDefaultItems(tempState);

  // Then calculate packing list
  const stateWithPackingList = calculatePackingListHandler(
    stateWithDefaultItems
  );

  // Get the recalculated trip data
  const recalculatedTripData = stateWithPackingList.trips.byId[tripId];
  if (!recalculatedTripData) {
    console.error(
      `❌ [SYNC REDUCER] Failed to recalculate trip data for ${tripId}`
    );
    return state;
  }

  // Create rules map for efficient lookup when mapping synced items
  const rulesMap = new Map(
    tripData.trip.defaultItemRules.map((rule) => [rule.id, rule])
  );

  // Convert all synced items to PackingListItem format for matching
  const syncedPackingListItems = items.map((item) => mapItem(item, rulesMap));

  // Now preserve packed status from all synced items by matching against calculated items
  const finalItems = recalculatedTripData.calculated.packingListItems.map(
    (calculatedItem) => {
      // Find matching synced item
      const matchingSyncedItem = syncedPackingListItems.find((syncedItem) => {
        // First try to match by ruleId and ruleHash (for items with rule information)
        if (
          syncedItem.ruleId === calculatedItem.ruleId &&
          syncedItem.ruleHash === calculatedItem.ruleHash &&
          syncedItem.dayIndex === calculatedItem.dayIndex &&
          syncedItem.personId === calculatedItem.personId
        ) {
          return true;
        }

        // If no match found by rule info, try matching by logical properties
        return (
          syncedItem.itemName === calculatedItem.itemName &&
          syncedItem.dayIndex === calculatedItem.dayIndex &&
          syncedItem.personId === calculatedItem.personId &&
          syncedItem.quantity === calculatedItem.quantity
        );
      });

      // Preserve packed status if we found a match
      if (matchingSyncedItem) {
        console.log(
          `🔄 [SYNC REDUCER] Preserved packed status for ${calculatedItem.itemName}: ${matchingSyncedItem.isPacked}`
        );
        return { ...calculatedItem, isPacked: matchingSyncedItem.isPacked };
      }

      return calculatedItem;
    }
  );

  console.log(
    `✅ [SYNC REDUCER] Processed ${
      items.length
    } pending items for trip ${tripId}, preserved ${
      finalItems.filter((item) => item.isPacked).length
    } packed items`
  );

  // Return state with recalculated items and preserved packed status, restoring original selectedTripId
  return {
    ...state,
    trips: {
      ...state.trips,
      selectedTripId: state.trips.selectedTripId, // Restore original selected trip
      byId: {
        ...state.trips.byId,
        [tripId]: {
          ...recalculatedTripData,
          calculated: {
            ...recalculatedTripData.calculated,
            packingListItems: finalItems,
          },
        },
      },
    },
  };
};

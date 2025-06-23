import type { StoreType, TripData } from '../../store.js';
import type {
  Trip,
  Person,
  TripItem,
  DefaultItemRule,
  RulePack,
  TripRule,
  PackingListItem,
} from '@packing-list/model';
import type { EntityExistence } from './types.js';
import type { AllActions } from '../../actions.js';
import {
  DefaultItemRulesStorage,
  ItemStorage,
} from '@packing-list/offline-storage';
import { createEmptyTripData } from '../../store.js';
import { calculateDefaultItems } from '../../action-handlers/calculate-default-items.js';
import { calculatePackingListHandler } from '../../action-handlers/calculate-packing-list.js';
import { TripRuleStorage } from '@packing-list/offline-storage';

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

// Queues for all entity types during bulk sync operations
// eslint-disable-next-line prefer-const
let syncedEntities = {
  trips: [] as Trip[],
  people: [] as Person[],
  items: [] as TripItem[],
  defaultItemRules: [] as Array<{ rule: DefaultItemRule; tripId: string }>,
  rulePacks: [] as RulePack[],
};

/**
 * Module-level sets for tracking queued entity IDs to prevent duplicates
 * This provides O(1) lookup performance and handles race conditions better
 */
const queuedEntityIds = {
  trips: new Set<string>(),
  people: new Set<string>(),
  items: new Set<string>(),
  defaultItemRules: new Set<string>(),
  rulePacks: new Set<string>(),
};

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
 * Process all synced entities - this does bulk operations to minimize store churn
 */
export const processSyncedEntities = (
  dispatch: (action: AllActions) => void
) => {
  const hasEntities =
    syncedEntities.trips.length > 0 ||
    syncedEntities.people.length > 0 ||
    syncedEntities.items.length > 0 ||
    syncedEntities.defaultItemRules.length > 0 ||
    syncedEntities.rulePacks.length > 0;

  if (!hasEntities) {
    console.log(`📦 [SYNC INTEGRATION] No synced entities to process`);
    return;
  }

  console.log(
    `📦 [SYNC INTEGRATION] Processing bulk synced entities: ${syncedEntities.trips.length} trips, ${syncedEntities.people.length} people, ${syncedEntities.items.length} items, ${syncedEntities.defaultItemRules.length} rules, ${syncedEntities.rulePacks.length} packs`
  );

  // Log item details for debugging
  if (syncedEntities.items.length > 0) {
    console.log(
      `📦 [SYNC INTEGRATION] Item IDs being processed:`,
      syncedEntities.items.map((item) => `${item.name}(${item.id})`).join(', ')
    );
  }

  // Dispatch single bulk action with all entities
  dispatch({
    type: 'BULK_UPSERT_SYNCED_ENTITIES',
    payload: {
      trips:
        syncedEntities.trips.length > 0 ? [...syncedEntities.trips] : undefined,
      people:
        syncedEntities.people.length > 0
          ? [...syncedEntities.people]
          : undefined,
      items:
        syncedEntities.items.length > 0 ? [...syncedEntities.items] : undefined,
      defaultItemRules:
        syncedEntities.defaultItemRules.length > 0
          ? [...syncedEntities.defaultItemRules]
          : undefined,
      rulePacks:
        syncedEntities.rulePacks.length > 0
          ? [...syncedEntities.rulePacks]
          : undefined,
    },
  });

  // Clear all queues after processing
  syncedEntities.trips = [];
  syncedEntities.people = [];
  syncedEntities.items = [];
  syncedEntities.defaultItemRules = [];
  syncedEntities.rulePacks = [];

  queuedEntityIds.trips.clear();
  queuedEntityIds.people.clear();
  queuedEntityIds.items.clear();
  queuedEntityIds.defaultItemRules.clear();
  queuedEntityIds.rulePacks.clear();
};

/**
 * Process any pending items that were queued while rules were loading
 * @deprecated Use processSyncedEntities instead
 */
export const processPendingItems = (dispatch: (action: AllActions) => void) => {
  // For backward compatibility, delegate to the new function
  processSyncedEntities(dispatch);
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
      // Check for duplicates using Set for O(1) performance
      if (queuedEntityIds.trips.has(trip.id)) {
        console.warn(
          `⚠️ [SYNC INTEGRATION] Duplicate trip detected, skipping: ${trip.title} (${trip.id}) - queue size: ${syncedEntities.trips.length}`
        );
        return;
      }

      console.log(
        `🚀 [SYNC INTEGRATION] Queueing trip: ${trip.title} (${
          trip.id
        }) - queue size: ${syncedEntities.trips.length + 1}`
      );
      queuedEntityIds.trips.add(trip.id);
      syncedEntities.trips.push(trip);
    },
    onPersonUpsert: (person: Person) => {
      // Check for duplicates using Set for O(1) performance
      if (queuedEntityIds.people.has(person.id)) {
        console.warn(
          `⚠️ [SYNC INTEGRATION] Duplicate person detected, skipping: ${person.name} (${person.id}) - queue size: ${syncedEntities.people.length}`
        );
        return;
      }

      console.log(
        `👤 [SYNC INTEGRATION] Queueing person: ${person.name} (${
          person.id
        }) - queue size: ${syncedEntities.people.length + 1}`
      );
      queuedEntityIds.people.add(person.id);
      syncedEntities.people.push(person);
    },
    onItemUpsert: (item: TripItem) => {
      // Store item in IndexedDB for persistence
      ItemStorage.saveItem(item).catch((error: unknown) => {
        console.error(
          `🚨 [SYNC INTEGRATION] Failed to save item ${item.id}:`,
          error
        );
      });

      // Check for duplicates before queueing
      // Check for duplicates using Set for O(1) performance
      if (queuedEntityIds.items.has(item.id)) {
        console.warn(
          `⚠️ [SYNC INTEGRATION] Duplicate item detected, skipping: ${item.name} (${item.id}) - queue size: ${syncedEntities.items.length}`
        );
        return;
      }

      console.log(
        `📦 [SYNC INTEGRATION] Queueing item: ${item.name} (${
          item.id
        }) - queue size: ${syncedEntities.items.length + 1}`
      );
      queuedEntityIds.items.add(item.id);
      syncedEntities.items.push(item);
    },
    onDefaultItemRuleUpsert: (payload: {
      rule: DefaultItemRule;
      tripId: string;
    }) => {
      console.log(
        `📋 [SYNC INTEGRATION] Queueing default item rule: ${payload.rule.name} (${payload.rule.id}) for trip ${payload.tripId}`
      );
      syncedEntities.defaultItemRules.push(payload);
    },
    onRulePackUpsert: (pack: RulePack) => {
      console.log(
        `📦 [SYNC INTEGRATION] Queueing rule pack: ${pack.name} (${pack.id})`
      );
      syncedEntities.rulePacks.push(pack);
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
  | {
      type: 'PROCESS_SYNCED_TRIP_ITEMS';
      payload: { tripId: string; items: TripItem[] };
    }
  | {
      type: 'BULK_UPSERT_SYNCED_ENTITIES';
      payload: {
        trips?: Trip[];
        people?: Person[];
        items?: TripItem[];
        defaultItemRules?: Array<{ rule: DefaultItemRule; tripId: string }>;
        rulePacks?: RulePack[];
      };
    };

const applySyncedRuleToTrip = (
  dispatch: (action: AllActions) => void,
  payload: { rule: DefaultItemRule; tripId: string }
): void => {
  const { rule, tripId } = payload;

  console.log(
    `📋 [SYNC INTEGRATION] Queueing synced rule for trip: ${rule.name} (${rule.id}) -> ${tripId}`
  );

  // Queue the rule instead of dispatching individual action
  syncedEntities.defaultItemRules.push({ rule, tripId });

  // Note: Don't process entities immediately - let the sync orchestration handle batching
  console.log(
    `📋 [SYNC INTEGRATION] Rule queued, waiting for batch processing`
  );
};

/**
 * Unified function to preserve packed status from synced items
 * This uses the same matching logic as offline hydration for consistency
 */
function preservePackedStatusFromSyncedItems(
  calculatedItems: PackingListItem[],
  syncedItems: TripItem[],
  rulesMap: Map<string, DefaultItemRule>
): PackingListItem[] {
  // Convert synced items to PackingListItem format for matching
  const syncedPackingListItems = syncedItems.map((item) =>
    mapItem(item, rulesMap)
  );
  const itemsWithoutMatches: Set<PackingListItem> = new Set(
    syncedPackingListItems
  );

  const updated = calculatedItems.map((calculatedItem) => {
    // Find matching synced item using the same logic as offline hydration
    let matchingSyncedItem = syncedPackingListItems.find((syncedItem) => {
      // First try to match by ruleId and ruleHash (for items with rule information)
      return (
        syncedItem.ruleId === calculatedItem.ruleId &&
        syncedItem.ruleHash === calculatedItem.ruleHash &&
        syncedItem.dayIndex === calculatedItem.dayIndex &&
        syncedItem.personId === calculatedItem.personId
      );
    });

    // If no match found by rule info, try matching by logical properties
    if (!matchingSyncedItem) {
      matchingSyncedItem = syncedPackingListItems.find((syncedItem) => {
        return (
          syncedItem.itemName === calculatedItem.itemName &&
          syncedItem.dayIndex === calculatedItem.dayIndex &&
          syncedItem.personId === calculatedItem.personId &&
          syncedItem.quantity === calculatedItem.quantity
        );
      });
    }

    // Preserve packed status if we found a match
    if (matchingSyncedItem) {
      itemsWithoutMatches.delete(matchingSyncedItem);
      console.log(
        `🔄 [SYNC] Preserved packed status for ${calculatedItem.itemName}: ${matchingSyncedItem.isPacked}`
      );
      return { ...calculatedItem, isPacked: matchingSyncedItem.isPacked };
    }

    return calculatedItem;
  });

  if (itemsWithoutMatches.size > 0) {
    console.warn(
      `🔄 [SYNC] No matching synced item found for ${itemsWithoutMatches.size} items`,
      ...itemsWithoutMatches.values()
    );
  }

  return updated;
}

/**
 * Process synced items for a specific trip (batch processing)
 * This does a single recalculation and preserves all packed status at once
 */
export const processSyncedTripItemsHandler = (
  state: StoreType,
  action: {
    type: 'PROCESS_SYNCED_TRIP_ITEMS';
    payload: { tripId: string; items: TripItem[] };
  }
): StoreType => {
  const { tripId, items } = action.payload;

  console.log(
    `📦 [SYNC REDUCER] Processing ${items.length} synced items for trip ${tripId}`
  );

  const tripData = state.trips.byId[tripId];
  if (!tripData) {
    console.warn(
      `⚠️ [SYNC REDUCER] Trip not found for synced items: ${tripId}`
    );
    return state;
  }

  // Temporarily set the selected trip to trigger calculations
  const tempState = {
    ...state,
    trips: {
      ...state.trips,
      selectedTripId: tripId,
    },
  };

  // Calculate default items first, then packing list
  const stateWithDefaultItems = calculateDefaultItems(tempState);
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

  // Create rules map for matching
  const rulesMap = new Map(
    tripData.trip.defaultItemRules.map((rule) => [rule.id, rule])
  );

  // Preserve packed status from all synced items
  const finalItems = preservePackedStatusFromSyncedItems(
    recalculatedTripData.calculated.packingListItems,
    items,
    rulesMap
  );

  console.log(
    `✅ [SYNC REDUCER] Processed ${
      items.length
    } synced items for trip ${tripId}, preserved ${
      finalItems.filter((item) => item.isPacked).length
    } packed items`
  );

  // Return state with preserved packed status, restoring original selectedTripId
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

/**
 * Bulk upsert handler that processes all entity types in a single operation
 * This minimizes store churn during sync operations
 */
export const bulkUpsertSyncedEntitiesHandler = (
  state: StoreType,
  action: {
    type: 'BULK_UPSERT_SYNCED_ENTITIES';
    payload: {
      trips?: Trip[];
      people?: Person[];
      items?: TripItem[];
      defaultItemRules?: Array<{ rule: DefaultItemRule; tripId: string }>;
      rulePacks?: RulePack[];
    };
  }
): StoreType => {
  const { trips, people, items, defaultItemRules, rulePacks } = action.payload;

  console.log(
    `📦 [SYNC REDUCER] Bulk upserting entities: ${trips?.length || 0} trips, ${
      people?.length || 0
    } people, ${items?.length || 0} items, ${
      defaultItemRules?.length || 0
    } rules, ${rulePacks?.length || 0} packs`
  );

  let updatedState = state;

  // Process trips first as other entities depend on them
  if (trips && trips.length > 0) {
    for (const syncedTrip of trips) {
      console.log(
        `🔄 [SYNC REDUCER] Upserting trip: ${syncedTrip.title} (${syncedTrip.id})`
      );

      // Update trip summary if it exists
      const summaryIndex = updatedState.trips.summaries.findIndex(
        (s) => s.tripId === syncedTrip.id
      );

      const updatedSummaries = [...updatedState.trips.summaries];
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
        console.log(
          `➕ [SYNC REDUCER] Added new trip summary: ${syncedTrip.id}`
        );
      }

      // Update or add trip data
      const existingTripData = updatedState.trips.byId[syncedTrip.id];
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
        console.log(
          `🆕 [SYNC REDUCER] Created new trip data: ${syncedTrip.id}`
        );
      }

      updatedState = {
        ...updatedState,
        trips: {
          ...updatedState.trips,
          summaries: updatedSummaries,
          byId: {
            ...updatedState.trips.byId,
            [syncedTrip.id]: updatedTripData,
          },
        },
      };
    }
  }

  // Process rule packs
  if (rulePacks && rulePacks.length > 0) {
    for (const pack of rulePacks) {
      const idx = updatedState.rulePacks.findIndex((p) => p.id === pack.id);
      const packs = [...updatedState.rulePacks];
      if (idx >= 0) {
        packs[idx] = pack;
      } else {
        packs.push(pack);
      }
      updatedState = { ...updatedState, rulePacks: packs };
    }
  }

  // Process default item rules
  if (defaultItemRules && defaultItemRules.length > 0) {
    // Group rules by trip for efficient recalculation
    const rulesByTrip = new Map<string, DefaultItemRule[]>();

    for (const { rule, tripId } of defaultItemRules) {
      console.log(
        `📋 [SYNC REDUCER] Upserting default item rule: ${rule.name} (${rule.id}) for trip ${tripId}`
      );

      const tripData = updatedState.trips.byId[tripId];
      if (!tripData) {
        console.warn(
          `⚠️ [SYNC REDUCER] Trip not found for default item rule: ${tripId}`
        );
        continue;
      }

      // Check if rule already exists in trip
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

      updatedState = {
        ...updatedState,
        trips: {
          ...updatedState.trips,
          byId: {
            ...updatedState.trips.byId,
            [tripId]: {
              ...tripData,
              trip: {
                ...tripData.trip,
                defaultItemRules: updatedRules,
              },
            },
          },
        },
      };

      const rulesForTrip = rulesByTrip.get(tripId) || [];
      rulesForTrip.push(rule);
      rulesByTrip.set(tripId, rulesForTrip);
    }

    // Recalculate items for each trip that had rules updated
    for (const [tripId, rules] of rulesByTrip) {
      console.log(
        `🔄 [SYNC REDUCER] Recalculating items for trip ${tripId} after ${rules.length} rule updates`
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
          selectedTripId: updatedState.trips.selectedTripId,
          byId: {
            ...updatedState.trips.byId,
            [tripId]: stateWithPackingList.trips.byId[tripId],
          },
        },
      };
    }
  }

  // Process people
  if (people && people.length > 0) {
    for (const syncedPerson of people) {
      console.log(
        `👤 [SYNC REDUCER] Upserting person: ${syncedPerson.name} (${syncedPerson.id})`
      );

      const tripData = updatedState.trips.byId[syncedPerson.tripId];
      if (!tripData) {
        console.warn(
          `⚠️ [SYNC REDUCER] Trip not found for person: ${syncedPerson.tripId}`
        );
        continue;
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

      updatedState = {
        ...updatedState,
        trips: {
          ...updatedState.trips,
          byId: {
            ...updatedState.trips.byId,
            [syncedPerson.tripId]: {
              ...tripData,
              people: updatedPeople,
            },
          },
        },
      };
    }
  }

  // Process items last, grouped by trip for efficient recalculation
  if (items && items.length > 0) {
    // Group items by trip
    const itemsByTrip = new Map<string, TripItem[]>();
    for (const item of items) {
      if (!itemsByTrip.has(item.tripId)) {
        itemsByTrip.set(item.tripId, []);
      }
      const tripItems = itemsByTrip.get(item.tripId);
      if (tripItems) {
        tripItems.push(item);
      }
    }

    console.trace();
    console.log('itemsByTrip', itemsByTrip.entries());

    // Process each trip's items together
    for (const [tripId, tripItems] of itemsByTrip) {
      updatedState = processSyncedTripItemsHandler(updatedState, {
        type: 'PROCESS_SYNCED_TRIP_ITEMS',
        payload: { tripId, items: tripItems },
      });
    }
  }

  console.log(`✅ [SYNC REDUCER] Bulk upsert completed successfully`);

  return updatedState;
};

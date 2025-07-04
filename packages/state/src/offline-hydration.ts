import {
  TripStorage,
  PersonStorage,
  ItemStorage,
  TripRuleStorage,
  UserPersonStorage,
  UserPreferencesStorage,
} from '@packing-list/offline-storage';
import type {
  TripItem,
  PackingListItem,
  DefaultItemRule,
} from '@packing-list/model';
import { createEmptyTripData, type StoreType, type TripData } from './store.js';
import { calculatePackingListHandler } from './action-handlers/calculate-packing-list.js';
import { calculateDefaultItems } from './action-handlers/calculate-default-items.js';

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

/**
 * Load offline state from local storage
 */
export async function loadOfflineState(
  userId: string
): Promise<Omit<StoreType, 'auth' | 'rulePacks' | 'ui' | 'sync'>> {
  console.log('🔄 [HYDRATION] Loading offline state for user:', userId);

  const base: Omit<StoreType, 'auth' | 'rulePacks' | 'ui' | 'sync'> = {
    trips: { summaries: [], selectedTripId: null, byId: {} },
    userPreferences: null,
    userPeople: {
      people: [],
      isLoading: false,
      error: null,
      hasTriedToLoad: true,
    },
  };

  // Validate userId before proceeding
  if (!userId || userId === 'undefined' || userId === 'null') {
    console.error('❌ [HYDRATION] Invalid userId provided:', userId);
    console.log('🔄 [HYDRATION] Returning empty state due to invalid userId');
    return base;
  }

  console.log(
    '🔄 [HYDRATION] Calling TripStorage.getUserTripSummaries with userId:',
    userId
  );

  try {
    // Load user preferences first
    let userPreferences = null;
    try {
      userPreferences = await UserPreferencesStorage.getPreferences();
      if (userPreferences) {
        base.userPreferences = userPreferences;
        console.log('✅ [HYDRATION] Loaded user preferences:', userPreferences);
      } else {
        console.log('📋 [HYDRATION] No user preferences found');
      }
    } catch (preferencesError) {
      console.error(
        '❌ [HYDRATION] Error loading user preferences:',
        preferencesError
      );
    }

    // Load all user people (profile + templates)
    try {
      const userPeople = await UserPersonStorage.getAllUserPeople(userId);
      if (userPeople.length > 0) {
        base.userPeople.people = userPeople;
        console.log(
          `✅ [HYDRATION] Loaded ${userPeople.length} user people for ${userId}`
        );
      } else {
        console.log(`📋 [HYDRATION] No user people found for ${userId}`);
      }
    } catch (peopleError) {
      console.error('❌ [HYDRATION] Error loading user people:', peopleError);
    }

    // Load trip data
    const summaries = await TripStorage.getUserTripSummaries(userId);
    console.log(
      '🔄 [HYDRATION] Got summaries from TripStorage:',
      summaries.length,
      summaries.map((s) => ({ tripId: s.tripId, title: s.title }))
    );

    base.trips.summaries = summaries;
    if (summaries.length > 0) {
      // Try to restore last selected trip if available and valid
      const lastSelectedTripId = userPreferences?.lastSelectedTripId;
      const tripExists = lastSelectedTripId
        ? summaries.some((s) => s.tripId === lastSelectedTripId)
        : false;

      if (tripExists && lastSelectedTripId) {
        base.trips.selectedTripId = lastSelectedTripId;
        console.log(
          '🎯 [HYDRATION] Restored last selected trip:',
          lastSelectedTripId
        );
      } else {
        base.trips.selectedTripId = summaries[0].tripId;
        console.log(
          '🔄 [HYDRATION] Selected first trip:',
          summaries[0].tripId,
          summaries[0].title
        );
      }
    } else {
      console.log('🔄 [HYDRATION] No trips found, selectedTripId remains null');
    }

    console.log(
      `🔄 [HYDRATION] Found ${summaries.length} trip summaries for user`
    );

    for (const summary of summaries) {
      console.log(`📁 [HYDRATION] Loading trip data for: ${summary.tripId}`);

      try {
        const trip = await TripStorage.getTrip(summary.tripId);
        if (!trip) {
          console.warn(
            `⚠️ [HYDRATION] Trip not found in storage: ${summary.tripId}`
          );
          continue;
        }

        // Validate the trip's userId matches expected userId
        if (trip.userId !== userId) {
          console.warn(
            `⚠️ [HYDRATION] Trip userId mismatch: expected "${userId}", got "${trip.userId}" for trip ${trip.id}`
          );
        }

        console.log(
          `📋 [HYDRATION] Trip loaded from IndexedDB: ${trip.title} (${trip.id}) userId: ${trip.userId}`
        );

        const people = await PersonStorage.getTripPeople(trip.id);
        const items = await ItemStorage.getTripItems(trip.id);

        // Load trip rules and populate defaultItemRules
        const defaultItemRules = await TripRuleStorage.getTripRulesWithDetails(
          trip.id
        );
        console.log(
          `📋 [HYDRATION] Loaded ${defaultItemRules.length} default item rules for trip ${trip.id}`
        );

        const data: TripData = createEmptyTripData(trip.id);

        console.log(
          `👥 [HYDRATION] Loaded ${people.length} people for trip ${trip.id}`
        );
        console.log(
          `📦 [HYDRATION] Loaded ${items.length} items for trip ${trip.id}`
        );

        // Preserve the complete trip data by assigning the full Trip object
        // The Trip type now includes all necessary fields for proper data management
        data.trip = { ...trip, defaultItemRules };
        data.people = people;
        data.lastSynced = trip.lastSyncedAt;

        // Create a temporary state with this trip to calculate packing list
        const tempState: Pick<StoreType, 'trips'> = {
          trips: {
            summaries: [],
            selectedTripId: trip.id,
            byId: { [trip.id]: data },
          },
        };

        // Calculate the packing list with all rules and people loaded
        console.log(
          `🔄 [HYDRATION] Calculating packing list for trip ${trip.id}`
        );
        const calculatedState = calculatePackingListHandler(
          calculateDefaultItems(tempState)
        );
        const calculatedTripData = calculatedState.trips.byId[trip.id];

        if (!calculatedTripData) {
          console.error(
            `❌ [HYDRATION] Failed to calculate packing list for trip ${trip.id}`
          );
          base.trips.byId[trip.id] = data;
          continue;
        }

        // Now preserve packed status from stored items by matching against calculated items
        const rulesMap = new Map(
          defaultItemRules.map((rule) => [rule.id, rule])
        );
        const storedItems = items.map((item) => mapItem(item, rulesMap));
        console.log(
          `📦 [HYDRATION] Preserving packed status for ${storedItems.length} stored items against ${calculatedTripData.calculated.packingListItems.length} calculated items`
        );

        // Use the same matching logic as preservePackedStatus
        const finalItems = calculatedTripData.calculated.packingListItems.map(
          (calculatedItem: PackingListItem) => {
            // First try to match by ruleId and ruleHash (for items with rule information)
            let storedItem = storedItems.find(
              (stored) =>
                stored.ruleId === calculatedItem.ruleId &&
                stored.ruleHash === calculatedItem.ruleHash &&
                stored.dayIndex === calculatedItem.dayIndex &&
                stored.personId === calculatedItem.personId
            );

            // If no match found by rule info, try matching by logical properties
            if (!storedItem) {
              storedItem = storedItems.find(
                (stored) =>
                  stored.itemName === calculatedItem.itemName &&
                  stored.dayIndex === calculatedItem.dayIndex &&
                  stored.personId === calculatedItem.personId &&
                  stored.quantity === calculatedItem.quantity
              );
            }

            // Preserve packed status if we found a match
            if (storedItem) {
              console.log(
                `🔄 [HYDRATION] Preserved packed status for ${calculatedItem.itemName}: ${storedItem.isPacked}`
              );
              return { ...calculatedItem, isPacked: storedItem.isPacked };
            }

            return calculatedItem;
          }
        );

        calculatedTripData.calculated.packingListItems = finalItems;
        base.trips.byId[trip.id] = calculatedTripData;

        console.log(
          `✅ [HYDRATION] Trip ${trip.id} ready for Redux state with ${
            finalItems.filter((item) => item.isPacked).length
          } packed items`
        );
      } catch (tripError) {
        console.error(
          `❌ [HYDRATION] Error loading trip ${summary.tripId}:`,
          tripError
        );
      }
    }

    console.log(
      `🎯 [HYDRATION] Successfully loaded ${
        Object.keys(base.trips.byId).length
      } trips into state - ready to update Redux`
    );
  } catch (error) {
    console.error('❌ [HYDRATION] Error loading offline state:', error);
  }

  return base;
}

import type { StoreType, TripData } from '../../store.js';
import type { Trip, Person, TripItem, DefaultItemRule, RulePack, TripRule } from '@packing-list/model';
import type {
  EntityExistence,
  EntityCallbacks,
} from '@packing-list/sync-state';
import type { AllActions } from '../../actions.js';
import {
  TripStorage,
  PersonStorage,
  ItemStorage,
  TripRulesStorage,
  DefaultItemRulesStorage,
  RulePacksStorage,
} from '@packing-list/offline-storage';
import { createEmptyTripData } from '../../store.js';

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
 * Create entity callbacks that update Redux state
 */
export function createEntityCallbacks(
  dispatch: (action: AllActions) => void
): EntityCallbacks {
  return {
    onTripUpsert: (trip: Trip) => {
      console.log(
        `🔄 [SYNC INTEGRATION] Upserting trip: ${trip.title} (${trip.id})`
      );

      // Save to IndexedDB first
      TripStorage.saveTrip(trip);

      // Update Redux state with create/update action
      dispatch({
        type: 'UPSERT_SYNCED_TRIP',
        payload: trip,
      });
    },

    onPersonUpsert: (person: Person) => {
      console.log(
        `👤 [SYNC INTEGRATION] Upserting person: ${person.name} (${person.id})`
      );

      // Save to IndexedDB first
      PersonStorage.savePerson(person);

      // Update Redux state with create/update action
      dispatch({
        type: 'UPSERT_SYNCED_PERSON',
        payload: person,
      });
    },

    onItemUpsert: (item: TripItem) => {
      console.log(
        `📦 [SYNC INTEGRATION] Upserting item: ${item.name} (${item.id})`
      );

      // Save to IndexedDB first
      ItemStorage.saveItem(item);

      // Update Redux state with create/update action
      dispatch({
        type: 'UPSERT_SYNCED_ITEM',
        payload: item,
      });
    },

    onTripRuleUpsert: (link: TripRule) => {
      console.log(
        `🔗 [SYNC INTEGRATION] Upserting trip rule link ${link.id}`
      );
      TripRulesStorage.saveTripRule(link);
      dispatch({ type: 'UPSERT_SYNCED_TRIP_RULE', payload: link });
    },

    onDefaultItemRuleUpsert: (rule: DefaultItemRule) => {
      console.log(
        `📜 [SYNC INTEGRATION] Upserting rule: ${rule.name} (${rule.id})`
      );
      DefaultItemRulesStorage.saveDefaultItemRule(rule);
      dispatch({ type: 'UPSERT_SYNCED_DEFAULT_ITEM_RULE', payload: rule });
    },

    onRulePackUpsert: (pack: RulePack) => {
      console.log(
        `📚 [SYNC INTEGRATION] Upserting rule pack: ${pack.name} (${pack.id})`
      );
      RulePacksStorage.saveRulePack(pack);
      dispatch({ type: 'UPSERT_SYNCED_RULE_PACK', payload: pack });
    },
  };
}

/**
 * Redux actions for sync integration
 */
export type SyncIntegrationActions =
  | { type: 'UPSERT_SYNCED_TRIP'; payload: Trip }
  | { type: 'UPSERT_SYNCED_PERSON'; payload: Person }
  | { type: 'UPSERT_SYNCED_ITEM'; payload: TripItem }
  | { type: 'UPSERT_SYNCED_DEFAULT_ITEM_RULE'; payload: DefaultItemRule }
  | { type: 'UPSERT_SYNCED_RULE_PACK'; payload: RulePack }
  | { type: 'UPSERT_SYNCED_TRIP_RULE'; payload: TripRule };

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

export const upsertSyncedDefaultItemRule = (
  state: StoreType,
  action: { type: 'UPSERT_SYNCED_DEFAULT_ITEM_RULE'; payload: DefaultItemRule }
): StoreType => {
  const rule = action.payload;
  const updatedById: Record<string, TripData> = { ...state.trips.byId };
  for (const tripId of Object.keys(updatedById)) {
    const tripData = updatedById[tripId];
    const idx = tripData.defaultItemRules.findIndex((r) => r.id === rule.id);
    const rules = [...tripData.defaultItemRules];
    if (idx >= 0) {
      rules[idx] = rule;
    } else {
      rules.push(rule);
    }
    updatedById[tripId] = { ...tripData, defaultItemRules: rules };
  }
  return {
    ...state,
    trips: { ...state.trips, byId: updatedById },
  };
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

export const upsertSyncedTripRule = (
  state: StoreType,
  action: { type: 'UPSERT_SYNCED_TRIP_RULE'; payload: TripRule }
): StoreType => {
  const link = action.payload;
  const tripData = state.trips.byId[link.tripId];
  if (!tripData) {
    return state;
  }
  const existingIndex = tripData.defaultItemRules.findIndex(
    (r) => r.id === link.ruleId
  );
  if (existingIndex === -1) {
    // simply ignore if rule not found for now
    return state;
  }
  // association is implied by presence; nothing else to update
  return state;
};

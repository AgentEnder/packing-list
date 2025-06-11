import {
  TripStorage,
  PersonStorage,
  ItemStorage,
} from '@packing-list/offline-storage';
import type { TripItem, PackingListItem } from '@packing-list/model';
import { createEmptyTripData, type StoreType, type TripData } from './store.js';

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
 * Load offline state from local storage
 */
export async function loadOfflineState(
  userId: string
): Promise<Omit<StoreType, 'auth' | 'rulePacks' | 'ui' | 'sync'>> {
  console.log('🔄 [HYDRATION] Loading offline state for user:', userId);

  const base: Omit<StoreType, 'auth' | 'rulePacks' | 'ui' | 'sync'> = {
    trips: { summaries: [], selectedTripId: null, byId: {} },
  };

  const summaries = await TripStorage.getUserTripSummaries(userId);
  base.trips.summaries = summaries;
  if (summaries.length > 0) {
    base.trips.selectedTripId = summaries[0].tripId;
  }

  console.log(
    `🔄 [HYDRATION] Found ${summaries.length} trip summaries for user`
  );

  for (const summary of summaries) {
    console.log(`📁 [HYDRATION] Loading trip data for: ${summary.tripId}`);
    const trip = await TripStorage.getTrip(summary.tripId);
    if (!trip) {
      console.warn(
        `⚠️ [HYDRATION] Trip not found in storage: ${summary.tripId}`
      );
      continue;
    }

    console.log(
      `📋 [HYDRATION] Trip loaded from IndexedDB: ${trip.title} (${trip.id})`
    );

    const people = await PersonStorage.getTripPeople(trip.id);
    const items = await ItemStorage.getTripItems(trip.id);
    const data: TripData = createEmptyTripData(trip.id);

    console.log(
      `👥 [HYDRATION] Loaded ${people.length} people for trip ${trip.id}`
    );
    console.log(
      `📦 [HYDRATION] Loaded ${items.length} items for trip ${trip.id}`
    );

    // Preserve the complete trip data by assigning the full Trip object
    // The LegacyTrip type in state will accept the full Trip object and use the fields it needs
    data.trip = trip;
    data.people = people;
    data.calculated.packingListItems = items.map(mapItem);
    data.lastSynced = trip.lastSyncedAt;
    base.trips.byId[trip.id] = data;

    console.log(`✅ [HYDRATION] Trip ${trip.id} ready for Redux state`);
  }

  console.log(
    `🎯 [HYDRATION] Successfully loaded ${
      Object.keys(base.trips.byId).length
    } trips into state - ready to update Redux`
  );
  return base;
}

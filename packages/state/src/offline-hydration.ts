import {
  TripStorage,
  PersonStorage,
  ItemStorage,
} from '@packing-list/offline-storage';
import type {
  TripItem,
  PackingListItem,
  TripSummary,
} from '@packing-list/model';
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

export async function loadOfflineState(
  userId: string
): Promise<Omit<StoreType, 'auth'>> {
  const base: Omit<StoreType, 'auth'> = {
    trips: { summaries: [], selectedTripId: null, byId: {} },
    rulePacks: [],
    ui: {
      rulePackModal: { isOpen: false, activeTab: 'browse', selectedPackId: undefined },
      loginModal: { isOpen: false },
      flow: { steps: [], current: null },
      tripWizard: { currentStep: 1 },
    },
  };

  const summaries = await TripStorage.getUserTripSummaries(userId);
  base.trips.summaries = summaries;
  if (summaries.length > 0) {
    base.trips.selectedTripId = summaries[0].tripId;
  }

  for (const summary of summaries) {
    const trip = await TripStorage.getTrip(summary.tripId);
    if (!trip) continue;
    const people = await PersonStorage.getTripPeople(trip.id);
    const items = await ItemStorage.getTripItems(trip.id);
    const data: TripData = createEmptyTripData(trip.id);
    data.trip = trip;
    data.people = people;
    data.calculated.packingListItems = items.map(mapItem);
    data.lastSynced = trip.lastSyncedAt;
    base.trips.byId[trip.id] = data;
  }

  return base;
}

import { StoreType } from '../store.js';
import { ItemStorage } from '@packing-list/offline-storage';
import { getChangeTracker } from '@packing-list/sync';
import type { TripItem } from '@packing-list/model';

export type ToggleItemPackedAction = {
  type: 'TOGGLE_ITEM_PACKED';
  payload: {
    itemId: string;
  };
};

export const toggleItemPackedHandler = (
  state: StoreType,
  action: ToggleItemPackedAction
): StoreType => {
  const selectedTripId = state.trips.selectedTripId;

  // Early return if no trip is selected
  if (!selectedTripId || !state.trips.byId[selectedTripId]) {
    console.warn('Cannot toggle item packed: no trip selected');
    return state;
  }

  const { itemId } = action.payload;
  const selectedTripData = state.trips.byId[selectedTripId];

  // Toggle the item in the selected trip's calculated data
  const updatedItems = selectedTripData.calculated.packingListItems.map((item) =>
    item.id === itemId ? { ...item, isPacked: !item.isPacked } : item
  );
  const updatedTripData = {
    ...selectedTripData,
    calculated: {
      ...selectedTripData.calculated,
      packingListItems: updatedItems,
    },
  };

  // Persist change and track packing status asynchronously
  const changed = updatedItems.find((item) => item.id === itemId);
  if (changed) {
    const userId = state.auth.user?.id || 'local-user';
    const now = new Date().toISOString();
    const tripItem: TripItem = {
      id: changed.id,
      tripId: selectedTripId,
      name: changed.name,
      category: changed.categoryId,
      quantity: changed.quantity,
      packed: changed.isPacked,
      notes: changed.notes,
      personId: changed.personId,
      dayIndex: changed.dayIndex,
      createdAt: now,
      updatedAt: now,
      version: 1,
      isDeleted: false,
    };
    ItemStorage.saveItem(tripItem).catch(console.error);
    getChangeTracker()
      .trackPackingStatusChange(changed.id, changed.isPacked, userId, selectedTripId, {
        previousStatus: !changed.isPacked,
      })
      .catch(console.error);
  }

  return {
    ...state,
    trips: {
      ...state.trips,
      byId: {
        ...state.trips.byId,
        [selectedTripId]: updatedTripData,
      },
    },
  };
};

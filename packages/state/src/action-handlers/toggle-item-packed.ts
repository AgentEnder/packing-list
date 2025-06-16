import { StoreType } from '../store.js';
import { ItemStorage } from '@packing-list/offline-storage';
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
    return state;
  }

  const { itemId } = action.payload;
  const selectedTripData = state.trips.byId[selectedTripId];

  // Toggle the item in the selected trip's calculated data
  const updatedItems = selectedTripData.calculated.packingListItems.map(
    (item) =>
      item.id === itemId ? { ...item, isPacked: !item.isPacked } : item
  );

  // Find the toggled item to save to IndexedDB
  const toggledItem = updatedItems.find((item) => item.id === itemId);
  if (toggledItem) {
    console.log(
      `📦 [TOGGLE_ITEM_PACKED] Saving packed status: ${toggledItem.name} (${toggledItem.id}) -> ${toggledItem.isPacked}`
    );

    // Convert PackingListItem to TripItem and save to IndexedDB
    const tripItem: TripItem = {
      id: toggledItem.id,
      tripId: selectedTripId,
      name: toggledItem.name,
      category: toggledItem.categoryId,
      quantity: toggledItem.quantity,
      packed: toggledItem.isPacked,
      notes: toggledItem.notes,
      personId: toggledItem.personId,
      dayIndex: toggledItem.dayIndex,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      isDeleted: false,
    };

    // Save to IndexedDB asynchronously
    ItemStorage.saveItem(tripItem).catch((error) => {
      console.error(
        `❌ [TOGGLE_ITEM_PACKED] Failed to save item ${itemId}:`,
        error
      );
    });
  }

  const updatedTripData = {
    ...selectedTripData,
    calculated: {
      ...selectedTripData.calculated,
      packingListItems: updatedItems,
    },
  };

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

import { StoreType } from '../store.js';
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
      `📦 [TOGGLE_ITEM_PACKED] Toggled packed status: ${toggledItem.name} (${toggledItem.id}) -> ${toggledItem.isPacked}`
    );
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

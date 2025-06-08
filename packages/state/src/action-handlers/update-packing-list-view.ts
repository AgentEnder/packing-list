import { PackingListViewState } from '@packing-list/model';
import { StoreType } from '../store.js';

export type UpdatePackingListViewAction = {
  type: 'UPDATE_PACKING_LIST_VIEW';
  payload: Partial<PackingListViewState>;
};

export const updatePackingListViewHandler = (
  state: StoreType,
  action: UpdatePackingListViewAction
): StoreType => {
  const selectedTripId = state.trips.selectedTripId;

  // Early return if no trip is selected
  if (!selectedTripId || !state.trips.byId[selectedTripId]) {
    console.warn('Cannot update packing list view: no trip selected');
    return state;
  }

  const selectedTripData = state.trips.byId[selectedTripId];

  // Update the packing list view for the selected trip
  const updatedTripData = {
    ...selectedTripData,
    packingListView: {
      ...selectedTripData.packingListView,
      ...action.payload,
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

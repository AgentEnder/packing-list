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
  return {
    ...state,
    packingListView: {
      ...state.packingListView,
      ...action.payload,
    },
  };
};

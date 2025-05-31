import { StoreType } from '../store.js';

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
  const { itemId } = action.payload;

  return {
    ...state,
    calculated: {
      ...state.calculated,
      packingListItems: state.calculated.packingListItems.map((item) =>
        item.id === itemId ? { ...item, isPacked: !item.isPacked } : item
      ),
    },
  };
};

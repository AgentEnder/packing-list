import { StoreType } from '../store.js';
import { calculateDefaultItems } from './calculate-default-items.js';
import { calculatePackingListHandler } from './calculate-packing-list.js';

export type DeleteItemRuleAction = {
  type: 'DELETE_ITEM_RULE';
  payload: {
    id: string;
  };
};

export const deleteItemRuleHandler = (
  state: StoreType,
  action: DeleteItemRuleAction
): StoreType => {
  // First delete the rule
  const stateWithDeletedRule = {
    ...state,
    defaultItemRules: state.defaultItemRules.filter(
      (rule) => rule.id !== action.payload.id
    ),
  };

  // Then recalculate default items
  const stateWithDefaultItems = calculateDefaultItems(stateWithDeletedRule, {
    type: 'CALCULATE_DEFAULT_ITEMS',
  });

  // Finally recalculate packing list
  return calculatePackingListHandler(stateWithDefaultItems, {
    type: 'CALCULATE_PACKING_LIST',
  });
};

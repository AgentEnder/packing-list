import { DefaultItemRule } from '@packing-list/model';
import { StoreType } from '../store.js';
import { calculateDefaultItems } from './calculate-default-items.js';
import { calculatePackingListHandler } from './calculate-packing-list.js';

export type CreateItemRuleAction = {
  type: 'CREATE_ITEM_RULE';
  payload: DefaultItemRule;
};

export const createItemRuleHandler = (
  state: StoreType,
  action: CreateItemRuleAction
): StoreType => {
  // First create the rule
  const stateWithNewRule = {
    ...state,
    defaultItemRules: [...state.defaultItemRules, action.payload],
  };

  // Then recalculate default items
  const stateWithDefaultItems = calculateDefaultItems(stateWithNewRule, {
    type: 'CALCULATE_DEFAULT_ITEMS',
  });

  // Finally recalculate packing list
  return calculatePackingListHandler(stateWithDefaultItems, {
    type: 'CALCULATE_PACKING_LIST',
  });
};

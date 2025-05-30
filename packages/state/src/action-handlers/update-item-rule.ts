import { DefaultItemRule } from '@packing-list/model';
import { StoreType } from '../store.js';
import { calculateDefaultItems } from './calculate-default-items.js';
import { calculatePackingListHandler } from './calculate-packing-list.js';

export type UpdateItemRuleAction = {
  type: 'UPDATE_ITEM_RULE';
  payload: DefaultItemRule;
};

export const updateItemRuleHandler = (
  state: StoreType,
  action: UpdateItemRuleAction
): StoreType => {
  // First update the rule
  const stateWithUpdatedRule = {
    ...state,
    defaultItemRules: state.defaultItemRules.map((rule) =>
      rule.id === action.payload.id ? action.payload : rule
    ),
  };

  // Then recalculate default items
  const stateWithDefaultItems = calculateDefaultItems(stateWithUpdatedRule);

  // Finally recalculate packing list
  return calculatePackingListHandler(stateWithDefaultItems);
};

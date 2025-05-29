import { DefaultItemRule } from '@packing-list/model';
import { ActionHandler } from '../actions.js';
import { StoreType } from '../store.js';

export type CreateItemRuleAction = {
  type: 'CREATE_ITEM_RULE';
  payload: DefaultItemRule;
};

export const createItemRuleHandler: ActionHandler<CreateItemRuleAction> = (
  state: StoreType,
  action: CreateItemRuleAction
): StoreType => {
  return {
    ...state,
    defaultItemRules: [...state.defaultItemRules, action.payload],
  };
};

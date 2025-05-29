import { DefaultItemRule } from '@packing-list/model';
import { ActionHandler } from '../actions.js';
import { StoreType } from '../store.js';

export type UpdateItemRuleAction = {
  type: 'UPDATE_ITEM_RULE';
  payload: {
    id: string;
    rule: Partial<DefaultItemRule>;
  };
};

export const updateItemRuleHandler: ActionHandler<UpdateItemRuleAction> = (
  state: StoreType,
  action: UpdateItemRuleAction
): StoreType => {
  return {
    ...state,
    defaultItemRules: state.defaultItemRules.map((rule) =>
      rule.id === action.payload.id ? { ...rule, ...action.payload.rule } : rule
    ),
  };
};

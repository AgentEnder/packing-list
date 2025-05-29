import { ActionHandler } from '../actions.js';
import { StoreType } from '../store.js';

export type DeleteItemRuleAction = {
  type: 'DELETE_ITEM_RULE';
  payload: {
    id: string;
  };
};

export const deleteItemRuleHandler: ActionHandler<DeleteItemRuleAction> = (
  state: StoreType,
  action: DeleteItemRuleAction
): StoreType => {
  return {
    ...state,
    defaultItemRules: state.defaultItemRules.filter(
      (rule) => rule.id !== action.payload.id
    ),
  };
};

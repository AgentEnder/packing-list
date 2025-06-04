import { StoreType } from '../store.js';
import { ActionHandler } from '../actions.js';

export type DeleteRulePackAction = {
  type: 'DELETE_RULE_PACK';
  payload: {
    id: string;
  };
};

export const deleteRulePackHandler: ActionHandler<DeleteRulePackAction> = (
  state: StoreType,
  action: DeleteRulePackAction
): StoreType => {
  return {
    ...state,
    rulePacks: state.rulePacks.filter((pack) => pack.id !== action.payload.id),
  };
};

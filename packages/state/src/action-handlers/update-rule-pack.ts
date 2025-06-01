import { RulePack } from '@packing-list/model';
import { StoreType } from '../store.js';
import { ActionHandler } from '../actions.js';

export type UpdateRulePackAction = {
  type: 'UPDATE_RULE_PACK';
  payload: RulePack;
};

export const updateRulePackHandler: ActionHandler<UpdateRulePackAction> = (
  state: StoreType,
  action: UpdateRulePackAction
): StoreType => {
  return {
    ...state,
    rulePacks: state.rulePacks.map((pack) =>
      pack.id === action.payload.id ? action.payload : pack
    ),
  };
};

import { RulePack } from '@packing-list/model';
import { StoreType } from '../store.js';
import { ActionHandler } from '../actions.js';

export type CreateRulePackAction = {
  type: 'CREATE_RULE_PACK';
  payload: RulePack;
};

export const createRulePackHandler: ActionHandler<CreateRulePackAction> = (
  state: StoreType,
  action: CreateRulePackAction
): StoreType => {
  return {
    ...state,
    rulePacks: [...state.rulePacks, action.payload],
  };
};

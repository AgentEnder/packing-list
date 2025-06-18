import { RulePack } from '@packing-list/model';
import { StoreType } from '../store.js';

export type CreateRulePackAction = {
  type: 'CREATE_RULE_PACK';
  payload: RulePack;
};

export const createRulePackHandler = (
  state: StoreType,
  action: CreateRulePackAction
): StoreType => {
  return {
    ...state,
    rulePacks: [...state.rulePacks, action.payload],
  };
};

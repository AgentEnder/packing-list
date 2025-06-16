import { RulePack } from '@packing-list/model';
import { StoreType } from '../store.js';
import { RulePacksStorage } from '@packing-list/offline-storage';

export type CreateRulePackAction = {
  type: 'CREATE_RULE_PACK';
  payload: RulePack;
};

export const createRulePackHandler = (
  state: StoreType,
  action: CreateRulePackAction
): StoreType => {
  RulePacksStorage.saveRulePack(action.payload).catch(console.error);

  return {
    ...state,
    rulePacks: [...state.rulePacks, action.payload],
  };
};

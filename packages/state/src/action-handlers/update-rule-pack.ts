import { RulePack } from '@packing-list/model';
import { StoreType } from '../store.js';
import { RulePacksStorage } from '@packing-list/offline-storage';

export type UpdateRulePackAction = {
  type: 'UPDATE_RULE_PACK';
  payload: RulePack;
};

export const updateRulePackHandler = (
  state: StoreType,
  action: UpdateRulePackAction
): StoreType => {
  RulePacksStorage.saveRulePack(action.payload).catch(console.error);

  return {
    ...state,
    rulePacks: state.rulePacks.map((pack) =>
      pack.id === action.payload.id ? action.payload : pack
    ),
  };
};

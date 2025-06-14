import { RulePack } from '@packing-list/model';
import { StoreType } from '../store.js';
import { ActionHandler } from '../actions.js';
import { RulePacksStorage } from '@packing-list/offline-storage';
import { getChangeTracker } from '@packing-list/sync';

export type CreateRulePackAction = {
  type: 'CREATE_RULE_PACK';
  payload: RulePack;
};

export const createRulePackHandler: ActionHandler<CreateRulePackAction> = (
  state: StoreType,
  action: CreateRulePackAction
): StoreType => {
  const userId = state.auth.user?.id || 'local-user';
  RulePacksStorage.saveRulePack(action.payload).catch(console.error);
  getChangeTracker()
    .trackRulePackChange('create', action.payload, userId)
    .catch(console.error);

  return {
    ...state,
    rulePacks: [...state.rulePacks, action.payload],
  };
};

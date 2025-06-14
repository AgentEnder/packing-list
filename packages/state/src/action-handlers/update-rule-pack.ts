import { RulePack } from '@packing-list/model';
import { StoreType } from '../store.js';
import { ActionHandler } from '../actions.js';
import { RulePacksStorage } from '@packing-list/offline-storage';
import { getChangeTracker } from '@packing-list/sync';

export type UpdateRulePackAction = {
  type: 'UPDATE_RULE_PACK';
  payload: RulePack;
};

export const updateRulePackHandler: ActionHandler<UpdateRulePackAction> = (
  state: StoreType,
  action: UpdateRulePackAction
): StoreType => {
  const userId = state.auth.user?.id || 'local-user';
  RulePacksStorage.saveRulePack(action.payload).catch(console.error);
  getChangeTracker()
    .trackRulePackChange('update', action.payload, userId)
    .catch(console.error);

  return {
    ...state,
    rulePacks: state.rulePacks.map((pack) =>
      pack.id === action.payload.id ? action.payload : pack
    ),
  };
};

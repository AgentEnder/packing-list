import { StoreType } from '../store.js';
import { ActionHandler } from '../actions.js';
import { RulePacksStorage } from '@packing-list/offline-storage';
import { getChangeTracker } from '@packing-list/sync';

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
  const userId = state.auth.user?.id || 'local-user';
  RulePacksStorage.deleteRulePack(action.payload.id).catch(console.error);
  const pack = state.rulePacks.find((p) => p.id === action.payload.id);
  if (pack) {
    getChangeTracker()
      .trackRulePackChange('delete', pack, userId)
      .catch(console.error);
  }

  return {
    ...state,
    rulePacks: state.rulePacks.filter((pack) => pack.id !== action.payload.id),
  };
};

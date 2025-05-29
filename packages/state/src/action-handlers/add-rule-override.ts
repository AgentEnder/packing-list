import { RuleOverride } from '@packing-list/model';
import { StoreType } from '../store.js';

export type AddRuleOverrideAction = {
  type: 'ADD_RULE_OVERRIDE';
  payload: RuleOverride;
};

export const addRuleOverrideHandler = (
  state: StoreType,
  action: AddRuleOverrideAction
): StoreType => {
  return {
    ...state,
    ruleOverrides: [...state.ruleOverrides, action.payload],
  };
};

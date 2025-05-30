import { RulePack } from '@packing-list/model';
import { StoreType } from '../store.js';
import { calculateDefaultItems } from './calculate-default-items.js';
import { calculatePackingListHandler } from './calculate-packing-list.js';
import { ActionHandler } from '../actions.js';

export type ToggleRulePackAction = {
  type: 'TOGGLE_RULE_PACK';
  pack: RulePack;
  active: boolean;
};

export const toggleRulePackHandler: ActionHandler<ToggleRulePackAction> = (
  state: StoreType,
  action: ToggleRulePackAction
): StoreType => {
  const packRuleIds = new Set(action.pack.rules.map((rule) => rule.id));

  // If activating, add all rules from the pack that aren't already present
  // If deactivating, remove all rules from this pack
  const defaultItemRules = action.active
    ? [
        ...state.defaultItemRules,
        ...action.pack.rules.filter(
          (rule) => !state.defaultItemRules.some((r) => r.id === rule.id)
        ),
      ]
    : state.defaultItemRules.filter((rule) => !packRuleIds.has(rule.id));

  // Update state with new rules
  const stateWithNewRules = {
    ...state,
    defaultItemRules,
  };

  // Then recalculate default items
  const stateWithDefaultItems = calculateDefaultItems(stateWithNewRules);

  // Finally recalculate packing list
  return calculatePackingListHandler(stateWithDefaultItems);
};

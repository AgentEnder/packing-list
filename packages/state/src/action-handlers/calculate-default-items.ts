import { StoreType } from '../store.js';
import { calculateRuleTotal } from '@packing-list/shared-utils';

export type CalculateDefaultItemsAction = {
  type: 'CALCULATE_DEFAULT_ITEMS';
};

export const calculateDefaultItems = (state: StoreType): StoreType => {
  const defaultItems = state.defaultItemRules.map((rule) => ({
    name: rule.name,
    quantity: calculateRuleTotal(rule, state.people, state.trip.days),
    ruleId: rule.id,
  }));

  return {
    ...state,
    calculated: {
      ...state.calculated,
      defaultItems,
    },
  };
};

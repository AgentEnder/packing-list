import { StoreType } from '../store.js';
import { calculateRuleTotal } from '@packing-list/shared-utils';

export type CalculateDefaultItemsAction = {
  type: 'CALCULATE_DEFAULT_ITEMS';
};

export const calculateDefaultItems = (
  state: StoreType,
  _action: CalculateDefaultItemsAction
): StoreType => {
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

function compare(
  value: number | string,
  operator: string,
  conditionValue: number | string
) {
  if (operator === '==') {
    return value === conditionValue;
  }
  if (operator === '!=') {
    return value !== conditionValue;
  }
  if (typeof value !== 'number' || typeof conditionValue !== 'number') {
    throw new Error('Value is not a number');
  }
  if (operator === '<') {
    return value < conditionValue;
  }
  if (operator === '>') {
    return value > conditionValue;
  }
  if (operator === '<=') {
    return value <= conditionValue;
  }
  if (operator === '>=') {
    return value >= conditionValue;
  }
  throw new Error('Invalid operator');
}

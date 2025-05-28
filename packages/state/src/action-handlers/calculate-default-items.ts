import { StoreType } from '../store.js';

export type CalculateDefaultItemsAction = {
  type: 'CALCULATE_DEFAULT_ITEMS';
};

export const calculateDefaultItems = (state: StoreType) => {
  const { people, defaultItemRules, trip } = state;
  const items = defaultItemRules.map((rule) => {
    const { baseQuantity, perPerson, perDay, extraItems } = rule.calculation;
    const conditions = rule.conditions;
    let peopleCount = people.length;
    let daysCount = trip.days.length;
    let itemCount = baseQuantity;

    if (conditions?.length && conditions.length > 0) {
      for (const condition of conditions) {
        if (condition.type === 'person') {
          // Filter out people that don't meet the condition
          for (const person of people) {
            if (
              !compare(
                person[condition.field],
                condition.operator,
                condition.value
              )
            ) {
              peopleCount--;
            }
          }
        } else if (condition.type === 'day') {
          // Filter out days that don't meet the condition
          for (const day of trip.days) {
            if (
              !compare(
                day[condition.field],
                condition.operator,
                condition.value
              )
            ) {
              daysCount--;
            }
          }
        }
      }
    }

    if (perPerson) {
      itemCount *= peopleCount;
    }
    if (perDay) {
      itemCount *= daysCount;
    }

    return {
      name: rule.name,
      quantity: itemCount + (extraItems || 0),
    };
  });
  return {
    ...state,
    calculated: {
      ...state.calculated,
      defaultItems: items,
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

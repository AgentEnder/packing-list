import { DefaultItemRule, Person, Day } from '@packing-list/model';

export const calculateRuleTotal = (
  rule: DefaultItemRule,
  people: Person[],
  days: Day[]
): number => {
  const { baseQuantity, perPerson, perDay, daysPattern, extraItems } =
    rule.calculation;
  const conditions = rule.conditions;
  let peopleCount = people.length;
  let daysCount = days.length;

  if (conditions?.length && conditions.length > 0) {
    for (const condition of conditions) {
      if (condition.type === 'person') {
        // Filter out people that don't meet the condition
        for (const person of people) {
          if (
            !compare(
              person[condition.field as keyof Person],
              condition.operator,
              condition.value
            )
          ) {
            peopleCount--;
          }
        }
      } else if (condition.type === 'day') {
        // Filter out days that don't meet the condition
        for (const day of days) {
          if (
            !compare(
              day[condition.field as keyof Day],
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

  const baseItemCount = calculateItemQuantity(
    baseQuantity,
    perPerson,
    perDay,
    daysPattern,
    peopleCount,
    daysCount
  );

  const extraItemCount = extraItems
    ? calculateItemQuantity(
        extraItems.quantity,
        extraItems.perPerson,
        extraItems.perDay,
        extraItems.daysPattern,
        peopleCount,
        daysCount
      )
    : 0;

  return Math.ceil(baseItemCount + extraItemCount);
};

export const calculateItemQuantity = (
  quantity: number,
  perPerson: boolean,
  perDay: boolean,
  daysPattern?: number[],
  peopleCount: number = 1,
  daysCount: number = 1
): number => {
  let total = quantity;

  if (perPerson) {
    total *= peopleCount;
  }

  if (perDay) {
    if (daysPattern && daysPattern.length > 0) {
      total *= daysPattern.length;
    } else {
      total *= daysCount;
    }
  }

  return total;
};

function compare(value: any, operator: string, conditionValue: any): boolean {
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

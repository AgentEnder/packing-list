import {
  DefaultItemRule,
  Person,
  Day,
  DayCalculation,
  Condition,
} from '@packing-list/model';

type CompareValue = string | number | boolean | CompareValue[];

export const compare = (
  a: CompareValue,
  operator: string,
  b: CompareValue
): boolean => {
  switch (operator) {
    case '==':
      return a === b;
    case '!=':
      return a !== b;
    case '<':
      return typeof a === 'number' && typeof b === 'number' ? a < b : false;
    case '>':
      return typeof a === 'number' && typeof b === 'number' ? a > b : false;
    case '<=':
      return typeof a === 'number' && typeof b === 'number' ? a <= b : false;
    case '>=':
      return typeof a === 'number' && typeof b === 'number' ? a >= b : false;
    case 'in':
      return (
        (Array.isArray(a) && a.includes(b)) ||
        (Array.isArray(b) && b.includes(a))
      );
    default:
      return false;
  }
};

const calculateDaysQuantity = (
  daysCount: number,
  pattern?: DayCalculation
): number => {
  if (!pattern) return daysCount;

  const result = daysCount / pattern.every;
  return pattern.roundUp ? Math.ceil(result) : Math.floor(result);
};

export const calculateItemQuantity = (
  baseQuantity: number,
  perPerson = false,
  perDay = false,
  daysPattern: { every: number; roundUp: boolean } | undefined,
  peopleCount: number,
  daysCount: number
): number => {
  let itemCount = baseQuantity;

  if (perPerson || peopleCount === 0) {
    itemCount *= peopleCount;
  }

  if (perDay || daysCount === 0) {
    itemCount *= calculateDaysQuantity(daysCount, daysPattern);
  }

  return itemCount;
};

export function calculateNumPeopleMeetingCondition(
  people: Person[],
  conditions: Condition[]
): number {
  return people.filter((person) =>
    conditions.every((condition) => {
      if (condition.type === 'person') {
        const value = person[condition.field as keyof Person];
        // Only compare simple values that match CompareValue type
        if (
          value === undefined ||
          value === null ||
          typeof value === 'object'
        ) {
          return false;
        }
        if (condition.value === undefined) {
          return false;
        }
        return compare(
          value as CompareValue,
          condition.operator,
          condition.value
        );
      }
      return true;
    })
  ).length;
}

export function calculateNumDaysMeetingCondition(
  days: Day[],
  conditions: Condition[]
): number {
  return days.filter((day) =>
    conditions.every((condition) => {
      if (condition.type === 'day') {
        const value = day[condition.field];
        if (condition.value === undefined) {
          return false;
        }
        return compare(value, condition.operator, condition.value);
      }
      return true;
    })
  ).length;
}

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
          if (condition.value === undefined) {
            peopleCount--;
            continue;
          }
          const value = person[condition.field as keyof Person];
          // Only compare simple values that match CompareValue type
          if (
            value !== undefined &&
            value !== null &&
            typeof value !== 'object'
          ) {
            if (
              !compare(
                value as CompareValue,
                condition.operator,
                condition.value
              )
            ) {
              peopleCount--;
            }
          } else {
            // If field is not comparable, consider it as not meeting the condition
            peopleCount--;
          }
        }
      } else if (condition.type === 'day') {
        // Filter out days that don't meet the condition
        for (const day of days) {
          if (
            !compare(day[condition.field], condition.operator, condition.value)
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

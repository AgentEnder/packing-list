import {
  DefaultItemRule,
  Person,
  Day,
  DayCalculation,
  Condition,
} from '@packing-list/model';

const compare = (a: any, operator: string, b: any): boolean => {
  switch (operator) {
    case '==':
      return a === b;
    case '!=':
      return a !== b;
    case '<':
      return a < b;
    case '>':
      return a > b;
    case '<=':
      return a <= b;
    case '>=':
      return a >= b;
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
        return compare(
          person[condition.field as keyof Person],
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
        return compare(
          day[condition.field as keyof Day],
          condition.operator,
          condition.value
        );
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

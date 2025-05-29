import {
  PackingListItem,
  DefaultItemRule,
  Person,
  Day,
} from '@packing-list/model';
import { StoreType } from '../store.js';
import {
  calculateRuleTotal,
  calculateNumPeopleMeetingCondition,
  calculateNumDaysMeetingCondition,
} from '@packing-list/shared-utils';
import { calculateRuleHash } from '@packing-list/shared-utils';

export type CalculatePackingListAction = {
  type: 'CALCULATE_PACKING_LIST';
};

function getApplicablePeople(
  rule: DefaultItemRule,
  people: Person[]
): string[] {
  if (!rule.conditions?.length) {
    return people.map((p) => p.id);
  }

  return people
    .filter((person) =>
      rule.conditions!.every((condition) => {
        if (condition.type === 'person') {
          const value = person[condition.field as keyof Person];
          return compare(value, condition.operator, condition.value);
        }
        return true;
      })
    )
    .map((p) => p.id);
}

function getApplicableDays(rule: DefaultItemRule, days: Day[]): number[] {
  if (!rule.conditions?.length) {
    return days.map((_, idx) => idx);
  }

  return days
    .map((day, idx) => ({ day, idx }))
    .filter(({ day }) =>
      rule.conditions!.every((condition) => {
        if (condition.type === 'day') {
          const value = day[condition.field as keyof Day];
          return compare(value, condition.operator, condition.value);
        }
        return true;
      })
    )
    .map(({ idx }) => idx);
}

function compare(value: any, operator: string, conditionValue: any): boolean {
  switch (operator) {
    case '==':
      return value === conditionValue;
    case '!=':
      return value !== conditionValue;
    case '<':
      return value < conditionValue;
    case '>':
      return value > conditionValue;
    case '<=':
      return value <= conditionValue;
    case '>=':
      return value >= conditionValue;
    default:
      return false;
  }
}

export const calculatePackingListHandler = (
  state: StoreType,
  _action: CalculatePackingListAction
): StoreType => {
  const packingListItems: PackingListItem[] = [];

  // Process each default item rule
  for (const rule of state.defaultItemRules) {
    const ruleHash = calculateRuleHash(rule);
    const override = state.ruleOverrides.find((o) => o.ruleId === rule.id);

    if (override?.isExcluded) {
      continue; // Skip excluded rules
    }

    const applicablePeople = getApplicablePeople(rule, state.people);
    const applicableDays = getApplicableDays(rule, state.trip.days);

    if (override) {
      // Handle person-specific override
      if (override.personId) {
        if (!applicablePeople.includes(override.personId)) {
          continue;
        }
        const personDays =
          override.dayIndex !== undefined
            ? [override.dayIndex]
            : applicableDays;

        const totalCount =
          override.overrideCount ??
          calculateRuleTotal(
            rule,
            [state.people.find((p) => p.id === override.personId)!],
            state.trip.days
          );
        const perUnitCount = rule.calculation.perDay
          ? Math.ceil(totalCount / personDays.length)
          : totalCount;

        packingListItems.push({
          id: `${rule.id}-${override.personId}-${Date.now()}`,
          name: rule.name,
          totalCount,
          perUnitCount,
          ruleId: rule.id,
          ruleHash,
          isPacked: false,
          isOverridden: true,
          applicableDays: personDays,
          applicablePersons: [override.personId],
          notes: rule.notes,
        });
      }
      // Handle day-specific override
      else if (override.dayIndex !== undefined) {
        if (!applicableDays.includes(override.dayIndex)) {
          continue;
        }

        const totalCount =
          override.overrideCount ??
          calculateRuleTotal(rule, state.people, [
            state.trip.days[override.dayIndex],
          ]);
        const perUnitCount = rule.calculation.perPerson
          ? Math.ceil(totalCount / applicablePeople.length)
          : totalCount;

        packingListItems.push({
          id: `${rule.id}-day${override.dayIndex}-${Date.now()}`,
          name: rule.name,
          totalCount,
          perUnitCount,
          ruleId: rule.id,
          ruleHash,
          isPacked: false,
          isOverridden: true,
          applicableDays: [override.dayIndex],
          applicablePersons: applicablePeople,
          notes: rule.notes,
        });
      }
      // Handle global override
      else {
        const totalCount =
          override.overrideCount ??
          calculateRuleTotal(rule, state.people, state.trip.days);
        const perUnitCount = rule.calculation.perDay
          ? Math.ceil(totalCount / applicableDays.length)
          : rule.calculation.perPerson
          ? Math.ceil(totalCount / applicablePeople.length)
          : totalCount;

        packingListItems.push({
          id: `${rule.id}-global-${Date.now()}`,
          name: rule.name,
          totalCount,
          perUnitCount,
          ruleId: rule.id,
          ruleHash,
          isPacked: false,
          isOverridden: true,
          applicableDays,
          applicablePersons: applicablePeople,
          notes: rule.notes,
        });
      }
    } else {
      // No override - create default items
      if (rule.calculation.perPerson) {
        // Create separate items for each applicable person
        for (const personId of applicablePeople) {
          const person = state.people.find((p) => p.id === personId)!;
          const totalCount = calculateRuleTotal(
            rule,
            [person],
            state.trip.days
          );
          const perUnitCount = rule.calculation.perDay
            ? Math.ceil(totalCount / applicableDays.length)
            : totalCount;

          packingListItems.push({
            id: `${rule.id}-${personId}-${Date.now()}`,
            name: `${rule.name} (${person.name})`,
            totalCount,
            perUnitCount,
            ruleId: rule.id,
            ruleHash,
            isPacked: false,
            isOverridden: false,
            applicableDays,
            applicablePersons: [personId],
            notes: rule.notes,
          });
        }
      } else if (rule.calculation.perDay) {
        // Create separate items for each applicable day
        for (const dayIndex of applicableDays) {
          const totalCount = calculateRuleTotal(rule, state.people, [
            state.trip.days[dayIndex],
          ]);
          const perUnitCount = rule.calculation.perPerson
            ? Math.ceil(totalCount / applicablePeople.length)
            : totalCount;

          packingListItems.push({
            id: `${rule.id}-day${dayIndex}-${Date.now()}`,
            name: `${rule.name} (Day ${dayIndex + 1})`,
            totalCount,
            perUnitCount,
            ruleId: rule.id,
            ruleHash,
            isPacked: false,
            isOverridden: false,
            applicableDays: [dayIndex],
            applicablePersons: applicablePeople,
            notes: rule.notes,
          });
        }
      } else {
        // Create a single item for the rule
        const totalCount = calculateRuleTotal(
          rule,
          state.people,
          state.trip.days
        );
        const perUnitCount = totalCount;

        packingListItems.push({
          id: `${rule.id}-${Date.now()}`,
          name: rule.name,
          totalCount,
          perUnitCount,
          ruleId: rule.id,
          ruleHash,
          isPacked: false,
          isOverridden: false,
          applicableDays,
          applicablePersons: applicablePeople,
          notes: rule.notes,
        });
      }
    }
  }

  // Preserve packed status from existing items
  const existingItems = state.calculated.packingListItems;
  const updatedItems = packingListItems.map((item) => {
    const existing = existingItems.find(
      (e) =>
        e.ruleId === item.ruleId &&
        e.ruleHash === item.ruleHash &&
        JSON.stringify(e.applicableDays) ===
          JSON.stringify(item.applicableDays) &&
        JSON.stringify(e.applicablePersons) ===
          JSON.stringify(item.applicablePersons)
    );
    return existing ? { ...item, isPacked: existing.isPacked } : item;
  });

  return {
    ...state,
    calculated: {
      ...state.calculated,
      packingListItems: updatedItems,
    },
  };
};

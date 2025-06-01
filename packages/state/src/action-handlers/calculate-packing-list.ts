import {
  PackingListItem,
  DefaultItemRule,
  Person,
  Day,
} from '@packing-list/model';
import { StoreType } from '../store.js';
import {
  compare,
  calculateRuleHash,
  calculateItemQuantity,
} from '@packing-list/shared-utils';

export type CalculatePackingListAction = {
  type: 'CALCULATE_PACKING_LIST';
};

function getApplicablePeople(
  rule: DefaultItemRule,
  people: Person[]
): string[] {
  const applicablePeople = people
    .filter(
      (person) =>
        rule.conditions?.every((condition) => {
          if (condition.type === 'person') {
            const value = person[condition.field as keyof Person];
            const matches = compare(value, condition.operator, condition.value);
            return matches;
          }
          return true;
        }) ?? true
    )
    .map((p) => p.id);

  return applicablePeople;
}

function getApplicableDays(rule: DefaultItemRule, days: Day[]): number[] {
  const applicableDays = days
    .map((_, index) => index)
    .filter(
      (dayIndex) =>
        rule.conditions?.every((condition) => {
          if (condition.type === 'day') {
            const value = days[dayIndex][condition.field as keyof Day];
            const matches = compare(value, condition.operator, condition.value);
            return matches;
          }
          return true;
        }) ?? true
    );

  return applicableDays;
}

function createItemInstances(
  rule: DefaultItemRule,
  applicablePeople: string[],
  applicableDays: number[],
  people: Person[],
  days: Day[],
  ruleHash: string,
  isOverridden = false,
  overrideCount?: number
): PackingListItem[] {
  const items: PackingListItem[] = [];
  const { perPerson, perDay, daysPattern, extraItems } = rule.calculation;

  // Helper function to get day groups based on pattern
  const getDayGroups = (pattern?: {
    every: number;
    roundUp: boolean;
  }): number[][] => {
    if (!pattern || pattern.every === 1) {
      // If no pattern or every=1, each day is its own group
      return applicableDays.map((day) => [day]);
    }

    const groups: number[][] = [];

    // Calculate total number of groups needed
    const totalGroups = pattern.roundUp
      ? Math.ceil(applicableDays.length / pattern.every)
      : Math.floor(applicableDays.length / pattern.every);

    // Create groups based on the pattern
    for (let i = 0; i < totalGroups; i++) {
      const start = i * pattern.every;
      const end = Math.min(start + pattern.every, applicableDays.length);
      if (start < applicableDays.length) {
        groups.push(applicableDays.slice(start, end));
      }
    }

    return groups;
  };

  // Calculate base and extra quantities separately
  const baseQuantity =
    overrideCount ??
    calculateItemQuantity(
      rule.calculation.baseQuantity,
      perPerson,
      perDay,
      rule.calculation.daysPattern,
      applicablePeople.length,
      applicableDays.length
    );

  const extraQuantity =
    !overrideCount && extraItems
      ? calculateItemQuantity(
          extraItems.quantity,
          extraItems.perPerson,
          extraItems.perDay,
          extraItems.daysPattern,
          applicablePeople.length,
          applicableDays.length
        )
      : 0;

  // Helper function to create an item instance
  const createInstance = (
    suffix: string,
    personId?: string,
    dayIndex?: number,
    dayGroup?: number[],
    isExtra = false,
    quantity = 1
  ): PackingListItem => {
    let name = rule.name;
    if (isExtra) name += ' (Extra)';

    let personName: string | undefined;
    if (personId) {
      const person = people.find((p) => p.id === personId);
      if (person) {
        name += ` (${person.name})`;
        personName = person.name;
      }
    }

    if (dayGroup && dayGroup.length > 1) {
      // For multi-day groups, show the range
      const firstDay = Math.min(...dayGroup) + 1;
      const lastDay = Math.max(...dayGroup) + 1;
      name += ` (Days ${firstDay}-${lastDay})`;
    } else if (dayIndex !== undefined) {
      name += ` (Day ${dayIndex + 1})`;
    }

    // If there are applicable days but no specific dayIndex/dayGroup was provided,
    // use the first applicable day as the dayIndex ONLY if there are day conditions
    const effectiveDayIndex =
      dayIndex ??
      (rule.conditions?.some((c) => c.type === 'day') &&
      applicableDays.length > 0
        ? applicableDays[0]
        : undefined);

    return {
      id: `${rule.id}-${suffix}-${Date.now()}`,
      name,
      itemName: rule.name,
      ruleId: rule.id,
      ruleHash,
      isPacked: false,
      isOverridden,
      dayIndex: dayGroup ? dayGroup[0] : effectiveDayIndex,
      dayStart: dayGroup ? Math.min(...dayGroup) : undefined,
      dayEnd: dayGroup ? Math.max(...dayGroup) : undefined,
      personId,
      personName,
      notes: rule.notes,
      isExtra,
      quantity,
      categoryId: rule.categoryId,
      subcategoryId: rule.subcategoryId,
    };
  };

  // Create base items
  if (perPerson && perDay) {
    const dayGroups = getDayGroups(daysPattern);
    // Create one instance per person per day group
    for (const personId of applicablePeople) {
      for (const group of dayGroups) {
        items.push(
          createInstance(
            `${personId}-days${group.join('_')}`,
            personId,
            group[0], // First day of the group
            group,
            false,
            rule.calculation.baseQuantity
          )
        );
      }
    }
  } else if (perPerson) {
    // Create one instance per person
    for (const personId of applicablePeople) {
      items.push(
        createInstance(
          personId,
          personId,
          undefined, // Let createInstance handle dayIndex based on applicableDays
          undefined,
          false,
          rule.calculation.baseQuantity
        )
      );
    }
  } else if (perDay) {
    const dayGroups = getDayGroups(daysPattern);
    // Create one instance per day group
    for (const group of dayGroups) {
      items.push(
        createInstance(
          `days${group.join('_')}`,
          undefined,
          group[0], // First day of the group
          group,
          false,
          rule.calculation.baseQuantity
        )
      );
    }
  } else {
    // For items without per-person or per-day, create based on pattern
    const dayGroups = getDayGroups(daysPattern);
    // If there's a pattern, create one instance per group
    if (daysPattern) {
      for (const group of dayGroups) {
        items.push(
          createInstance(
            `days${group.join('_')}`,
            undefined,
            group[0], // First day of the group
            group,
            false,
            rule.calculation.baseQuantity
          )
        );
      }
    } else {
      // Create individual instances for the base quantity
      for (let i = 0; i < baseQuantity; i++) {
        items.push(
          createInstance(`base-${i}`, undefined, undefined, undefined, false, 1)
        );
      }
    }
  }

  // Create extra items if not overridden
  if (extraQuantity > 0 && extraItems) {
    if (extraItems.perPerson && extraItems.perDay) {
      const dayGroups = getDayGroups(extraItems.daysPattern);
      // Create one extra instance per person per day group
      for (const personId of applicablePeople) {
        for (const group of dayGroups) {
          items.push(
            createInstance(
              `extra-${personId}-days${group.join('_')}`,
              personId,
              undefined,
              group,
              true,
              extraItems.quantity
            )
          );
        }
      }
    } else if (extraItems.perPerson) {
      // Create one extra instance per person
      for (const personId of applicablePeople) {
        items.push(
          createInstance(
            `extra-${personId}`,
            personId,
            undefined,
            undefined,
            true,
            extraItems.quantity
          )
        );
      }
    } else if (extraItems.perDay) {
      const dayGroups = getDayGroups(extraItems.daysPattern);
      // Create one extra instance per day group
      for (const group of dayGroups) {
        items.push(
          createInstance(
            `extra-days${group.join('_')}`,
            undefined,
            undefined,
            group,
            true,
            extraItems.quantity
          )
        );
      }
    } else {
      // Create individual instances for the extra quantity
      for (let i = 0; i < extraQuantity; i++) {
        items.push(
          createInstance(`extra-${i}`, undefined, undefined, undefined, true, 1)
        );
      }
    }
  }

  return items;
}

export const calculatePackingListHandler = (state: StoreType): StoreType => {
  const packingListItems: PackingListItem[] = [];

  // Process each default item rule
  for (const rule of state.defaultItemRules) {
    const ruleHash = calculateRuleHash(rule);

    const override = state.ruleOverrides.find((o) => o.ruleId === rule.id);

    if (override?.isExcluded) {
      continue;
    }

    const applicablePeople = getApplicablePeople(rule, state.people);
    const applicableDays = getApplicableDays(rule, state.trip.days);

    if (override) {
      // Handle person-specific override
      if (override.personId) {
        if (!applicablePeople.includes(override.personId)) {
          continue;
        }

        const person = state.people.find((p) => p.id === override.personId);
        if (!person) {
          continue;
        }

        const relevantPeople = [person];
        const relevantDays =
          override.dayIndex !== undefined
            ? [override.dayIndex]
            : applicableDays;

        packingListItems.push(
          ...createItemInstances(
            rule,
            [override.personId],
            relevantDays,
            relevantPeople,
            state.trip.days,
            ruleHash,
            true,
            override.overrideCount
          )
        );
      }
      // Handle day-specific override
      else if (override.dayIndex !== undefined) {
        if (!applicableDays.includes(override.dayIndex)) {
          continue;
        }

        packingListItems.push(
          ...createItemInstances(
            rule,
            applicablePeople,
            [override.dayIndex],
            state.people,
            [state.trip.days[override.dayIndex]],
            ruleHash,
            true,
            override.overrideCount
          )
        );
      }
      // Handle global override
      else {
        packingListItems.push(
          ...createItemInstances(
            rule,
            applicablePeople,
            applicableDays,
            state.people,
            state.trip.days,
            ruleHash,
            true,
            override.overrideCount
          )
        );
      }
    } else {
      // No override - create default items
      packingListItems.push(
        ...createItemInstances(
          rule,
          applicablePeople,
          applicableDays,
          state.people,
          state.trip.days,
          ruleHash
        )
      );
    }
  }

  // Preserve packed status from existing items
  const existingItems = state.calculated.packingListItems;

  const updatedItems = packingListItems.map((item) => {
    const existing = existingItems.find(
      (e) =>
        e.ruleId === item.ruleId &&
        e.ruleHash === item.ruleHash &&
        e.dayIndex === item.dayIndex &&
        e.personId === item.personId
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

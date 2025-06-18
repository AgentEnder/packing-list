import {
  PackingListItem,
  DefaultItemRule,
  Day,
  Person,
} from '@packing-list/model';
import type { RuleOverride } from '@packing-list/model';
import { StoreType } from '../store.js';
import {
  calculateRuleHash,
  calculateItemQuantity,
  compare,
  uuid,
} from '@packing-list/shared-utils';

export type CalculatePackingListAction = {
  type: 'CALCULATE_PACKING_LIST';
};

// Condition evaluation functions
function evaluatePersonCondition<
  T extends keyof Pick<Person, 'age' | 'gender'>
>(person: Person, field: T, operator: string, value: Person[T]): boolean {
  const personValue = person[field];
  if (value === undefined) {
    return false;
  }
  if (personValue === undefined) {
    return false;
  }
  return compare(personValue, operator, value);
}

function evaluateDayCondition<T extends keyof Day>(
  day: Day,
  field: T,
  operator: string,
  value: Day[T]
): boolean {
  const dayValue = day[field];
  if (dayValue === undefined) {
    return false;
  }
  return compare(dayValue, operator, value);
}

function getApplicablePeople(
  rule: DefaultItemRule,
  people: Person[]
): string[] {
  const conditions = rule.conditions;
  if (!conditions || conditions.length === 0) {
    return people.map((p) => p.id);
  }

  return people
    .filter((person) =>
      conditions.every((condition) => {
        if (condition.type === 'person') {
          return evaluatePersonCondition(
            person,
            condition.field,
            condition.operator,
            condition.value
          );
        }
        return true;
      })
    )
    .map((p) => p.id);
}

function getApplicableDays(rule: DefaultItemRule, days: Day[]): number[] {
  const conditions = rule.conditions;
  if (!conditions || conditions.length === 0) {
    return days.map((_, index) => index);
  }

  return days
    .map((day, index) => ({ day, index }))
    .filter(({ day }) =>
      conditions.every((condition) => {
        if (condition.type === 'day') {
          return evaluateDayCondition(
            day,
            condition.field,
            condition.operator,
            condition.value
          );
        }
        return true;
      })
    )
    .map(({ index }) => index);
}

// Day grouping utilities
function createDayGroups(
  applicableDays: number[],
  pattern?: { every: number; roundUp: boolean }
): number[][] {
  if (!pattern || pattern.every === 1) {
    return applicableDays.map((day) => [day]);
  }

  const groups: number[][] = [];
  const totalGroups = pattern.roundUp
    ? Math.ceil(applicableDays.length / pattern.every)
    : Math.floor(applicableDays.length / pattern.every);

  for (let i = 0; i < totalGroups; i++) {
    const start = i * pattern.every;
    const end = Math.min(start + pattern.every, applicableDays.length);
    if (start < applicableDays.length) {
      groups.push(applicableDays.slice(start, end));
    }
  }

  return groups;
}

// Item instance creation
function buildItemName(
  baseName: string,
  person?: { id: string; name: string },
  dayGroup?: number[],
  dayIndex?: number,
  isExtra = false
): string {
  let name = baseName;
  if (isExtra) name += ' (Extra)';

  if (person) {
    name += ` (${person.name})`;
  }

  if (dayGroup && dayGroup.length > 1) {
    const firstDay = Math.min(...dayGroup) + 1;
    const lastDay = Math.max(...dayGroup) + 1;
    name += ` (Days ${firstDay}-${lastDay})`;
  } else if (dayIndex !== undefined) {
    name += ` (Day ${dayIndex + 1})`;
  }

  return name;
}

function createSingleItem(
  rule: DefaultItemRule,
  ruleHash: string,
  applicableDays: number[],
  options: {
    suffix: string;
    personId?: string;
    personName?: string;
    dayIndex?: number;
    dayGroup?: number[];
    isExtra?: boolean;
    quantity?: number;
    isOverridden?: boolean;
  }
): PackingListItem {
  const {
    personId,
    personName,
    dayIndex,
    dayGroup,
    isExtra = false,
    quantity = 1,
    isOverridden = false,
  } = options;

  const person =
    personId && personName ? { id: personId, name: personName } : undefined;
  const name = buildItemName(rule.name, person, dayGroup, dayIndex, isExtra);

  // Determine effective day index
  const effectiveDayIndex =
    dayIndex ??
    (rule.conditions?.some((c) => c.type === 'day') && applicableDays.length > 0
      ? applicableDays[0]
      : undefined);

  return {
    id: uuid(),
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
}

// Base item creation strategies
function createBaseItemsPerPersonPerDay(
  rule: DefaultItemRule,
  applicablePeople: string[],
  applicableDays: number[],
  people: Person[],
  ruleHash: string,
  isOverridden: boolean
): PackingListItem[] {
  const items: PackingListItem[] = [];
  const dayGroups = createDayGroups(
    applicableDays,
    rule.calculation.daysPattern
  );

  for (const personId of applicablePeople) {
    const person = people.find((p) => p.id === personId);
    for (const group of dayGroups) {
      items.push(
        createSingleItem(rule, ruleHash, applicableDays, {
          suffix: `${personId}-days${group.join('_')}`,
          personId,
          personName: person?.name,
          dayIndex: group[0],
          dayGroup: group,
          quantity: rule.calculation.baseQuantity,
          isOverridden,
        })
      );
    }
  }

  return items;
}

function createBaseItemsPerPerson(
  rule: DefaultItemRule,
  applicablePeople: string[],
  applicableDays: number[],
  people: Person[],
  ruleHash: string,
  isOverridden: boolean
): PackingListItem[] {
  const items: PackingListItem[] = [];

  for (const personId of applicablePeople) {
    const person = people.find((p) => p.id === personId);
    items.push(
      createSingleItem(rule, ruleHash, applicableDays, {
        suffix: personId,
        personId,
        personName: person?.name,
        quantity: rule.calculation.baseQuantity,
        isOverridden,
      })
    );
  }

  return items;
}

function createBaseItemsPerDay(
  rule: DefaultItemRule,
  applicableDays: number[],
  ruleHash: string,
  isOverridden: boolean
): PackingListItem[] {
  const items: PackingListItem[] = [];
  const dayGroups = createDayGroups(
    applicableDays,
    rule.calculation.daysPattern
  );

  for (const group of dayGroups) {
    items.push(
      createSingleItem(rule, ruleHash, applicableDays, {
        suffix: `days${group.join('_')}`,
        dayIndex: group[0],
        dayGroup: group,
        quantity: rule.calculation.baseQuantity,
        isOverridden,
      })
    );
  }

  return items;
}

function createBaseItemsGeneral(
  rule: DefaultItemRule,
  applicableDays: number[],
  ruleHash: string,
  baseQuantity: number,
  isOverridden: boolean
): PackingListItem[] {
  const items: PackingListItem[] = [];
  const { daysPattern } = rule.calculation;

  if (daysPattern) {
    const dayGroups = createDayGroups(applicableDays, daysPattern);
    for (const group of dayGroups) {
      items.push(
        createSingleItem(rule, ruleHash, applicableDays, {
          suffix: `days${group.join('_')}`,
          dayIndex: group[0],
          dayGroup: group,
          quantity: rule.calculation.baseQuantity,
          isOverridden,
        })
      );
    }
  } else {
    for (let i = 0; i < baseQuantity; i++) {
      items.push(
        createSingleItem(rule, ruleHash, applicableDays, {
          suffix: `base-${i}`,
          quantity: 1,
          isOverridden,
        })
      );
    }
  }

  return items;
}

// Extra item creation strategies
function createExtraItems(
  rule: DefaultItemRule,
  applicablePeople: string[],
  applicableDays: number[],
  people: Person[],
  ruleHash: string,
  extraQuantity: number,
  isOverridden: boolean
): PackingListItem[] {
  const items: PackingListItem[] = [];
  const { extraItems } = rule.calculation;

  if (!extraItems || extraQuantity <= 0) {
    return items;
  }

  if (extraItems.perPerson && extraItems.perDay) {
    const dayGroups = createDayGroups(applicableDays, extraItems.daysPattern);
    for (const personId of applicablePeople) {
      const person = people.find((p) => p.id === personId);
      for (const group of dayGroups) {
        items.push(
          createSingleItem(rule, ruleHash, applicableDays, {
            suffix: `extra-${personId}-days${group.join('_')}`,
            personId,
            personName: person?.name,
            dayGroup: group,
            quantity: extraItems.quantity,
            isExtra: true,
            isOverridden,
          })
        );
      }
    }
  } else if (extraItems.perPerson) {
    for (const personId of applicablePeople) {
      const person = people.find((p) => p.id === personId);
      items.push(
        createSingleItem(rule, ruleHash, applicableDays, {
          suffix: `extra-${personId}`,
          personId,
          personName: person?.name,
          quantity: extraItems.quantity,
          isExtra: true,
          isOverridden,
        })
      );
    }
  } else if (extraItems.perDay) {
    const dayGroups = createDayGroups(applicableDays, extraItems.daysPattern);
    for (const group of dayGroups) {
      items.push(
        createSingleItem(rule, ruleHash, applicableDays, {
          suffix: `extra-days${group.join('_')}`,
          dayGroup: group,
          quantity: extraItems.quantity,
          isExtra: true,
          isOverridden,
        })
      );
    }
  } else {
    for (let i = 0; i < extraQuantity; i++) {
      items.push(
        createSingleItem(rule, ruleHash, applicableDays, {
          suffix: `extra-${i}`,
          quantity: 1,
          isExtra: true,
          isOverridden,
        })
      );
    }
  }

  return items;
}

// Main item creation function
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
  const { perPerson, perDay, extraItems } = rule.calculation;

  // Calculate quantities
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

  let items: PackingListItem[] = [];

  // Create base items based on strategy
  if (perPerson && perDay) {
    items = createBaseItemsPerPersonPerDay(
      rule,
      applicablePeople,
      applicableDays,
      people,
      ruleHash,
      isOverridden
    );
  } else if (perPerson) {
    items = createBaseItemsPerPerson(
      rule,
      applicablePeople,
      applicableDays,
      people,
      ruleHash,
      isOverridden
    );
  } else if (perDay) {
    items = createBaseItemsPerDay(rule, applicableDays, ruleHash, isOverridden);
  } else {
    items = createBaseItemsGeneral(
      rule,
      applicableDays,
      ruleHash,
      baseQuantity,
      isOverridden
    );
  }

  // Add extra items
  const extraItemsList = createExtraItems(
    rule,
    applicablePeople,
    applicableDays,
    people,
    ruleHash,
    extraQuantity,
    isOverridden
  );

  return [...items, ...extraItemsList];
}

// Override handling functions
function handlePersonSpecificOverride(
  rule: DefaultItemRule,
  override: RuleOverride,
  applicablePeople: string[],
  applicableDays: number[],
  people: Person[],
  days: Day[],
  ruleHash: string
): PackingListItem[] {
  if (!override.personId || !applicablePeople.includes(override.personId)) {
    return [];
  }

  const person = people.find((p) => p.id === override.personId);
  if (!person) {
    return [];
  }

  return createItemInstances(
    rule,
    [override.personId],
    applicableDays,
    [person],
    days,
    ruleHash,
    true,
    override.overrideCount
  );
}

function handleDaySpecificOverride(
  rule: DefaultItemRule,
  override: RuleOverride,
  applicablePeople: string[],
  applicableDays: number[],
  people: Person[],
  days: Day[],
  ruleHash: string
): PackingListItem[] {
  if (!override.dayIndex || !applicableDays.includes(override.dayIndex)) {
    return [];
  }

  return createItemInstances(
    rule,
    applicablePeople,
    [override.dayIndex],
    people,
    [days[override.dayIndex]],
    ruleHash,
    true,
    override.overrideCount
  );
}

function handleGlobalOverride(
  rule: DefaultItemRule,
  override: { overrideCount?: number },
  applicablePeople: string[],
  applicableDays: number[],
  people: Person[],
  days: Day[],
  ruleHash: string
): PackingListItem[] {
  return createItemInstances(
    rule,
    applicablePeople,
    applicableDays,
    people,
    days,
    ruleHash,
    true,
    override.overrideCount
  );
}

// Item processing function
function processRuleWithOverride(
  rule: DefaultItemRule,
  override: RuleOverride,
  applicablePeople: string[],
  applicableDays: number[],
  people: Person[],
  days: Day[],
  ruleHash: string
): PackingListItem[] {
  if (override.personId) {
    return handlePersonSpecificOverride(
      rule,
      override,
      applicablePeople,
      applicableDays,
      people,
      days,
      ruleHash
    );
  } else if (override.dayIndex !== undefined) {
    return handleDaySpecificOverride(
      rule,
      override,
      applicablePeople,
      applicableDays,
      people,
      days,
      ruleHash
    );
  } else {
    return handleGlobalOverride(
      rule,
      override,
      applicablePeople,
      applicableDays,
      people,
      days,
      ruleHash
    );
  }
}

function preservePackedStatus(
  newItems: PackingListItem[],
  existingItems: PackingListItem[]
): PackingListItem[] {
  return newItems.map((item) => {
    const existing = existingItems.find(
      (e) =>
        e.ruleId === item.ruleId &&
        e.ruleHash === item.ruleHash &&
        e.dayIndex === item.dayIndex &&
        e.personId === item.personId
    );

    return existing ? { ...item, isPacked: existing.isPacked } : item;
  });
}

// Main handler function
export const calculatePackingListHandler = (state: StoreType): StoreType => {
  const selectedTripId = state.trips.selectedTripId;

  if (!selectedTripId || !state.trips.byId[selectedTripId]) {
    return state;
  }

  const selectedTripData = state.trips.byId[selectedTripId];
  const packingListItems: PackingListItem[] = [];

  // Process each rule
  for (const rule of selectedTripData.trip.defaultItemRules ?? []) {
    const ruleHash = calculateRuleHash(rule);
    const override = selectedTripData.ruleOverrides.find(
      (o) => o.ruleId === rule.id
    );

    if (override?.isExcluded) {
      continue;
    }

    const applicablePeople = getApplicablePeople(rule, selectedTripData.people);
    const applicableDays = getApplicableDays(rule, selectedTripData.trip.days);

    let ruleItems: PackingListItem[] = [];

    if (override) {
      ruleItems = processRuleWithOverride(
        rule,
        override,
        applicablePeople,
        applicableDays,
        selectedTripData.people,
        selectedTripData.trip.days,
        ruleHash
      );
    } else {
      ruleItems = createItemInstances(
        rule,
        applicablePeople,
        applicableDays,
        selectedTripData.people,
        selectedTripData.trip.days,
        ruleHash
      );
    }

    packingListItems.push(...ruleItems);
  }

  // Preserve packed status and save to storage
  const existingItems = selectedTripData.calculated.packingListItems;
  const updatedItems = preservePackedStatus(packingListItems, existingItems);

  // Update state
  return {
    ...state,
    trips: {
      ...state.trips,
      byId: {
        ...state.trips.byId,
        [selectedTripId]: {
          ...selectedTripData,
          calculated: {
            ...selectedTripData.calculated,
            packingListItems: updatedItems,
          },
        },
      },
    },
  };
};

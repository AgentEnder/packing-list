import { createSelector } from '@reduxjs/toolkit';
import { StoreType } from '../store.js';
import { PackingListItem, Day, Person } from '@packing-list/model';
import { selectPeople } from '../selectors.js';

export type DayGroup = {
  type: 'day';
  day: Day;
  index: number;
  items: GroupedItem[];
};

export type PersonGroup = {
  type: 'person';
  person: Person;
  items: GroupedItem[];
};

export type ItemGroup = DayGroup | PersonGroup;

export type GroupMetadata = {
  isExtra?: boolean;
  dayIndex?: number;
  dayStart?: number;
  dayEnd?: number;
};

// Represents a group of identical items
export type GroupedItem = {
  baseItem: PackingListItem;
  instances: PackingListItem[];
  displayName: string;
  totalCount: number;
  packedCount: number;
  metadata: GroupMetadata;
};

export type GroupedItemsResult = {
  groupedItems: ItemGroup[];
  groupedGeneralItems: GroupedItem[];
};

// Basic selectors
export const selectPackingListItems = (state: StoreType) =>
  state.calculated.packingListItems;
export const selectPackingListViewState = (state: StoreType) =>
  state.packingListView;
export const selectDays = (state: StoreType) => state.trip.days;

// Filter items based on view state
export const selectFilteredItems = createSelector(
  [selectPackingListItems, selectPackingListViewState],
  (items, viewState) => {
    return items.filter((item) => {
      const { packed, unpacked, excluded } = viewState.filters;
      if (item.isPacked && !packed) return false;
      if (!item.isPacked && !unpacked) return false;
      if (item.isOverridden && !excluded) return false;
      return true;
    });
  }
);

// Split items into view-specific and general items
export const selectSplitItems = createSelector(
  [selectFilteredItems, selectPackingListViewState],
  (items, viewState) => {
    return items.reduce<{
      viewSpecificItems: PackingListItem[];
      generalItems: PackingListItem[];
    }>(
      (acc, item) => {
        if (viewState.viewMode === 'by-day') {
          if (item.dayIndex !== undefined) {
            acc.viewSpecificItems.push(item);
          } else {
            acc.generalItems.push(item);
          }
        } else {
          if (item.personId !== undefined) {
            acc.viewSpecificItems.push(item);
          } else {
            acc.generalItems.push(item);
          }
        }
        return acc;
      },
      { viewSpecificItems: [], generalItems: [] }
    );
  }
);

// Group items by person
const groupItemsByPerson = (items: PackingListItem[]): GroupedItem[] => {
  const groupedMap = new Map<string, PackingListItem[]>();

  items.forEach((item) => {
    // Group by rule and item name, keeping extras and base items together
    const key = `${item.ruleId}-${item.itemName}`;
    const group = groupedMap.get(key) || [];
    group.push(item);
    groupedMap.set(key, group);
  });

  return Array.from(groupedMap.entries()).map(([_, instances]) => {
    const baseItem = instances[0];
    const hasExtras = instances.some((item) => item.isExtra);
    const baseItems = instances.filter((item) => !item.isExtra);
    const extraItems = instances.filter((item) => item.isExtra);

    // Calculate total quantities needed
    const baseQuantityNeeded = baseItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const extraQuantityNeeded = extraItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const totalQuantityNeeded = baseQuantityNeeded + extraQuantityNeeded;

    // Calculate packed counts
    const basePackedCount = baseItems
      .filter((i) => i.isPacked)
      .reduce((sum, item) => sum + item.quantity, 0);
    const extraPackedCount = extraItems
      .filter((i) => i.isPacked)
      .reduce((sum, item) => sum + item.quantity, 0);
    const totalPackedCount = basePackedCount + extraPackedCount;

    return {
      baseItem,
      instances,
      displayName: baseItem.itemName,
      totalCount: totalQuantityNeeded,
      packedCount: totalPackedCount,
      metadata: { isExtra: hasExtras },
    };
  });
};

// Group items by day
const groupItemsByDay = (items: PackingListItem[]): GroupedItem[] => {
  const groupedMap = new Map<string, PackingListItem[]>();

  items.forEach((item) => {
    const key = `${item.ruleId}-${item.itemName}-${item.dayIndex}`;
    const group = groupedMap.get(key) || [];
    group.push(item);
    groupedMap.set(key, group);
  });

  return Array.from(groupedMap.entries()).map(([_, instances]) => {
    const baseItem = instances[0];
    const metadata: GroupMetadata = {
      dayIndex: baseItem.dayIndex,
      dayStart: baseItem.dayStart,
      dayEnd: baseItem.dayEnd,
    };

    // Calculate total quantities and packed counts
    const totalQuantityNeeded = instances.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const totalPackedCount = instances
      .filter((i) => i.isPacked)
      .reduce((sum, item) => sum + item.quantity, 0);

    return {
      baseItem,
      instances,
      displayName: baseItem.itemName,
      totalCount: totalQuantityNeeded,
      packedCount: totalPackedCount,
      metadata,
    };
  });
};

// Select grouped items based on view mode
export const selectGroupedItems = createSelector(
  [selectSplitItems, selectPackingListViewState, selectPeople, selectDays],
  (
    { viewSpecificItems, generalItems },
    viewState,
    people,
    days
  ): GroupedItemsResult => {
    const groupedGeneralItems =
      viewState.viewMode === 'by-day'
        ? groupItemsByDay(generalItems)
        : groupItemsByPerson(generalItems);

    const groupedItems: ItemGroup[] =
      viewState.viewMode === 'by-day'
        ? days.map((day, index) => ({
            type: 'day',
            day,
            index,
            items: groupItemsByDay(
              viewSpecificItems.filter((item) => item.dayIndex === index)
            ),
          }))
        : people.map((person) => ({
            type: 'person',
            person,
            items: groupItemsByPerson(
              viewSpecificItems.filter((item) => item.personId === person.id)
            ),
          }));

    return {
      groupedItems,
      groupedGeneralItems,
    };
  }
);

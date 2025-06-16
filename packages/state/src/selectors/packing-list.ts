import { createSelector } from '@reduxjs/toolkit';
import { StoreType } from '../store.js';
import { PackingListItem, Person, Day } from '@packing-list/model';
import {
  selectPeople,
  selectTripDays,
  selectPackingListView,
  selectCalculatedItems,
} from '../selectors.js';

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

// Basic selectors - updated to use new store structure
export const selectPackingListItems = createSelector(
  [selectCalculatedItems],
  (calculated) => calculated.packingListItems
);

export const selectPackingListViewState = selectPackingListView;
export const selectDays = selectTripDays;

export const selectPackingListViewMode = createSelector(
  [selectPackingListView],
  (packingListView) => packingListView.viewMode
);

// Filter items based on view state
export const selectFilteredItems: (state: StoreType) => PackingListItem[] =
  createSelector(
    [selectPackingListItems, selectPackingListViewState],
    (items, viewState) => {
      return items.filter((item) => {
        // If the item is overridden, only show it if excluded is true
        if (item.isOverridden) {
          return viewState.filters.excluded;
        }
        // Otherwise, show it based on its packed status
        return item.isPacked
          ? viewState.filters.packed
          : viewState.filters.unpacked;
      });
    }
  );

// Split items into view-specific and general items
export const selectSplitItems: (state: StoreType) => {
  viewSpecificItems: PackingListItem[];
  generalItems: PackingListItem[];
} = createSelector(
  [selectFilteredItems, selectPackingListViewState],
  (items, viewState) => {
    const viewSpecificItems: PackingListItem[] = [];
    const generalItems: PackingListItem[] = [];

    items.forEach((item) => {
      if (viewState.viewMode === 'by-day') {
        if (item.dayIndex !== undefined) {
          viewSpecificItems.push(item);
        } else {
          generalItems.push(item);
        }
      } else {
        if (item.personId !== undefined) {
          viewSpecificItems.push(item);
        } else {
          generalItems.push(item);
        }
      }
    });

    return { viewSpecificItems, generalItems };
  }
);

// Group items by person
const groupItemsByPerson = (items: PackingListItem[]): GroupedItem[] => {
  const groupedMap = new Map<string, PackingListItem[]>();

  items.forEach((item) => {
    const key = `${item.ruleId}-${item.itemName}`;
    const group = groupedMap.get(key) || [];
    group.push(item);
    groupedMap.set(key, group);
  });

  return Array.from(groupedMap.entries()).map(([, instances]) => {
    const baseItem = instances[0];
    const hasExtras = instances.some((item) => item.isExtra);
    const baseItems = instances.filter((item) => !item.isExtra);
    const extraItems = instances.filter((item) => item.isExtra);

    const baseQuantityNeeded = baseItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const extraQuantityNeeded = extraItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const totalQuantityNeeded = baseQuantityNeeded + extraQuantityNeeded;

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
      metadata: {
        isExtra: hasExtras,
        dayIndex: baseItem.dayIndex,
        dayStart: baseItem.dayStart,
        dayEnd: baseItem.dayEnd,
      },
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

  return Array.from(groupedMap.entries()).map(([, instances]) => {
    const baseItem = instances[0];
    const metadata: GroupMetadata = {
      dayIndex: baseItem.dayIndex,
      dayStart: baseItem.dayStart,
      dayEnd: baseItem.dayEnd,
    };

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
const selectViewSpecificGroupedItems = createSelector(
  [selectSplitItems, selectPackingListViewState, selectPeople, selectDays],
  ({ viewSpecificItems }, viewState, people, days): ItemGroup[] => {
    if (viewState.viewMode === 'by-day') {
      return days.map((day: Day, index: number) => {
        const dayItems = viewSpecificItems.filter(
          (item: PackingListItem) => item.dayIndex === index
        );
        const groupedDayItems = groupItemsByDay(dayItems);
        return {
          type: 'day' as const,
          day,
          index,
          items: groupedDayItems,
        };
      });
    } else {
      return people.map((person: Person) => {
        const personItems = viewSpecificItems.filter(
          (item: PackingListItem) => item.personId === person.id
        );
        const groupedPersonItems = groupItemsByPerson(personItems);
        return {
          type: 'person' as const,
          person,
          items: groupedPersonItems,
        };
      });
    }
  }
);

const selectGeneralGroupedItems = createSelector(
  [selectSplitItems, selectPackingListViewState],
  ({ generalItems }, viewState): GroupedItem[] => {
    return viewState.viewMode === 'by-day'
      ? groupItemsByDay(generalItems)
      : groupItemsByPerson(generalItems);
  }
);

export const selectGroupedItems: (state: StoreType) => GroupedItemsResult =
  createSelector(
    [selectViewSpecificGroupedItems, selectGeneralGroupedItems],
    (groupedItems, groupedGeneralItems): GroupedItemsResult => {
      const result: GroupedItemsResult = {
        groupedItems: groupedItems.map((group) => ({
          ...group,
          items: group.items.map((item) => ({
            ...item,
            metadata: {
              ...item.metadata,
              isExtra: item.metadata.isExtra || false,
            },
          })),
        })),
        groupedGeneralItems: groupedGeneralItems.map((item) => ({
          ...item,
          metadata: {
            ...item.metadata,
            isExtra: item.metadata.isExtra || false,
          },
        })),
      };
      return result;
    }
  );

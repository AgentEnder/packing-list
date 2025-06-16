import { describe, it, expect } from 'vitest';
import {
  selectFilteredItems,
  selectSplitItems,
  selectGroupedItems,
} from './packing-list.js';
import type { StoreType } from '../store.js';
import type { PackingListItem, Person, Day } from '@packing-list/model';
import { createTestTripState } from '../__tests__/test-helpers.js';

// Helper function to create a basic store state
const createMockState = (
  packingListItems: PackingListItem[] = [],
  people: Person[] = [],
  days: Day[] = []
): StoreType => {
  const state = createTestTripState({ people });
  const tripId = state.trips.selectedTripId!;

  // Update the trip data with the provided test data
  state.trips.byId[tripId] = {
    ...state.trips.byId[tripId],
    people,
    trip: {
      ...state.trips.byId[tripId].trip,
      days,
    },
    calculated: {
      defaultItems: [],
      packingListItems,
    },
    packingListView: {
      filters: {
        packed: true,
        unpacked: true,
        excluded: false,
      },
      viewMode: 'by-day',
    },
  };

  return state;
};

// Helper function to get the current trip data
const getCurrentTripData = (state: StoreType) => {
  const tripId = state.trips.selectedTripId!;
  return state.trips.byId[tripId];
};

describe('Packing List Selectors', () => {
  describe('selectFilteredItems', () => {
    it('should filter items based on view state', () => {
      const items: PackingListItem[] = [
        {
          id: '1',
          ruleId: 'rule1',
          name: 'Shirt',
          itemName: 'Shirt',
          quantity: 1,
          isPacked: true,
          isOverridden: false,
          isExtra: false,
          ruleHash: 'hash1',
        },
        {
          id: '2',
          ruleId: 'rule1',
          name: 'Pants',
          itemName: 'Pants',
          quantity: 1,
          isPacked: false,
          isOverridden: false,
          isExtra: false,
          ruleHash: 'hash2',
        },
        {
          id: '3',
          ruleId: 'rule1',
          name: 'Socks',
          itemName: 'Socks',
          quantity: 1,
          isPacked: false,
          isOverridden: true,
          isExtra: false,
          ruleHash: 'hash3',
        },
      ];

      // Test with default filters (packed: true, unpacked: true, excluded: false)
      let state = createMockState(items);
      let result = selectFilteredItems(state);
      expect(result).toHaveLength(2); // Should exclude the overridden item
      expect(result.map((i) => i.id)).toEqual(['1', '2']);

      // Test with only packed items
      state = createMockState(items);
      getCurrentTripData(state).packingListView.filters = {
        packed: true,
        unpacked: false,
        excluded: false,
      };
      result = selectFilteredItems(state);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');

      // Test with only unpacked items
      state = createMockState(items);
      getCurrentTripData(state).packingListView.filters = {
        packed: false,
        unpacked: true,
        excluded: false,
      };
      result = selectFilteredItems(state);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');

      // Test with excluded items
      state = createMockState(items);
      getCurrentTripData(state).packingListView.filters = {
        packed: false,
        unpacked: false,
        excluded: true,
      };
      result = selectFilteredItems(state);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('3');

      // Test with all filters enabled
      state = createMockState(items);
      getCurrentTripData(state).packingListView.filters = {
        packed: true,
        unpacked: true,
        excluded: true,
      };
      result = selectFilteredItems(state);
      expect(result).toHaveLength(3);
      expect(result.map((i) => i.id)).toEqual(['1', '2', '3']);
    });
  });

  describe('selectSplitItems', () => {
    it('should split items by day when in by-day view', () => {
      const items: PackingListItem[] = [
        {
          id: '1',
          ruleId: 'rule1',
          name: 'Shirt',
          itemName: 'Shirt',
          quantity: 1,
          isPacked: false,
          isOverridden: false,
          isExtra: false,
          ruleHash: 'hash1',
          dayIndex: 0,
        },
        {
          id: '2',
          ruleId: 'rule1',
          name: 'Toothbrush',
          itemName: 'Toothbrush',
          quantity: 1,
          isPacked: false,
          isOverridden: false,
          isExtra: false,
          ruleHash: 'hash2',
        },
      ];

      const state = createMockState(items);
      getCurrentTripData(state).packingListView.viewMode = 'by-day';

      const result = selectSplitItems(state);
      expect(result.viewSpecificItems).toHaveLength(1);
      expect(result.generalItems).toHaveLength(1);
      expect(result.viewSpecificItems[0].id).toBe('1');
      expect(result.generalItems[0].id).toBe('2');
    });

    it('should split items by person when in by-person view', () => {
      const items: PackingListItem[] = [
        {
          id: '1',
          ruleId: 'rule1',
          name: 'Shirt',
          itemName: 'Shirt',
          quantity: 1,
          isPacked: false,
          isOverridden: false,
          isExtra: false,
          ruleHash: 'hash1',
          personId: 'person1',
          personName: 'Alice',
        },
        {
          id: '2',
          ruleId: 'rule1',
          name: 'Sunscreen',
          itemName: 'Sunscreen',
          quantity: 1,
          isPacked: false,
          isOverridden: false,
          isExtra: false,
          ruleHash: 'hash2',
        },
      ];

      const state = createMockState(items);
      getCurrentTripData(state).packingListView.viewMode = 'by-person';

      const result = selectSplitItems(state);
      expect(result.viewSpecificItems).toHaveLength(1);
      expect(result.generalItems).toHaveLength(1);
      expect(result.viewSpecificItems[0].id).toBe('1');
      expect(result.generalItems[0].id).toBe('2');
    });
  });

  describe('selectGroupedItems', () => {
    it('should group items by day', () => {
      const days: Day[] = [
        {
          date: new Date('2024-01-01').getTime(),
          expectedClimate: 'sunny',
          location: 'Beach',
          items: [],
          travel: false,
        },
        {
          date: new Date('2024-01-02').getTime(),
          expectedClimate: 'sunny',
          location: 'Beach',
          items: [],
          travel: false,
        },
      ];

      const items: PackingListItem[] = [
        {
          id: '1',
          ruleId: 'rule1',
          name: 'Sunscreen',
          itemName: 'Sunscreen',
          quantity: 1,
          isPacked: false,
          isOverridden: false,
          isExtra: false,
          ruleHash: 'hash1',
          dayIndex: 0,
        },
        {
          id: '2',
          ruleId: 'rule1',
          name: 'Sunscreen',
          itemName: 'Sunscreen',
          quantity: 1,
          isPacked: true,
          isOverridden: false,
          isExtra: false,
          ruleHash: 'hash1',
          dayIndex: 1,
        },
        {
          id: '3',
          ruleId: 'rule2',
          name: 'Hat',
          itemName: 'Hat',
          quantity: 1,
          isPacked: false,
          isOverridden: false,
          isExtra: false,
          ruleHash: 'hash2',
        },
      ];

      const state = createMockState(items, [], days);
      getCurrentTripData(state).packingListView.viewMode = 'by-day';

      const result = selectGroupedItems(state);

      // Check day groups
      expect(result.groupedItems).toHaveLength(2);
      expect(result.groupedItems[0].type).toBe('day');
      expect(result.groupedItems[1].type).toBe('day');

      // Check items in first day
      const day1Items = result.groupedItems[0].items;
      expect(day1Items).toHaveLength(1);
      expect(day1Items[0].displayName).toBe('Sunscreen');
      expect(day1Items[0].totalCount).toBe(1);
      expect(day1Items[0].packedCount).toBe(0);

      // Check items in second day
      const day2Items = result.groupedItems[1].items;
      expect(day2Items).toHaveLength(1);
      expect(day2Items[0].displayName).toBe('Sunscreen');
      expect(day2Items[0].totalCount).toBe(1);
      expect(day2Items[0].packedCount).toBe(1);

      // Check general items
      expect(result.groupedGeneralItems).toHaveLength(1);
      expect(result.groupedGeneralItems[0].displayName).toBe('Hat');
    });

    it('should group items by person', () => {
      const people: Person[] = [
        {
          id: 'person1',
          name: 'Alice',
          age: 25,
          gender: 'female',
          tripId: 'test-trip',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          isDeleted: false,
          settings: {},
        },
        {
          id: 'person2',
          name: 'Bob',
          age: 30,
          gender: 'male',
          tripId: 'test-trip',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          isDeleted: false,
          settings: {},
        },
      ];

      const items: PackingListItem[] = [
        {
          id: '1',
          ruleId: 'rule1',
          name: 'Toothbrush',
          itemName: 'Toothbrush',
          quantity: 1,
          isPacked: false,
          isOverridden: false,
          isExtra: false,
          ruleHash: 'hash1',
          personId: 'person1',
          personName: 'Alice',
        },
        {
          id: '2',
          ruleId: 'rule1',
          name: 'Toothbrush',
          itemName: 'Toothbrush',
          quantity: 1,
          isPacked: true,
          isOverridden: false,
          isExtra: false,
          ruleHash: 'hash1',
          personId: 'person2',
          personName: 'Bob',
        },
        {
          id: '3',
          ruleId: 'rule2',
          name: 'Sunscreen',
          itemName: 'Sunscreen',
          quantity: 1,
          isPacked: false,
          isOverridden: false,
          isExtra: false,
          ruleHash: 'hash2',
        },
      ];

      const state = createMockState(items, people);
      getCurrentTripData(state).packingListView.viewMode = 'by-person';

      const result = selectGroupedItems(state);

      // Check person groups
      expect(result.groupedItems).toHaveLength(2);
      expect(result.groupedItems[0].type).toBe('person');
      expect(result.groupedItems[1].type).toBe('person');

      // Check items for first person
      const person1Items = result.groupedItems[0].items;
      expect(person1Items).toHaveLength(1);
      expect(person1Items[0].displayName).toBe('Toothbrush');
      expect(person1Items[0].totalCount).toBe(1);
      expect(person1Items[0].packedCount).toBe(0);

      // Check items for second person
      const person2Items = result.groupedItems[1].items;
      expect(person2Items).toHaveLength(1);
      expect(person2Items[0].displayName).toBe('Toothbrush');
      expect(person2Items[0].totalCount).toBe(1);
      expect(person2Items[0].packedCount).toBe(1);

      // Check general items
      expect(result.groupedGeneralItems).toHaveLength(1);
      expect(result.groupedGeneralItems[0].displayName).toBe('Sunscreen');
    });

    it('should handle extra items correctly', () => {
      const items: PackingListItem[] = [
        {
          id: '1',
          ruleId: 'rule1',
          name: 'Shirt',
          itemName: 'Shirt',
          quantity: 2,
          isPacked: false,
          isOverridden: false,
          isExtra: false,
          ruleHash: 'hash1',
          personId: 'person1',
          personName: 'Alice',
        },
        {
          id: '2',
          ruleId: 'rule1',
          name: 'Shirt',
          itemName: 'Shirt',
          quantity: 1,
          isPacked: true,
          isOverridden: false,
          isExtra: true,
          ruleHash: 'hash1',
          personId: 'person1',
          personName: 'Alice',
        },
      ];

      const people: Person[] = [
        {
          id: 'person1',
          name: 'Alice',
          age: 25,
          gender: 'female',
          tripId: 'test-trip',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          isDeleted: false,
          settings: {},
        },
      ];

      const state = createMockState(items, people);
      getCurrentTripData(state).packingListView.viewMode = 'by-person';

      const result = selectGroupedItems(state);

      // Check person group
      expect(result.groupedItems).toHaveLength(1);
      const personItems = result.groupedItems[0].items;
      expect(personItems).toHaveLength(1);

      // Check grouped item with extras
      const groupedItem = personItems[0];
      expect(groupedItem.displayName).toBe('Shirt');
      expect(groupedItem.totalCount).toBe(3); // 2 base + 1 extra
      expect(groupedItem.packedCount).toBe(1); // 1 extra packed
      expect(groupedItem.metadata.isExtra).toBe(true);
    });
  });
});

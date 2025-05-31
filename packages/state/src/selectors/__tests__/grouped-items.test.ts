import { describe, it, expect } from 'vitest';
import { selectGroupedItems } from '../packing-list.js';
import { StoreType, initialState } from '../../store.js';
import { PackingListItem, Person, Day } from '@packing-list/model';

describe('selectGroupedItems', () => {
  it('should group items by day', () => {
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
        id: '3',
        ruleId: 'rule2',
        name: 'Pants',
        itemName: 'Pants',
        quantity: 1,
        isPacked: false,
        isOverridden: false,
        isExtra: false,
        ruleHash: 'hash2',
        dayIndex: 1,
      },
    ];

    const days: Day[] = [
      {
        location: 'Beach',
        expectedClimate: 'beach',
        items: [],
        travel: false,
        date: 1,
      },
      {
        location: 'Mountain',
        expectedClimate: 'cold',
        items: [],
        travel: true,
        date: 2,
      },
    ];

    const testState: StoreType = {
      ...initialState,
      calculated: {
        ...initialState.calculated,
        packingListItems: items,
      },
      trip: {
        ...initialState.trip,
        days,
      },
      packingListView: {
        viewMode: 'by-day',
        filters: {
          packed: true,
          unpacked: true,
          excluded: false,
        },
      },
    };

    const result = selectGroupedItems(testState);

    expect(result.groupedItems).toHaveLength(2); // Two days
    expect(result.groupedItems[0].type).toBe('day');
    expect(result.groupedItems[0].items).toHaveLength(1); // One group for shirts
    expect(result.groupedItems[0].items[0].totalCount).toBe(2); // Two shirts
    expect(result.groupedItems[1].items).toHaveLength(1); // One group for pants
    expect(result.groupedItems[1].items[0].totalCount).toBe(1); // One pair of pants
  });

  it('should group items by person', () => {
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
        personName: 'Person 1',
      },
      {
        id: '2',
        ruleId: 'rule1',
        name: 'Shirt',
        itemName: 'Shirt',
        quantity: 1,
        isPacked: true,
        isOverridden: false,
        isExtra: false,
        ruleHash: 'hash1',
        personId: 'person1',
        personName: 'Person 1',
      },
      {
        id: '3',
        ruleId: 'rule2',
        name: 'Pants',
        itemName: 'Pants',
        quantity: 1,
        isPacked: false,
        isOverridden: false,
        isExtra: false,
        ruleHash: 'hash2',
        personId: 'person2',
        personName: 'Person 2',
      },
    ];

    const people: Person[] = [
      {
        id: 'person1',
        name: 'Person 1',
        age: 30,
        gender: 'male',
      },
      {
        id: 'person2',
        name: 'Person 2',
        age: 25,
        gender: 'female',
      },
    ];

    const testState: StoreType = {
      ...initialState,
      calculated: {
        ...initialState.calculated,
        packingListItems: items,
      },
      people,
      packingListView: {
        viewMode: 'by-person',
        filters: {
          packed: true,
          unpacked: true,
          excluded: false,
        },
      },
    };

    const result = selectGroupedItems(testState);

    expect(result.groupedItems).toHaveLength(2); // Two people
    expect(result.groupedItems[0].type).toBe('person');
    expect(result.groupedItems[0].items).toHaveLength(1); // One group for shirts
    expect(result.groupedItems[0].items[0].totalCount).toBe(2); // Two shirts
    expect(result.groupedItems[0].items[0].packedCount).toBe(1); // One packed shirt
    expect(result.groupedItems[1].items).toHaveLength(1); // One group for pants
    expect(result.groupedItems[1].items[0].totalCount).toBe(1); // One pair of pants
  });

  it('should handle general items', () => {
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
      },
      {
        id: '3',
        ruleId: 'rule2',
        name: 'First Aid Kit',
        itemName: 'First Aid Kit',
        quantity: 1,
        isPacked: false,
        isOverridden: false,
        isExtra: false,
        ruleHash: 'hash2',
      },
    ];

    const testState: StoreType = {
      ...initialState,
      calculated: {
        ...initialState.calculated,
        packingListItems: items,
      },
      packingListView: {
        viewMode: 'by-day',
        filters: {
          packed: true,
          unpacked: true,
          excluded: false,
        },
      },
    };

    const result = selectGroupedItems(testState);

    expect(result.groupedGeneralItems).toHaveLength(2); // Two groups
    expect(result.groupedGeneralItems[0].totalCount).toBe(2); // Two toothbrushes
    expect(result.groupedGeneralItems[0].packedCount).toBe(1); // One packed toothbrush
    expect(result.groupedGeneralItems[1].totalCount).toBe(1); // One first aid kit
  });

  it('should handle extra items', () => {
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
        personName: 'Person 1',
      },
      {
        id: '2',
        ruleId: 'rule1',
        name: 'Shirt (Extra)',
        itemName: 'Shirt',
        quantity: 1,
        isPacked: false,
        isOverridden: false,
        isExtra: true,
        ruleHash: 'hash1',
        personId: 'person1',
        personName: 'Person 1',
      },
    ];

    const people: Person[] = [
      {
        id: 'person1',
        name: 'Person 1',
        age: 30,
        gender: 'male',
      },
    ];

    const testState: StoreType = {
      ...initialState,
      calculated: {
        ...initialState.calculated,
        packingListItems: items,
      },
      people,
      packingListView: {
        viewMode: 'by-person',
        filters: {
          packed: true,
          unpacked: true,
          excluded: false,
        },
      },
    };

    const result = selectGroupedItems(testState);

    expect(result.groupedItems).toHaveLength(1); // One person
    expect(result.groupedItems[0].items).toHaveLength(1); // One group for shirts
    expect(result.groupedItems[0].items[0].totalCount).toBe(2); // Two shirts total
    expect(result.groupedItems[0].items[0].metadata.isExtra).toBe(true); // Has extra items
  });
});

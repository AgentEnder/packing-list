import { describe, it, expect } from 'vitest';
import { calculatePackingListHandler } from './calculate-packing-list.js';
import type { StoreType } from '../store.js';
import type { DefaultItemRule, Person, Day, Item } from '@packing-list/model';

describe('calculatePackingListHandler', () => {
  // Helper function to create a Day object
  const createDay = (
    dateStr: string,
    expectedClimate: string = 'sunny',
    location: string = 'home'
  ): Day => ({
    date: new Date(dateStr).getTime(),
    expectedClimate,
    location,
    items: [],
    travel: false,
  });

  // Helper function to create a basic store state
  const createMockState = (
    rules: DefaultItemRule[] = [],
    people: Person[] = [],
    days: Day[] = [],
    ruleOverrides: StoreType['ruleOverrides'] = []
  ): StoreType => ({
    defaultItemRules: rules,
    people,
    trip: {
      id: 'test-trip',
      days,
    },
    ruleOverrides,
    rulePacks: [],
    packingListView: {
      filters: {
        packed: true,
        unpacked: true,
        excluded: false,
      },
      viewMode: 'by-day',
    },
    calculated: {
      defaultItems: [],
      packingListItems: [],
    },
  });

  it('should handle empty state', () => {
    const state = createMockState();
    const result = calculatePackingListHandler(state);
    expect(result.calculated.packingListItems).toEqual([]);
  });

  it('should create basic items without conditions', () => {
    const state = createMockState(
      [
        {
          id: 'rule1',
          name: 'Toothbrush',
          calculation: {
            baseQuantity: 1,
            perPerson: true,
            perDay: false,
          },
        },
      ],
      [
        { id: 'person1', name: 'Alice', age: 25, gender: 'female' },
        { id: 'person2', name: 'Bob', age: 30, gender: 'male' },
      ],
      [createDay('2024-01-01'), createDay('2024-01-02')]
    );

    const result = calculatePackingListHandler(state);
    expect(result.calculated.packingListItems).toHaveLength(2); // One for each person
    expect(result.calculated.packingListItems[0].name).toContain('Toothbrush');
    expect(result.calculated.packingListItems[0].personName).toBe('Alice');
    expect(result.calculated.packingListItems[1].personName).toBe('Bob');
  });

  it('should handle person conditions', () => {
    const state = createMockState(
      [
        {
          id: 'rule1',
          name: 'Swimming Suit',
          conditions: [
            {
              type: 'person',
              field: 'age',
              operator: '>',
              value: 12,
            },
          ],
          calculation: {
            baseQuantity: 1,
            perPerson: true,
            perDay: false,
          },
        },
      ],
      [
        { id: 'person1', name: 'Child', age: 10, gender: 'other' },
        { id: 'person2', name: 'Adult', age: 30, gender: 'other' },
      ],
      [createDay('2024-01-01')]
    );

    const result = calculatePackingListHandler(state);
    expect(result.calculated.packingListItems).toHaveLength(1); // Only for the adult
    expect(result.calculated.packingListItems[0].personName).toBe('Adult');
  });

  it('should handle day conditions', () => {
    const state = createMockState(
      [
        {
          id: 'rule1',
          name: 'Sunscreen',
          conditions: [
            {
              type: 'day',
              field: 'expectedClimate',
              operator: '==',
              value: 'sunny',
            },
          ],
          calculation: {
            baseQuantity: 1,
            perPerson: false,
            perDay: true,
          },
        },
      ],
      [{ id: 'person1', name: 'Alice', age: 25, gender: 'female' }],
      [
        createDay('2024-01-01', 'sunny'),
        createDay('2024-01-02', 'rainy'),
        createDay('2024-01-03', 'sunny'),
      ]
    );

    const result = calculatePackingListHandler(state);
    expect(result.calculated.packingListItems).toHaveLength(2); // Only for sunny days
    expect(result.calculated.packingListItems[0].dayIndex).toBe(0);
    expect(result.calculated.packingListItems[1].dayIndex).toBe(2);
  });

  // TODO: Overrides is not fleshed out yet.
  it.skip('should handle rule overrides', () => {
    const state = createMockState(
      [
        {
          id: 'rule1',
          name: 'Socks',
          calculation: {
            baseQuantity: 1,
            perPerson: true,
            perDay: false,
          },
        },
      ],
      [
        { id: 'person1', name: 'Alice', age: 25, gender: 'female' },
        { id: 'person2', name: 'Bob', age: 30, gender: 'male' },
      ],
      [createDay('2024-01-01')],
      [
        {
          ruleId: 'rule1',
          tripId: 'test-trip',
          personId: 'person1',
          overrideCount: 3,
          isExcluded: false,
        },
      ]
    );

    const result = calculatePackingListHandler(state);
    const aliceItems = result.calculated.packingListItems.filter(
      (item) => item.personId === 'person1'
    );
    const bobItems = result.calculated.packingListItems.filter(
      (item) => item.personId === 'person2'
    );

    expect(aliceItems[0].quantity).toBe(3); // Overridden
    expect(bobItems[0].quantity).toBe(1); // Default
  });

  it('should preserve packed status from existing items', () => {
    const initialState = createMockState(
      [
        {
          id: 'rule1',
          name: 'Toothbrush',
          calculation: {
            baseQuantity: 1,
            perPerson: true,
            perDay: false,
          },
        },
      ],
      [{ id: 'person1', name: 'Alice', age: 25, gender: 'female' }],
      [createDay('2024-01-01')]
    );

    // First calculation
    const firstResult = calculatePackingListHandler(initialState);
    const itemId = firstResult.calculated.packingListItems[0].id;
    const ruleHash = firstResult.calculated.packingListItems[0].ruleHash;

    // Mark item as packed
    const stateWithPackedItems: StoreType = {
      ...initialState,
      calculated: {
        defaultItems: [],
        packingListItems: [
          {
            ...firstResult.calculated.packingListItems[0],
            isPacked: true,
          },
        ],
      },
    };

    // Recalculate
    const result = calculatePackingListHandler(stateWithPackedItems);
    expect(result.calculated.packingListItems[0].isPacked).toBe(true);
  });

  it('should handle day patterns correctly', () => {
    const state = createMockState(
      [
        {
          id: 'rule1',
          name: 'Laundry Bag',
          calculation: {
            baseQuantity: 1,
            perPerson: true,
            perDay: true,
            daysPattern: {
              every: 3,
              roundUp: true,
            },
          },
        },
      ],
      [{ id: 'person1', name: 'Alice', age: 25, gender: 'female' }],
      [
        createDay('2024-01-01'),
        createDay('2024-01-02'),
        createDay('2024-01-03'),
        createDay('2024-01-04'),
        createDay('2024-01-05'),
      ]
    );

    const result = calculatePackingListHandler(state);
    expect(result.calculated.packingListItems).toHaveLength(2); // Should create 2 groups: days 1-3 and 4-5
    expect(result.calculated.packingListItems[0].dayStart).toBe(0);
    expect(result.calculated.packingListItems[0].dayEnd).toBe(2);
    expect(result.calculated.packingListItems[1].dayStart).toBe(3);
    expect(result.calculated.packingListItems[1].dayEnd).toBe(4);
  });
});

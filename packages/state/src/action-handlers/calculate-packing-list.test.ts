import { describe, it, expect } from 'vitest';
import { calculatePackingListHandler } from './calculate-packing-list.js';
import {
  createTestTripState,
  createTestPerson,
} from '../__tests__/test-helpers.js';
import type { StoreType } from '../store.js';
import type { DefaultItemRule, Person, Day } from '@packing-list/model';

describe('calculatePackingListHandler', () => {
  const createDay = (
    dateStr: string,
    expectedClimate = 'sunny',
    location = 'home'
  ): Day => ({
    date: new Date(dateStr).getTime(),
    expectedClimate,
    location,
    items: [],
    travel: false,
  });

  const createMockRule = (
    overrides: Partial<DefaultItemRule> = {}
  ): DefaultItemRule => ({
    id: 'rule1',
    name: 'Test Item',
    calculation: {
      baseQuantity: 1,
      perPerson: false,
      perDay: false,
    },
    conditions: [],
    notes: '',
    categoryId: '',
    subcategoryId: '',
    packIds: [],
    originalRuleId: 'original-rule-1',
    ...overrides,
  });

  const createMockState = (
    rules: DefaultItemRule[] = [],
    people: Person[] = [],
    days: Day[] = []
  ): StoreType => {
    const state = createTestTripState({ people });
    const tripId = state.trips.selectedTripId!;

    // Update with provided test data - set defaultItemRules in the trip data
    state.trips.byId[tripId].trip.defaultItemRules = rules;
    state.trips.byId[tripId].trip.days = days;
    state.trips.byId[tripId].people = people;
    state.trips.byId[tripId].calculated.packingListItems = [];
    state.trips.byId[tripId].calculated.defaultItems = [];

    return state;
  };

  it('should handle empty state', () => {
    const state = createMockState();
    const result = calculatePackingListHandler(state);
    const tripId = result.trips.selectedTripId!;
    expect(result.trips.byId[tripId].calculated.packingListItems).toEqual([]);
  });

  it('should create basic items without conditions', () => {
    const state = createMockState(
      [
        createMockRule({
          id: 'rule1',
          name: 'Toothbrush',
          calculation: {
            baseQuantity: 1,
            perPerson: true,
            perDay: false,
          },
        }),
      ],
      [
        createTestPerson({
          id: 'person1',
          name: 'Alice',
          age: 25,
          gender: 'female',
        }),
        createTestPerson({
          id: 'person2',
          name: 'Bob',
          age: 30,
          gender: 'male',
        }),
      ],
      [createDay('2024-01-01'), createDay('2024-01-02')]
    );

    const result = calculatePackingListHandler(state);
    const tripId = result.trips.selectedTripId!;
    const packingListItems =
      result.trips.byId[tripId].calculated.packingListItems;
    expect(packingListItems).toHaveLength(2); // One for each person
    expect(packingListItems[0].name).toContain('Toothbrush');
    expect(packingListItems[0].personName).toBe('Alice');
    expect(packingListItems[1].personName).toBe('Bob');
  });

  it('should handle person conditions', () => {
    const state = createMockState(
      [
        createMockRule({
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
        }),
      ],
      [
        createTestPerson({
          id: 'person1',
          name: 'Child',
          age: 10,
          gender: 'other',
        }),
        createTestPerson({
          id: 'person2',
          name: 'Adult',
          age: 30,
          gender: 'other',
        }),
      ],
      [createDay('2024-01-01')]
    );

    const result = calculatePackingListHandler(state);
    const tripId = result.trips.selectedTripId!;
    const packingListItems =
      result.trips.byId[tripId].calculated.packingListItems;
    expect(packingListItems).toHaveLength(1); // Only for the adult
    expect(packingListItems[0].personName).toBe('Adult');
  });

  it('should handle day conditions', () => {
    const state = createMockState(
      [
        createMockRule({
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
        }),
      ],
      [
        createTestPerson({
          id: 'person1',
          name: 'Alice',
          age: 25,
          gender: 'female',
        }),
      ],
      [
        createDay('2024-01-01', 'sunny'),
        createDay('2024-01-02', 'rainy'),
        createDay('2024-01-03', 'sunny'),
      ]
    );

    const result = calculatePackingListHandler(state);
    const tripId = result.trips.selectedTripId!;
    const packingListItems =
      result.trips.byId[tripId].calculated.packingListItems;
    expect(packingListItems).toHaveLength(2); // Only for sunny days
    expect(packingListItems[0].dayIndex).toBe(0);
    expect(packingListItems[1].dayIndex).toBe(2);
  });

  // TODO: Overrides is not fleshed out yet.
  it.skip('should handle rule overrides', () => {
    const state = createMockState(
      [
        createMockRule({
          id: 'rule1',
          name: 'Socks',
          calculation: {
            baseQuantity: 1,
            perPerson: true,
            perDay: false,
          },
        }),
      ],
      [
        createTestPerson({
          id: 'person1',
          name: 'Alice',
          age: 25,
          gender: 'female',
        }),
        createTestPerson({
          id: 'person2',
          name: 'Bob',
          age: 30,
          gender: 'male',
        }),
      ],
      [createDay('2024-01-01')]
    );

    const result = calculatePackingListHandler(state);
    const tripId = result.trips.selectedTripId!;
    const aliceItems = result.trips.byId[
      tripId
    ].calculated.packingListItems.filter((item) => item.personId === 'person1');
    const bobItems = result.trips.byId[
      tripId
    ].calculated.packingListItems.filter((item) => item.personId === 'person2');

    expect(aliceItems[0].quantity).toBe(3); // Overridden
    expect(bobItems[0].quantity).toBe(1); // Default
  });

  it('should preserve packed status from existing items', () => {
    const initialState = createMockState(
      [
        createMockRule({
          id: 'rule1',
          name: 'Toothbrush',
          calculation: {
            baseQuantity: 1,
            perPerson: true,
            perDay: false,
          },
        }),
      ],
      [
        createTestPerson({
          id: 'person1',
          name: 'Alice',
          age: 25,
          gender: 'female',
        }),
      ],
      [createDay('2024-01-01')]
    );

    // First calculation
    const firstResult = calculatePackingListHandler(initialState);
    const tripId = firstResult.trips.selectedTripId!;

    // Mark item as packed
    const stateWithPackedItems: StoreType = {
      ...firstResult,
      trips: {
        ...firstResult.trips,
        byId: {
          ...firstResult.trips.byId,
          [tripId]: {
            ...firstResult.trips.byId[tripId],
            calculated: {
              ...firstResult.trips.byId[tripId].calculated,
              packingListItems: [
                {
                  ...firstResult.trips.byId[tripId].calculated
                    .packingListItems[0],
                  isPacked: true,
                },
              ],
            },
          },
        },
      },
    };

    // Recalculate
    const result = calculatePackingListHandler(stateWithPackedItems);
    const resultTripId = result.trips.selectedTripId!;
    expect(
      result.trips.byId[resultTripId].calculated.packingListItems[0].isPacked
    ).toBe(true);
  });

  it('should handle day patterns correctly', () => {
    const state = createMockState(
      [
        createMockRule({
          id: 'rule1',
          name: 'Laundry',
          calculation: {
            baseQuantity: 1,
            perPerson: true,
            perDay: true,
            daysPattern: {
              every: 3,
              roundUp: true,
            },
          },
        }),
      ],
      [
        createTestPerson({
          id: 'person1',
          name: 'Alice',
          age: 25,
          gender: 'female',
        }),
      ],
      [
        createDay('2024-01-01'),
        createDay('2024-01-02'),
        createDay('2024-01-03'),
        createDay('2024-01-04'),
        createDay('2024-01-05'),
      ]
    );

    const result = calculatePackingListHandler(state);
    const tripId = result.trips.selectedTripId!;
    const packingListItems =
      result.trips.byId[tripId].calculated.packingListItems;
    expect(packingListItems).toHaveLength(2); // Should create 2 groups: days 1-3 and 4-5
    expect(packingListItems[0].dayStart).toBe(0);
    expect(packingListItems[0].dayEnd).toBe(2);
    expect(packingListItems[1].dayStart).toBe(3);
    expect(packingListItems[1].dayEnd).toBe(4);
  });
});

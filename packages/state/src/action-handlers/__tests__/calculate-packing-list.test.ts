import { describe, it, expect } from 'vitest';
import { calculatePackingListHandler } from '../calculate-packing-list.js';
import { StoreType, initialState } from '../../store.js';
import { DefaultItemRule, Person, Day } from '@packing-list/model';

describe('calculatePackingListHandler', () => {
  it('should calculate items for multiple people and days', () => {
    const people: Person[] = [
      {
        id: 'person1',
        name: 'Adult 1',
        age: 30,
        gender: 'male',
      },
      {
        id: 'person2',
        name: 'Child 1',
        age: 5,
        gender: 'female',
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

    const rules: DefaultItemRule[] = [
      {
        id: 'swimsuit',
        name: 'Swimsuit',
        calculation: {
          baseQuantity: 1,
          perPerson: true,
        },
        conditions: [
          {
            type: 'day',
            field: 'expectedClimate',
            operator: '==',
            value: 'beach',
          },
        ],
      },
      {
        id: 'jacket',
        name: 'Warm Jacket',
        calculation: {
          baseQuantity: 1,
          perPerson: true,
        },
        conditions: [
          {
            type: 'day',
            field: 'expectedClimate',
            operator: '==',
            value: 'cold',
          },
        ],
      },
      {
        id: 'toothbrush',
        name: 'Toothbrush',
        calculation: {
          baseQuantity: 1,
          perPerson: true,
        },
      },
    ];

    const testState: StoreType = {
      ...initialState,
      people,
      trip: {
        ...initialState.trip,
        days,
      },
      defaultItemRules: rules,
    };

    const result = calculatePackingListHandler(testState);

    // Should have 6 items total:
    // - 2 swimsuits (1 per person for beach day)
    // - 2 jackets (1 per person for cold day)
    // - 2 toothbrushes (1 per person, no conditions)
    expect(result.calculated.packingListItems).toHaveLength(6);

    // Check swimsuits
    const swimsuits = result.calculated.packingListItems.filter(
      (item) => item.ruleId === 'swimsuit'
    );
    expect(swimsuits).toHaveLength(2);
    expect(swimsuits[0].dayIndex).toBe(0); // Beach day
    expect(swimsuits[1].dayIndex).toBe(0);

    // Check jackets
    const jackets = result.calculated.packingListItems.filter(
      (item) => item.ruleId === 'jacket'
    );
    expect(jackets).toHaveLength(2);
    expect(jackets[0].dayIndex).toBe(1); // Cold day
    expect(jackets[1].dayIndex).toBe(1);

    // Check toothbrushes
    const toothbrushes = result.calculated.packingListItems.filter(
      (item) => item.ruleId === 'toothbrush'
    );
    expect(toothbrushes).toHaveLength(2);
    expect(toothbrushes[0].dayIndex).toBeUndefined(); // No specific day
    expect(toothbrushes[1].dayIndex).toBeUndefined();
  });

  it('should handle age-based conditions', () => {
    const people: Person[] = [
      {
        id: 'adult1',
        name: 'Adult 1',
        age: 30,
        gender: 'male',
      },
      {
        id: 'child1',
        name: 'Child 1',
        age: 2,
        gender: 'female',
      },
    ];

    const rules: DefaultItemRule[] = [
      {
        id: 'diapers',
        name: 'Diapers',
        calculation: {
          baseQuantity: 5,
          perPerson: true,
          perDay: true,
        },
        conditions: [
          {
            type: 'person',
            field: 'age',
            operator: '<=',
            value: 3,
          },
        ],
      },
      {
        id: 'phone',
        name: 'Phone Charger',
        calculation: {
          baseQuantity: 1,
          perPerson: true,
        },
        conditions: [
          {
            type: 'person',
            field: 'age',
            operator: '>',
            value: 12,
          },
        ],
      },
    ];

    const days: Day[] = [
      {
        location: 'Home',
        expectedClimate: 'moderate',
        items: [],
        travel: false,
        date: 1,
      },
      {
        location: 'Home',
        expectedClimate: 'moderate',
        items: [],
        travel: false,
        date: 2,
      },
    ];

    const testState: StoreType = {
      ...initialState,
      people,
      trip: {
        ...initialState.trip,
        days,
      },
      defaultItemRules: rules,
    };

    const result = calculatePackingListHandler(testState);

    // Should have 3 items total:
    // - 2 diaper items for the child (1 per day)
    // - 1 phone charger for the adult
    expect(result.calculated.packingListItems).toHaveLength(3);

    // Check diapers
    const diapers = result.calculated.packingListItems.filter(
      (item) => item.ruleId === 'diapers'
    );
    expect(diapers).toHaveLength(2);
    expect(diapers[0].personId).toBe('child1');
    expect(diapers[1].personId).toBe('child1');
    expect(diapers[0].quantity).toBe(5);
    expect(diapers[1].quantity).toBe(5);

    // Check phone charger
    const chargers = result.calculated.packingListItems.filter(
      (item) => item.ruleId === 'phone'
    );
    expect(chargers).toHaveLength(1);
    expect(chargers[0].personId).toBe('adult1');
    expect(chargers[0].quantity).toBe(1);
  });

  it('should handle complex day patterns', () => {
    const people: Person[] = [
      {
        id: 'person1',
        name: 'Person 1',
        age: 30,
        gender: 'male',
      },
    ];

    const days: Day[] = Array.from({ length: 7 }, (_, i) => ({
      location: 'Home',
      expectedClimate: 'moderate',
      items: [],
      travel: false,
      date: i + 1,
    }));

    const rules: DefaultItemRule[] = [
      {
        id: 'laundry',
        name: 'Laundry Detergent',
        calculation: {
          baseQuantity: 1,
          daysPattern: {
            every: 3,
            roundUp: true,
          },
        },
      },
      {
        id: 'socks',
        name: 'Socks',
        calculation: {
          baseQuantity: 1,
          perPerson: true,
          perDay: true,
          daysPattern: {
            every: 2,
            roundUp: false,
          },
        },
      },
    ];

    const testState: StoreType = {
      ...initialState,
      people,
      trip: {
        ...initialState.trip,
        days,
      },
      defaultItemRules: rules,
    };

    const result = calculatePackingListHandler(testState);

    // Check laundry detergent
    // 7 days with every 3 days pattern (rounded up) = 3 items
    const laundry = result.calculated.packingListItems.filter(
      (item) => item.ruleId === 'laundry'
    );
    expect(laundry).toHaveLength(3);

    // Check socks
    // 7 days with every 2 days pattern (rounded down) = 3 items
    const socks = result.calculated.packingListItems.filter(
      (item) => item.ruleId === 'socks'
    );
    expect(socks).toHaveLength(3);
  });
});

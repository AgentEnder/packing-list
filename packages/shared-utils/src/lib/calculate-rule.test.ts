import { describe, it, expect } from 'vitest';
import {
  calculateItemQuantity,
  calculateNumDaysMeetingCondition,
  calculateNumPeopleMeetingCondition,
  calculateRuleTotal,
  compare,
} from './calculate-rule.js';
import type { DefaultItemRule, Person, Day } from '@packing-list/model';

describe('calculate-rule utilities', () => {
  it('compare handles numeric and array operators', () => {
    expect(compare(3, '>', 2)).toBe(true);
    expect(compare(3, '<', 2)).toBe(false);
    expect(compare(['a', 'b'], 'in', 'a')).toBe(true);
    expect(compare('a', 'in', ['a', 'b'])).toBe(true);
  });

  it('calculates item quantity with per person and per day flags', () => {
    const qty = calculateItemQuantity(
      1,
      true,
      true,
      { every: 2, roundUp: true },
      3,
      5
    );
    // perPerson multiplies by people (3) and perDay multiplies by daysPattern result ceil(5/2)=3
    expect(qty).toBe(9);
  });

  it('counts people and days meeting conditions', () => {
    const people: Person[] = [
      {
        id: '1',
        tripId: 't',
        name: 'Alice',
        createdAt: '',
        updatedAt: '',
        version: 1,
        isDeleted: false,
        age: 20,
      },
      {
        id: '2',
        tripId: 't',
        name: 'Bob',
        createdAt: '',
        updatedAt: '',
        version: 1,
        isDeleted: false,
        age: 30,
      },
    ];
    const days: Day[] = [
      {
        location: 'a',
        expectedClimate: 'hot',
        items: [],
        travel: false,
        date: 1,
      },
      {
        location: 'b',
        expectedClimate: 'cold',
        items: [],
        travel: false,
        date: 2,
      },
    ];
    const peopleCount = calculateNumPeopleMeetingCondition(people, [
      { type: 'person', field: 'age', operator: '>', value: 25 },
    ]);
    const daysCount = calculateNumDaysMeetingCondition(days, [
      { type: 'day', field: 'expectedClimate', operator: '==', value: 'hot' },
    ]);
    expect(peopleCount).toBe(1);
    expect(daysCount).toBe(1);
  });

  it('calculates rule total with extra items and conditions', () => {
    const rule: DefaultItemRule = {
      id: 'r1',
      originalRuleId: 'r1',
      name: 'Socks',
      calculation: {
        baseQuantity: 1,
        perPerson: true,
        perDay: true,
        daysPattern: { every: 1, roundUp: true },
        extraItems: { quantity: 2, perPerson: false, perDay: false },
      },
      conditions: [
        { type: 'person', field: 'age', operator: '>=', value: 18 },
        {
          type: 'day',
          field: 'expectedClimate',
          operator: '==',
          value: 'cold',
        },
      ],
    };
    const people: Person[] = [
      {
        id: '1',
        tripId: 't',
        name: 'Alice',
        age: 20,
        createdAt: '',
        updatedAt: '',
        version: 1,
        isDeleted: false,
      },
      {
        id: '2',
        tripId: 't',
        name: 'Bob',
        age: 16,
        createdAt: '',
        updatedAt: '',
        version: 1,
        isDeleted: false,
      },
    ];
    const days: Day[] = [
      {
        location: 'a',
        expectedClimate: 'cold',
        items: [],
        travel: false,
        date: 1,
      },
      {
        location: 'b',
        expectedClimate: 'warm',
        items: [],
        travel: false,
        date: 2,
      },
    ];

    const total = calculateRuleTotal(rule, people, days);
    // Only Alice and first day meet conditions => people=1 days=1
    // baseQuantity 1 * 1 * 1 =1 ; extra items 2
    expect(total).toBe(3);
  });
});

import { describe, it, expect } from 'vitest';
import {
  compare,
  calculateNumPeopleMeetingCondition,
  calculateNumDaysMeetingCondition,
} from '@packing-list/shared-utils';
import type { Condition, Person, Day } from './index.js';

const people: Person[] = [
  {
    id: '1',
    tripId: 't1',
    name: 'Alice',
    age: 25,
    gender: 'female',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    version: 1,
    isDeleted: false,
  },
  {
    id: '2',
    tripId: 't1',
    name: 'Bob',
    age: 30,
    gender: 'male',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    version: 1,
    isDeleted: false,
  },
];

const days: Day[] = [
  {
    location: 'Beach',
    expectedClimate: 'warm',
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

describe('compare helper', () => {
  it('handles equality and inequality', () => {
    expect(compare(1, '==', 1)).toBe(true);
    expect(compare(1, '!=', 2)).toBe(true);
  });

  it('handles numeric comparisons', () => {
    expect(compare(2, '>', 1)).toBe(true);
    expect(compare(1, '<', 2)).toBe(true);
    expect(compare(2, '>=', 2)).toBe(true);
    expect(compare(1, '<=', 1)).toBe(true);
  });

  it('handles "in" comparisons', () => {
    expect(compare('a', 'in', ['a', 'b'])).toBe(true);
    expect(compare(['a', 'b'], 'in', 'a')).toBe(true);
  });
});

describe('calculateNumPeopleMeetingCondition', () => {
  it('counts people satisfying conditions', () => {
    const conditions: Condition[] = [
      { type: 'person', field: 'gender', operator: '==', value: 'female' },
    ];
    expect(calculateNumPeopleMeetingCondition(people, conditions)).toBe(1);
  });

  it('returns zero when no one matches', () => {
    const conditions: Condition[] = [
      { type: 'person', field: 'age', operator: '>', value: 40 },
    ];
    expect(calculateNumPeopleMeetingCondition(people, conditions)).toBe(0);
  });
});

describe('calculateNumDaysMeetingCondition', () => {
  it('counts days satisfying conditions', () => {
    const conditions: Condition[] = [
      { type: 'day', field: 'expectedClimate', operator: '==', value: 'warm' },
    ];
    expect(calculateNumDaysMeetingCondition(days, conditions)).toBe(1);
  });

  it('returns zero when no days match', () => {
    const conditions: Condition[] = [
      { type: 'day', field: 'location', operator: '==', value: 'Desert' },
    ];
    expect(calculateNumDaysMeetingCondition(days, conditions)).toBe(0);
  });
});

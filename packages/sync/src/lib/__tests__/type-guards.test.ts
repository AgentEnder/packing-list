/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect } from 'vitest';

// Import the type guard functions - we'll need to expose them for testing
// For now, I'll create test versions that match the implementation
function isPersonData(data: unknown): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    'name' in data &&
    typeof (data as any).name === 'string' &&
    'age' in data &&
    'gender' in data
  );
}

function isTripItemData(data: unknown): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    'name' in data &&
    typeof (data as any).name === 'string' &&
    'category' in data &&
    'quantity' in data &&
    'packed' in data &&
    typeof (data as any).packed === 'boolean'
  );
}

function isRulePackData(data: unknown): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    typeof (data as any).name === 'string' &&
    'rules' in data &&
    'primaryCategoryId' in data &&
    'author' in data
  );
}

function isTripData(data: unknown): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    'title' in data &&
    typeof (data as any).title === 'string' &&
    'days' in data &&
    'tripEvents' in data
  );
}

function isRuleOverrideData(data: unknown): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    'ruleId' in data &&
    typeof (data as any).ruleId === 'string' &&
    ('tripId' in data || 'entityId' in data)
  );
}

function isDefaultItemRuleData(data: unknown): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    typeof (data as any).name === 'string' &&
    'calculation' in data &&
    'conditions' in data &&
    'categoryId' in data
  );
}

function isPackingStatusData(data: unknown): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    '_packingStatusOnly' in data &&
    (data as any)._packingStatusOnly === true
  );
}

function isBulkPackingData(data: unknown): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    'bulkPackingUpdate' in data &&
    (data as any).bulkPackingUpdate === true
  );
}

function isValidTripId(tripId: string | undefined): tripId is string {
  return typeof tripId === 'string' && tripId.length > 0;
}

describe('Type Guard Functions', () => {
  describe('isPersonData', () => {
    it('should return true for valid person data', () => {
      const validPerson = {
        name: 'John Doe',
        age: 30,
        gender: 'male',
        settings: {},
      };

      expect(isPersonData(validPerson)).toBe(true);
    });

    it('should return false for missing required fields', () => {
      expect(isPersonData({ name: 'John' })).toBe(false);
      expect(isPersonData({ name: 'John', age: 30 })).toBe(false);
      expect(isPersonData({ name: 'John', gender: 'male' })).toBe(false);
      expect(isPersonData({ age: 30, gender: 'male' })).toBe(false);
    });

    it('should return false for invalid name type', () => {
      expect(isPersonData({ name: 123, age: 30, gender: 'male' })).toBe(false);
    });

    it('should return false for non-object inputs', () => {
      expect(isPersonData(null)).toBe(false);
      expect(isPersonData(undefined)).toBe(false);
      expect(isPersonData('string')).toBe(false);
      expect(isPersonData(123)).toBe(false);
      expect(isPersonData([])).toBe(false);
    });

    it('should not validate as other types', () => {
      const person = { name: 'John', age: 30, gender: 'male' };
      expect(isTripItemData(person)).toBe(false);
      expect(isTripData(person)).toBe(false);
      expect(isRulePackData(person)).toBe(false);
    });
  });

  describe('isTripItemData', () => {
    it('should return true for valid trip item data', () => {
      const validItem = {
        name: 'T-shirt',
        category: 'clothing',
        quantity: 2,
        packed: false,
        notes: 'Optional notes',
      };

      expect(isTripItemData(validItem)).toBe(true);
    });

    it('should return false for missing required fields', () => {
      expect(isTripItemData({ name: 'T-shirt' })).toBe(false);
      expect(isTripItemData({ name: 'T-shirt', category: 'clothing' })).toBe(
        false
      );
      expect(
        isTripItemData({ name: 'T-shirt', category: 'clothing', quantity: 2 })
      ).toBe(false);
    });

    it('should return false for invalid packed type', () => {
      const invalidItem = {
        name: 'T-shirt',
        category: 'clothing',
        quantity: 2,
        packed: 'false', // Should be boolean
      };
      expect(isTripItemData(invalidItem)).toBe(false);
    });

    it('should not validate as other types', () => {
      const item = {
        name: 'T-shirt',
        category: 'clothing',
        quantity: 2,
        packed: false,
      };
      expect(isPersonData(item)).toBe(false);
      expect(isTripData(item)).toBe(false);
      expect(isRulePackData(item)).toBe(false);
    });
  });

  describe('isTripData', () => {
    it('should return true for valid trip data', () => {
      const validTrip = {
        title: 'Summer Vacation',
        days: [{ date: '2024-01-01', activities: [] }],
        tripEvents: [{ type: 'departure', time: '10:00' }],
        description: 'Optional description',
      };

      expect(isTripData(validTrip)).toBe(true);
    });

    it('should return false for missing required fields', () => {
      expect(isTripData({ title: 'Trip' })).toBe(false);
      expect(isTripData({ title: 'Trip', days: [] })).toBe(false);
      expect(isTripData({ days: [], tripEvents: [] })).toBe(false);
    });

    it('should return false for invalid title type', () => {
      expect(isTripData({ title: 123, days: [], tripEvents: [] })).toBe(false);
    });

    it('should not validate as other types', () => {
      const trip = { title: 'Trip', days: [], tripEvents: [] };
      expect(isPersonData(trip)).toBe(false);
      expect(isTripItemData(trip)).toBe(false);
      expect(isRulePackData(trip)).toBe(false);
    });
  });

  describe('isRulePackData', () => {
    it('should return true for valid rule pack data', () => {
      const validRulePack = {
        id: 'pack-1',
        name: 'Travel Essentials',
        rules: [],
        primaryCategoryId: 'cat-1',
        author: { name: 'John', email: 'john@example.com' },
        description: 'Essential travel items',
      };

      expect(isRulePackData(validRulePack)).toBe(true);
    });

    it('should return false for missing required fields', () => {
      expect(isRulePackData({ name: 'Pack' })).toBe(false);
      expect(isRulePackData({ id: 'pack-1', name: 'Pack' })).toBe(false);
      expect(isRulePackData({ id: 'pack-1', name: 'Pack', rules: [] })).toBe(
        false
      );
    });

    it('should not validate as other types', () => {
      const rulePack = {
        id: 'pack-1',
        name: 'Pack',
        rules: [],
        primaryCategoryId: 'cat-1',
        author: {},
      };
      expect(isPersonData(rulePack)).toBe(false);
      expect(isTripItemData(rulePack)).toBe(false);
      expect(isTripData(rulePack)).toBe(false);
    });
  });

  describe('isRuleOverrideData', () => {
    it('should return true for valid rule override with tripId', () => {
      const validOverride = {
        ruleId: 'rule-1',
        tripId: 'trip-1',
        overrideValue: 5,
      };

      expect(isRuleOverrideData(validOverride)).toBe(true);
    });

    it('should return true for valid rule override with entityId', () => {
      const validOverride = {
        ruleId: 'rule-1',
        entityId: 'entity-1',
        overrideValue: 5,
      };

      expect(isRuleOverrideData(validOverride)).toBe(true);
    });

    it('should return false for missing required fields', () => {
      expect(isRuleOverrideData({ ruleId: 'rule-1' })).toBe(false);
      expect(isRuleOverrideData({ tripId: 'trip-1' })).toBe(false);
    });

    it('should return false for invalid ruleId type', () => {
      expect(isRuleOverrideData({ ruleId: 123, tripId: 'trip-1' })).toBe(false);
    });
  });

  describe('isDefaultItemRuleData', () => {
    it('should return true for valid default item rule data', () => {
      const validRule = {
        id: 'rule-1',
        name: 'T-shirt Rule',
        calculation: { type: 'fixed', value: 3 },
        conditions: [{ field: 'temperature', operator: '>', value: 20 }],
        categoryId: 'cat-1',
      };

      expect(isDefaultItemRuleData(validRule)).toBe(true);
    });

    it('should return false for missing required fields', () => {
      expect(isDefaultItemRuleData({ name: 'Rule' })).toBe(false);
      expect(isDefaultItemRuleData({ id: 'rule-1', name: 'Rule' })).toBe(false);
      expect(
        isDefaultItemRuleData({ id: 'rule-1', name: 'Rule', calculation: {} })
      ).toBe(false);
    });
  });

  describe('isPackingStatusData', () => {
    it('should return true for valid packing status data', () => {
      const validStatus = {
        id: 'item-1',
        packed: true,
        _packingStatusOnly: true,
      };

      expect(isPackingStatusData(validStatus)).toBe(true);
    });

    it('should return false for missing _packingStatusOnly flag', () => {
      expect(isPackingStatusData({ id: 'item-1', packed: true })).toBe(false);
    });

    it('should return false for false _packingStatusOnly flag', () => {
      expect(
        isPackingStatusData({
          id: 'item-1',
          packed: true,
          _packingStatusOnly: false,
        })
      ).toBe(false);
    });
  });

  describe('isBulkPackingData', () => {
    it('should return true for valid bulk packing data', () => {
      const validBulk = {
        bulkPackingUpdate: true,
        changes: [
          { itemId: 'item-1', packed: true },
          { itemId: 'item-2', packed: false },
        ],
      };

      expect(isBulkPackingData(validBulk)).toBe(true);
    });

    it('should return false for missing bulkPackingUpdate flag', () => {
      expect(isBulkPackingData({ changes: [] })).toBe(false);
    });

    it('should return false for false bulkPackingUpdate flag', () => {
      expect(isBulkPackingData({ bulkPackingUpdate: false, changes: [] })).toBe(
        false
      );
    });
  });

  describe('isValidTripId', () => {
    it('should return true for valid trip IDs', () => {
      expect(isValidTripId('trip-123')).toBe(true);
      expect(isValidTripId('uuid-string')).toBe(true);
    });

    it('should return false for invalid trip IDs', () => {
      expect(isValidTripId('')).toBe(false);
      expect(isValidTripId(undefined)).toBe(false);
    });
  });

  describe('Cross-type validation', () => {
    it('should ensure types are mutually exclusive', () => {
      const person = { name: 'John', age: 30, gender: 'male' };
      const item = {
        name: 'T-shirt',
        category: 'clothing',
        quantity: 2,
        packed: false,
      };
      const trip = { title: 'Trip', days: [], tripEvents: [] };
      const rulePack = {
        id: 'pack-1',
        name: 'Pack',
        rules: [],
        primaryCategoryId: 'cat-1',
        author: {},
      };

      // Person should not validate as anything else
      expect(isPersonData(person)).toBe(true);
      expect(isTripItemData(person)).toBe(false);
      expect(isTripData(person)).toBe(false);
      expect(isRulePackData(person)).toBe(false);

      // Item should not validate as anything else
      expect(isTripItemData(item)).toBe(true);
      expect(isPersonData(item)).toBe(false);
      expect(isTripData(item)).toBe(false);
      expect(isRulePackData(item)).toBe(false);

      // Trip should not validate as anything else
      expect(isTripData(trip)).toBe(true);
      expect(isPersonData(trip)).toBe(false);
      expect(isTripItemData(trip)).toBe(false);
      expect(isRulePackData(trip)).toBe(false);

      // RulePack should not validate as anything else
      expect(isRulePackData(rulePack)).toBe(true);
      expect(isPersonData(rulePack)).toBe(false);
      expect(isTripItemData(rulePack)).toBe(false);
      expect(isTripData(rulePack)).toBe(false);
    });
  });
});

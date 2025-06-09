import { describe, expect, it } from 'vitest';
import {
  formatDayInfo,
  splitInstancesByExtraStatus,
  getItemLabel,
  getQuantityLabel,
  type ItemInstance,
} from './item-formatting';

describe('item-formatting utilities', () => {
  describe('formatDayInfo', () => {
    const mockDays = [
      { date: '2024-01-15', location: 'Paris' },
      { date: '2024-01-16', location: 'London' },
      { date: '2024-01-17' },
      { date: 1705363200000 }, // timestamp
    ];

    it('returns undefined when dayIndex is undefined', () => {
      const result = formatDayInfo({}, mockDays);
      expect(result).toBeUndefined();
    });

    it('returns undefined when day is not found', () => {
      const result = formatDayInfo({ dayIndex: 10 }, mockDays);
      expect(result).toBeUndefined();
    });

    it('formats single day with location', () => {
      const result = formatDayInfo({ dayIndex: 0 }, mockDays);
      expect(result).toBe('Day 1 - Jan 14 (Paris)');
    });

    it('formats single day without location', () => {
      const result = formatDayInfo({ dayIndex: 2 }, mockDays);
      expect(result).toBe('Day 3 - Jan 16');
    });

    it('formats day range when dayStart and dayEnd are different', () => {
      const result = formatDayInfo(
        { dayIndex: 0, dayStart: 0, dayEnd: 2 },
        mockDays
      );
      expect(result).toBe('Days 1-3');
    });

    it('formats single day when dayStart equals dayEnd', () => {
      const result = formatDayInfo(
        { dayIndex: 0, dayStart: 0, dayEnd: 0 },
        mockDays
      );
      expect(result).toBe('Day 1 - Jan 14 (Paris)');
    });

    it('handles timestamp dates', () => {
      const result = formatDayInfo({ dayIndex: 3 }, mockDays);
      expect(result).toBe('Day 4 - Jan 15');
    });

    it('handles dayStart without dayEnd', () => {
      const result = formatDayInfo({ dayIndex: 0, dayStart: 0 }, mockDays);
      expect(result).toBe('Day 1 - Jan 14 (Paris)');
    });

    it('handles dayEnd without dayStart', () => {
      const result = formatDayInfo({ dayIndex: 0, dayEnd: 0 }, mockDays);
      expect(result).toBe('Day 1 - Jan 14 (Paris)');
    });
  });

  describe('splitInstancesByExtraStatus', () => {
    const mockInstances: ItemInstance[] = [
      {
        id: '1',
        name: 'Shirt',
        itemName: 'Shirt',
        ruleId: 'rule1',
        ruleHash: 'hash1',
        quantity: 1,
        isExtra: false,
        isPacked: false,
        isOverridden: false,
        personId: 'person1',
        personName: 'John',
        dayIndex: 0,
      },
      {
        id: '2',
        name: 'Extra Shirt',
        itemName: 'Extra Shirt',
        ruleId: 'rule2',
        ruleHash: 'hash2',
        quantity: 1,
        isExtra: true,
        isPacked: false,
        isOverridden: false,
        personId: 'person1',
        personName: 'John',
        dayIndex: 0,
      },
      {
        id: '3',
        name: 'Pants',
        itemName: 'Pants',
        ruleId: 'rule3',
        ruleHash: 'hash3',
        quantity: 1,
        isExtra: false,
        isPacked: true,
        isOverridden: false,
        personId: 'person2',
        personName: 'Jane',
        dayIndex: 1,
      },
    ];

    it('splits instances by extra status', () => {
      const result = splitInstancesByExtraStatus(mockInstances);

      expect(result.baseItems).toHaveLength(2);
      expect(result.extraItems).toHaveLength(1);

      expect(result.baseItems[0].itemName).toBe('Shirt');
      expect(result.baseItems[1].itemName).toBe('Pants');
      expect(result.extraItems[0].itemName).toBe('Extra Shirt');
    });

    it('handles empty array', () => {
      const result = splitInstancesByExtraStatus([]);

      expect(result.baseItems).toHaveLength(0);
      expect(result.extraItems).toHaveLength(0);
    });

    it('handles all base items', () => {
      const baseOnlyItems = mockInstances.filter((i) => !i.isExtra);
      const result = splitInstancesByExtraStatus(baseOnlyItems);

      expect(result.baseItems).toHaveLength(2);
      expect(result.extraItems).toHaveLength(0);
    });

    it('handles all extra items', () => {
      const extraOnlyItems = mockInstances.filter((i) => i.isExtra);
      const result = splitInstancesByExtraStatus(extraOnlyItems);

      expect(result.baseItems).toHaveLength(0);
      expect(result.extraItems).toHaveLength(1);
    });
  });

  describe('getItemLabel', () => {
    const mockItem: ItemInstance = {
      id: '1',
      name: 'Hiking Boots',
      itemName: 'Hiking Boots',
      ruleId: 'rule1',
      ruleHash: 'hash1',
      quantity: 1,
      isExtra: false,
      isPacked: false,
      isOverridden: false,
      personId: 'person1',
      personName: 'Adventure Alice',
      dayIndex: 2,
    };

    it('shows person name in by-day view mode', () => {
      const result = getItemLabel(mockItem, 'by-day');
      expect(result).toBe('Adventure Alice');
    });

    it('shows "General" when no person name in by-day view', () => {
      const itemWithoutPerson = { ...mockItem, personName: undefined };
      const result = getItemLabel(itemWithoutPerson, 'by-day');
      expect(result).toBe('General');
    });

    it('shows item name with day info in by-person view', () => {
      const result = getItemLabel(mockItem, 'by-person');
      expect(result).toBe('Hiking Boots (Day 3)');
    });

    it('shows item name without day info when dayIndex is undefined in by-person view', () => {
      const itemWithoutDay = { ...mockItem, dayIndex: undefined };
      const result = getItemLabel(itemWithoutDay, 'by-person');
      expect(result).toBe('Hiking Boots');
    });

    it('handles empty item name', () => {
      const itemWithoutName = { ...mockItem, itemName: '' };
      const result = getItemLabel(itemWithoutName, 'by-person');
      expect(result).toBe(' (Day 3)');
    });

    it('handles null item name', () => {
      const itemWithNullName = {
        ...mockItem,
        itemName: null as unknown as string,
      };
      const result = getItemLabel(itemWithNullName, 'by-person');
      expect(result).toBe(' (Day 3)');
    });
  });

  describe('getQuantityLabel', () => {
    it('returns empty string for quantity 1', () => {
      const result = getQuantityLabel(1);
      expect(result).toBe('');
    });

    it('returns quantity label for quantity greater than 1', () => {
      const result = getQuantityLabel(3);
      expect(result).toBe(' - 3 needed');
    });

    it('handles quantity 0', () => {
      const result = getQuantityLabel(0);
      expect(result).toBe('');
    });

    it('handles large quantities', () => {
      const result = getQuantityLabel(100);
      expect(result).toBe(' - 100 needed');
    });

    it('handles quantity 2 (edge case)', () => {
      const result = getQuantityLabel(2);
      expect(result).toBe(' - 2 needed');
    });
  });
});

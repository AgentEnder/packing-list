import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ItemStorage } from '../item-storage.js';
import { initializeDatabase, closeDatabase } from '../database.js';
import type { TripItem } from '@packing-list/model';

describe('ItemStorage', () => {
  beforeEach(async () => {
    // Initialize fresh database for each test
    await initializeDatabase();
  });

  afterEach(async () => {
    // Clean up database after each test
    await closeDatabase();
  });

  it('should save and retrieve an item', async () => {
    const item: TripItem = {
      id: 'test-item-abc123',
      name: 'Test Item',
      tripId: 'test-trip-abc123',
      packed: false,
      dayIndex: 0,
      personId: 'test-person-abc123',
      notes: 'Test notes',
      quantity: 1,
      category: 'clothing',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: 1,
      isDeleted: false,
    };

    await ItemStorage.saveItem(item);
    const tripItems = await ItemStorage.getTripItems('test-trip-abc123');

    expect(tripItems).toHaveLength(1);
    expect(tripItems[0]).toEqual(item);
  });

  it('should update an existing item', async () => {
    const item: TripItem = {
      id: 'test-item-abc123',
      name: 'Test Item',
      tripId: 'test-trip-abc123',
      packed: false,
      dayIndex: 0,
      personId: 'test-person-abc123',
      notes: 'Original notes',
      quantity: 1,
      category: 'clothing',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: 1,
      isDeleted: false,
    };

    await ItemStorage.saveItem(item);

    const updatedItem = {
      ...item,
      name: 'Updated Item',
      notes: 'Updated notes',
      packed: true,
      updatedAt: '2024-01-01T01:00:00.000Z',
      version: 2,
    };

    await ItemStorage.saveItem(updatedItem);
    const tripItems = await ItemStorage.getTripItems('test-trip-abc123');

    expect(tripItems).toHaveLength(1);
    expect(tripItems[0].name).toBe('Updated Item');
    expect(tripItems[0].notes).toBe('Updated notes');
    expect(tripItems[0].packed).toBe(true);
  });

  it('should soft delete an item', async () => {
    const item: TripItem = {
      id: 'test-item-abc123',
      name: 'Test Item',
      tripId: 'test-trip-abc123',
      packed: false,
      dayIndex: 0,
      personId: 'test-person-abc123',
      notes: 'Test notes',
      quantity: 1,
      category: 'clothing',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: 1,
      isDeleted: false,
    };

    await ItemStorage.saveItem(item);
    const itemsBeforeDelete = await ItemStorage.getTripItems('test-trip-abc123');
    expect(itemsBeforeDelete).toHaveLength(1);

    await ItemStorage.deleteItem('test-item-abc123');
    const itemsAfterDelete = await ItemStorage.getTripItems('test-trip-abc123');
    expect(itemsAfterDelete).toHaveLength(0);
  });

  it('should handle deletion of non-existent item', async () => {
    // Should not throw an error
    await expect(ItemStorage.deleteItem('non-existent')).resolves.not.toThrow();
  });

  it('should filter out deleted items when retrieving trip items', async () => {
    const item1: TripItem = {
      id: 'test-item-abc123',
      name: 'Active Item',
      tripId: 'test-trip-abc123',
      packed: false,
      dayIndex: 0,
      personId: 'test-person-abc123',
      notes: '',
      quantity: 1,
      category: 'clothing',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: 1,
      isDeleted: false,
    };

    const item2: TripItem = {
      id: 'test-item-def456',
      name: 'Deleted Item',
      tripId: 'test-trip-abc123',
      packed: true,
      dayIndex: 1,
      personId: 'test-person-def456',
      notes: '',
      quantity: 2,
      category: 'misc',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T01:00:00.000Z',
      version: 1,
      isDeleted: true,
    };

    await ItemStorage.saveItem(item1);
    await ItemStorage.saveItem(item2);

    const tripItems = await ItemStorage.getTripItems('test-trip-abc123');
    expect(tripItems).toHaveLength(1);
    expect(tripItems[0].name).toBe('Active Item');
  });

  it('should return empty array for trip with no items', async () => {
    const tripItems = await ItemStorage.getTripItems('non-existent-trip');
    expect(tripItems).toHaveLength(0);
    expect(tripItems).toEqual([]);
  });

  it('should handle multiple trips separately', async () => {
    const trip1Item: TripItem = {
      id: 'test-item-abc123',
      name: 'Trip 1 Item',
      tripId: 'test-trip-abc123',
      packed: false,
      dayIndex: 0,
      personId: 'test-person-abc123',
      notes: '',
      quantity: 1,
      category: 'clothing',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: 1,
      isDeleted: false,
    };

    const trip2Item: TripItem = {
      id: 'test-item-def456',
      name: 'Trip 2 Item',
      tripId: 'test-trip-def456',
      packed: true,
      dayIndex: 0,
      personId: 'test-person-def456',
      notes: '',
      quantity: 1,
      category: 'misc',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: 1,
      isDeleted: false,
    };

    await ItemStorage.saveItem(trip1Item);
    await ItemStorage.saveItem(trip2Item);

    const trip1Items = await ItemStorage.getTripItems('test-trip-abc123');
    const trip2Items = await ItemStorage.getTripItems('test-trip-def456');

    expect(trip1Items).toHaveLength(1);
    expect(trip1Items[0].name).toBe('Trip 1 Item');

    expect(trip2Items).toHaveLength(1);
    expect(trip2Items[0].name).toBe('Trip 2 Item');
  });
});

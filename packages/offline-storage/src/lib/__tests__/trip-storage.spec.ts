import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TripStorage } from '../trip-storage.js';
import { PersonStorage } from '../person-storage.js';
import { ItemStorage } from '../item-storage.js';
import { initializeDatabase, closeDatabase } from '../database.js';
import type { Trip, Person, TripItem } from '@packing-list/model';

describe('TripStorage', () => {
  beforeEach(async () => {
    // Initialize fresh database for each test
    await initializeDatabase();
  });

  afterEach(async () => {
    // Clean up database after each test
    await closeDatabase();
  });

  it('should save and retrieve a trip', async () => {
    const trip: Trip = {
      id: 'trip-1',
      userId: 'user-1',
      title: 'Test Trip',
      description: 'A test trip',
      days: [
        {
          location: 'Test Location',
          expectedClimate: 'temperate',
          items: [],
          travel: false,
          date: new Date('2024-01-01').getTime(),
        },
      ],
      lastSyncedAt: '2024-01-01T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: 1,
      isDeleted: false,
      settings: {
        defaultTimeZone: 'UTC',
        packingViewMode: 'by-day',
      },
    };

    await TripStorage.saveTrip(trip);
    const retrievedTrip = await TripStorage.getTrip('trip-1');

    expect(retrievedTrip).toEqual(trip);
  });

  it('should update an existing trip', async () => {
    const trip: Trip = {
      id: 'trip-1',
      userId: 'user-1',
      title: 'Test Trip',
      description: 'A test trip',
      days: [],
      lastSyncedAt: '2024-01-01T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: 1,
      isDeleted: false,
      settings: {
        defaultTimeZone: 'UTC',
        packingViewMode: 'by-day',
      },
    };

    await TripStorage.saveTrip(trip);

    const updatedTrip = {
      ...trip,
      title: 'Updated Trip',
      description: 'An updated test trip',
      updatedAt: '2024-01-01T01:00:00.000Z',
      version: 2,
    };

    await TripStorage.saveTrip(updatedTrip);
    const retrievedTrip = await TripStorage.getTrip('trip-1');

    expect(retrievedTrip?.title).toBe('Updated Trip');
    expect(retrievedTrip?.description).toBe('An updated test trip');
    expect(retrievedTrip?.version).toBe(2);
  });

  it('should return undefined for non-existent trip', async () => {
    const trip = await TripStorage.getTrip('non-existent');
    expect(trip).toBeUndefined();
  });

  it('should get user trips and filter deleted ones', async () => {
    const trip1: Trip = {
      id: 'trip-1',
      userId: 'user-1',
      title: 'Active Trip',
      description: '',
      days: [],
      lastSyncedAt: '2024-01-01T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: 1,
      isDeleted: false,
      settings: {
        defaultTimeZone: 'UTC',
        packingViewMode: 'by-day',
      },
    };

    const trip2: Trip = {
      id: 'trip-2',
      userId: 'user-1',
      title: 'Deleted Trip',
      description: '',
      days: [],
      lastSyncedAt: '2024-01-01T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T01:00:00.000Z',
      version: 1,
      isDeleted: true,
      settings: {
        defaultTimeZone: 'UTC',
        packingViewMode: 'by-day',
      },
    };

    const trip3: Trip = {
      id: 'trip-3',
      userId: 'user-2',
      title: 'Other User Trip',
      description: '',
      days: [],
      lastSyncedAt: '2024-01-01T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: 1,
      isDeleted: false,
      settings: {
        defaultTimeZone: 'UTC',
        packingViewMode: 'by-day',
      },
    };

    await TripStorage.saveTrip(trip1);
    await TripStorage.saveTrip(trip2);
    await TripStorage.saveTrip(trip3);

    const user1Trips = await TripStorage.getUserTrips('user-1');
    expect(user1Trips).toHaveLength(1);
    expect(user1Trips[0].title).toBe('Active Trip');

    const user2Trips = await TripStorage.getUserTrips('user-2');
    expect(user2Trips).toHaveLength(1);
    expect(user2Trips[0].title).toBe('Other User Trip');
  });

  it('should get user trip summaries', async () => {
    const trip: Trip = {
      id: 'trip-1',
      userId: 'user-1',
      title: 'Test Trip',
      description: 'A test trip',
      days: [],
      lastSyncedAt: '2024-01-01T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: 1,
      isDeleted: false,
      settings: {
        defaultTimeZone: 'UTC',
        packingViewMode: 'by-day',
      },
    };

    await TripStorage.saveTrip(trip);
    const summaries = await TripStorage.getUserTripSummaries('user-1');

    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({
      tripId: 'trip-1',
      title: 'Test Trip',
      description: 'A test trip',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      totalItems: 0,
      packedItems: 0,
      totalPeople: 0,
    });
  });

  it('should soft delete a trip', async () => {
    const trip: Trip = {
      id: 'trip-1',
      userId: 'user-1',
      title: 'Test Trip',
      description: '',
      days: [],
      lastSyncedAt: '2024-01-01T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: 1,
      isDeleted: false,
      settings: {
        defaultTimeZone: 'UTC',
        packingViewMode: 'by-day',
      },
    };

    await TripStorage.saveTrip(trip);
    const tripsBeforeDelete = await TripStorage.getUserTrips('user-1');
    expect(tripsBeforeDelete).toHaveLength(1);

    await TripStorage.deleteTrip('trip-1');
    const tripsAfterDelete = await TripStorage.getUserTrips('user-1');
    expect(tripsAfterDelete).toHaveLength(0);

    // Trip should still exist in database but marked as deleted
    const deletedTrip = await TripStorage.getTrip('trip-1');
    expect(deletedTrip?.isDeleted).toBe(true);
    expect(deletedTrip?.version).toBe(2);
  });

  it('should hard delete a trip and all related data', async () => {
    const trip: Trip = {
      id: 'trip-1',
      userId: 'user-1',
      title: 'Test Trip',
      description: '',
      days: [],
      lastSyncedAt: '2024-01-01T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: 1,
      isDeleted: false,
      settings: {
        defaultTimeZone: 'UTC',
        packingViewMode: 'by-day',
      },
    };

    const person: Person = {
      id: 'person-1',
      name: 'Alice',
      tripId: 'trip-1',
      age: 25,
      gender: 'female',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: 1,
      isDeleted: false,
    };

    const item: TripItem = {
      id: 'item-1',
      name: 'Test Item',
      tripId: 'trip-1',
      packed: false,
      dayIndex: 0,
      personId: 'person-1',
      notes: '',
      quantity: 1,
      category: 'clothing',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: 1,
      isDeleted: false,
    };

    await TripStorage.saveTrip(trip);
    await PersonStorage.savePerson(person);
    await ItemStorage.saveItem(item);

    // Verify data exists
    expect(await TripStorage.getTrip('trip-1')).toBeDefined();
    expect(await PersonStorage.getTripPeople('trip-1')).toHaveLength(1);
    expect(await ItemStorage.getTripItems('trip-1')).toHaveLength(1);

    await TripStorage.hardDeleteTrip('trip-1');

    // Verify all data is gone
    expect(await TripStorage.getTrip('trip-1')).toBeUndefined();
    expect(await PersonStorage.getTripPeople('trip-1')).toHaveLength(0);
    expect(await ItemStorage.getTripItems('trip-1')).toHaveLength(0);
  });

  it('should update last synced timestamp', async () => {
    const trip: Trip = {
      id: 'trip-1',
      userId: 'user-1',
      title: 'Test Trip',
      description: '',
      days: [],
      lastSyncedAt: '2024-01-01T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: 1,
      isDeleted: false,
      settings: {
        defaultTimeZone: 'UTC',
        packingViewMode: 'by-day',
      },
    };

    await TripStorage.saveTrip(trip);

    const originalLastSynced = trip.lastSyncedAt;

    // Wait a small amount to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 10));

    await TripStorage.updateLastSynced('trip-1');
    const updatedTrip = await TripStorage.getTrip('trip-1');

    expect(updatedTrip?.lastSyncedAt).not.toBe(originalLastSynced);
    if (updatedTrip?.lastSyncedAt) {
      expect(new Date(updatedTrip.lastSyncedAt)).toBeInstanceOf(Date);
    }
  });

  it('should identify trips needing sync', async () => {
    const recentlyUpdatedTrip: Trip = {
      id: 'trip-1',
      userId: 'user-1',
      title: 'Recently Updated',
      description: '',
      days: [],
      lastSyncedAt: '2024-01-01T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T01:00:00.000Z', // Updated after last sync
      version: 1,
      isDeleted: false,
      settings: {
        defaultTimeZone: 'UTC',
        packingViewMode: 'by-day',
      },
    };

    const neverSyncedTrip: Trip = {
      id: 'trip-2',
      userId: 'user-1',
      title: 'Never Synced',
      description: '',
      days: [],
      lastSyncedAt: '', // Never synced
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: 1,
      isDeleted: false,
      settings: {
        defaultTimeZone: 'UTC',
        packingViewMode: 'by-day',
      },
    };

    const upToDateTrip: Trip = {
      id: 'trip-3',
      userId: 'user-1',
      title: 'Up to Date',
      description: '',
      days: [],
      lastSyncedAt: '2024-01-01T02:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T01:00:00.000Z', // Updated before last sync
      version: 1,
      isDeleted: false,
      settings: {
        defaultTimeZone: 'UTC',
        packingViewMode: 'by-day',
      },
    };

    await TripStorage.saveTrip(recentlyUpdatedTrip);
    await TripStorage.saveTrip(neverSyncedTrip);
    await TripStorage.saveTrip(upToDateTrip);

    const tripsNeedingSync = await TripStorage.getTripsNeedingSync('user-1');

    expect(tripsNeedingSync).toHaveLength(2);
    const titles = tripsNeedingSync.map((t) => t.title);
    expect(titles).toContain('Recently Updated');
    expect(titles).toContain('Never Synced');
    expect(titles).not.toContain('Up to Date');
  });

  it('should handle empty user trips', async () => {
    const trips = await TripStorage.getUserTrips('non-existent-user');
    expect(trips).toHaveLength(0);
    expect(trips).toEqual([]);

    const summaries = await TripStorage.getUserTripSummaries(
      'non-existent-user'
    );
    expect(summaries).toHaveLength(0);
    expect(summaries).toEqual([]);
  });

  it('should handle deletion of non-existent trip', async () => {
    // Should not throw errors
    await expect(TripStorage.deleteTrip('non-existent')).resolves.not.toThrow();
    await expect(
      TripStorage.hardDeleteTrip('non-existent')
    ).resolves.not.toThrow();
    await expect(
      TripStorage.updateLastSynced('non-existent')
    ).resolves.not.toThrow();
  });
});

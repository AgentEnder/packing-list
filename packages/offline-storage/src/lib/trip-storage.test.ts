import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initializeDatabase, closeDatabase } from './database.js';
import { TripStorage } from './trip-storage.js';
import type { Trip } from '@packing-list/model';

const baseTrip: Trip = {
  id: 'trip-1',
  userId: 'user-1',
  title: 'My Trip',
  description: 'Demo',
  days: [],
  defaultItemRules: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  lastSyncedAt: '',
  version: 1,
  isDeleted: false,
  settings: { defaultTimeZone: 'UTC', packingViewMode: 'by-day' },
};

describe('TripStorage', () => {
  beforeEach(async () => {
    await initializeDatabase();
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('saves and retrieves a trip', async () => {
    await TripStorage.saveTrip(baseTrip);
    const result = await TripStorage.getTrip('trip-1');
    expect(result?.title).toBe('My Trip');
  });

  it('updates last synced timestamp', async () => {
    await TripStorage.saveTrip(baseTrip);
    const original = (await TripStorage.getTrip('trip-1'))!.lastSyncedAt;
    await TripStorage.updateLastSynced('trip-1');
    const updated = (await TripStorage.getTrip('trip-1'))!.lastSyncedAt;
    expect(updated).not.toBe(original);
  });

  it('returns trips needing sync', async () => {
    await TripStorage.saveTrip(baseTrip);
    await TripStorage.updateLastSynced('trip-1');
    const stale: Trip = {
      ...baseTrip,
      id: 'trip-2',
      updatedAt: new Date(Date.now() + 1000).toISOString(),
    };
    await TripStorage.saveTrip(stale);
    const toSync = await TripStorage.getTripsNeedingSync('user-1');
    expect(toSync.map((t) => t.id)).toContain('trip-2');
    expect(toSync.map((t) => t.id)).not.toContain('trip-1');
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initializeDatabase, closeDatabase, getDatabase } from './database.js';

describe('offline-storage', () => {
  beforeEach(async () => {
    await initializeDatabase();
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('should initialize database with correct schema', async () => {
    const db = await getDatabase();

    // Check that all expected object stores exist
    expect(db.objectStoreNames.contains('trips')).toBe(true);
    expect(db.objectStoreNames.contains('tripPeople')).toBe(true);
    expect(db.objectStoreNames.contains('tripItems')).toBe(true);
    expect(db.objectStoreNames.contains('syncChanges')).toBe(true);
    expect(db.objectStoreNames.contains('syncConflicts')).toBe(true);
    expect(db.objectStoreNames.contains('syncMetadata')).toBe(true);
    expect(db.objectStoreNames.contains('userPreferences')).toBe(true);
  });

  it('should have default user preferences', async () => {
    const db = await getDatabase();
    const preferences = await db.get('userPreferences', 'preferences');

    expect(preferences).toBeDefined();
    expect(preferences?.defaultTimeZone).toBe('UTC');
    expect(preferences?.theme).toBe('system');
    expect(preferences?.defaultTripDuration).toBe(7);
    expect(preferences?.autoSyncEnabled).toBe(true);
  });

  it('should have default sync metadata', async () => {
    const db = await getDatabase();
    const lastSyncTimestamp = await db.get('syncMetadata', 'lastSyncTimestamp');
    const deviceId = await db.get('syncMetadata', 'deviceId');

    expect(lastSyncTimestamp).toBe(0);
    expect(deviceId).toBeDefined();
    expect(typeof deviceId).toBe('string');
    expect(deviceId).toMatch(/^device_/);
  });
});

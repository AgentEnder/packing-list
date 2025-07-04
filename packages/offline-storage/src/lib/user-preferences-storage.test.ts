import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initializeDatabase, closeDatabase } from './database.js';
import { UserPreferencesStorage } from './user-preferences-storage.js';
import type { UserPreferences } from '@packing-list/model';

const prefs: UserPreferences = {
  defaultTimeZone: 'UTC',
  theme: 'system',
  defaultTripDuration: 5,
  autoSyncEnabled: true,
  serviceWorkerEnabled: false,
  lastSelectedTripId: null,
};

describe('UserPreferencesStorage', () => {
  beforeEach(async () => {
    await initializeDatabase();
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('saves and retrieves preferences', async () => {
    await UserPreferencesStorage.savePreferences(prefs);
    const result = await UserPreferencesStorage.getPreferences();
    expect(result?.defaultTripDuration).toBe(5);
  });

  it('updates last selected trip ID', async () => {
    await UserPreferencesStorage.savePreferences(prefs);
    await UserPreferencesStorage.updateLastSelectedTripId('trip-1');
    const id = await UserPreferencesStorage.getLastSelectedTripId();
    expect(id).toBe('trip-1');
  });
});

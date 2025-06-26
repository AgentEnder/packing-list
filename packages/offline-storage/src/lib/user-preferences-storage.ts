import { getDatabase } from './database.js';
import type { UserPreferences } from '@packing-list/model';
import { shouldSkipPersistence } from './demo-mode-detector.js';

/**
 * Storage class for managing user preferences in IndexedDB
 */
export class UserPreferencesStorage {
  /**
   * Get user preferences from IndexedDB
   */
  static async getPreferences(): Promise<UserPreferences | null> {
    if (shouldSkipPersistence()) {
      console.log(
        '🎭 [USER_PREFERENCES_STORAGE] Skipping persistence in demo mode'
      );
      return null;
    }

    try {
      const db = await getDatabase();
      const preferences = await db.get('userPreferences', 'preferences');

      console.log(
        '📖 [USER_PREFERENCES_STORAGE] Retrieved preferences:',
        preferences
      );
      return preferences || null;
    } catch (error) {
      console.error(
        '❌ [USER_PREFERENCES_STORAGE] Error getting preferences:',
        error
      );
      return null;
    }
  }

  /**
   * Save user preferences to IndexedDB
   */
  static async savePreferences(preferences: UserPreferences): Promise<void> {
    if (shouldSkipPersistence()) {
      console.log('🎭 [USER_PREFERENCES_STORAGE] Skipping save in demo mode');
      return;
    }

    try {
      const db = await getDatabase();
      await db.put('userPreferences', preferences, 'preferences');

      console.log(
        '💾 [USER_PREFERENCES_STORAGE] Saved preferences:',
        preferences
      );
    } catch (error) {
      console.error(
        '❌ [USER_PREFERENCES_STORAGE] Error saving preferences:',
        error
      );
      throw error;
    }
  }

  /**
   * Update the last selected trip ID
   */
  static async updateLastSelectedTripId(tripId: string | null): Promise<void> {
    if (shouldSkipPersistence()) {
      console.log(
        '🎭 [USER_PREFERENCES_STORAGE] Skipping trip ID update in demo mode'
      );
      return;
    }

    try {
      const currentPreferences = await this.getPreferences();

      // Create default preferences if none exist
      const defaultPreferences: UserPreferences = {
        defaultTimeZone: 'UTC',
        theme: 'system',
        defaultTripDuration: 7,
        autoSyncEnabled: true,
        serviceWorkerEnabled: false,
        lastSelectedTripId: null,
      };

      const updatedPreferences: UserPreferences = {
        ...defaultPreferences,
        ...currentPreferences,
        lastSelectedTripId: tripId, // Override with new value
      };

      await this.savePreferences(updatedPreferences);

      console.log(
        '🎯 [USER_PREFERENCES_STORAGE] Updated lastSelectedTripId:',
        tripId
      );
    } catch (error) {
      console.error(
        '❌ [USER_PREFERENCES_STORAGE] Error updating lastSelectedTripId:',
        error
      );
      throw error;
    }
  }

  /**
   * Get only the last selected trip ID
   */
  static async getLastSelectedTripId(): Promise<string | null> {
    try {
      const preferences = await this.getPreferences();
      const tripId = preferences?.lastSelectedTripId || null;

      console.log(
        '🎯 [USER_PREFERENCES_STORAGE] Retrieved lastSelectedTripId:',
        tripId
      );
      return tripId;
    } catch (error) {
      console.error(
        '❌ [USER_PREFERENCES_STORAGE] Error getting lastSelectedTripId:',
        error
      );
      return null;
    }
  }

  /**
   * Clear all user preferences (used for logout/cleanup)
   */
  static async clearPreferences(): Promise<void> {
    if (shouldSkipPersistence()) {
      console.log('🎭 [USER_PREFERENCES_STORAGE] Skipping clear in demo mode');
      return;
    }

    try {
      const db = await getDatabase();
      await db.delete('userPreferences', 'preferences');

      console.log('🧹 [USER_PREFERENCES_STORAGE] Cleared all preferences');
    } catch (error) {
      console.error(
        '❌ [USER_PREFERENCES_STORAGE] Error clearing preferences:',
        error
      );
      throw error;
    }
  }
}

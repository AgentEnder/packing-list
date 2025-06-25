import type { UserPerson } from '@packing-list/model';
import { getDatabase } from './database.js';

/**
 * Storage utilities for UserPerson entities (user profiles)
 */
export class UserPersonStorage {
  /**
   * Save a user profile to IndexedDB
   */
  static async saveUserPerson(userPerson: UserPerson): Promise<void> {
    const db = await getDatabase();

    // Store in the trips objectStore with a special userId as the key
    // This allows us to use existing infrastructure while keeping user profiles separate
    await db.put('trips', {
      ...userPerson,
      // Use special ID format to distinguish from regular trips
      id: `user-profile-${userPerson.userId}`,
      type: 'user_person',
    });

    console.log(
      `✅ [UserPersonStorage] Saved user profile for user ${userPerson.userId}`
    );
  }

  /**
   * Get user profile by userId
   */
  static async getUserPerson(userId: string): Promise<UserPerson | null> {
    const db = await getDatabase();

    try {
      const profileId = `user-profile-${userId}`;
      const result = await db.get('trips', profileId);

      if (!result || result.type !== 'user_person') {
        console.log(
          `📋 [UserPersonStorage] No user profile found for user ${userId}`
        );
        return null;
      }

      // Remove the storage-specific fields before returning
      const { type: _type, ...userPerson } = result as {
        type: string;
      } & UserPerson;

      console.log(
        `✅ [UserPersonStorage] Retrieved user profile for user ${userId}`
      );
      return userPerson as UserPerson;
    } catch (error) {
      console.error(
        `❌ [UserPersonStorage] Error retrieving user profile for user ${userId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Delete user profile by userId
   */
  static async deleteUserPerson(userId: string): Promise<void> {
    const db = await getDatabase();

    try {
      const profileId = `user-profile-${userId}`;
      await db.delete('trips', profileId);

      console.log(
        `✅ [UserPersonStorage] Deleted user profile for user ${userId}`
      );
    } catch (error) {
      console.error(
        `❌ [UserPersonStorage] Error deleting user profile for user ${userId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Check if user profile exists
   */
  static async hasUserPerson(userId: string): Promise<boolean> {
    const userPerson = await this.getUserPerson(userId);
    return userPerson !== null;
  }
}

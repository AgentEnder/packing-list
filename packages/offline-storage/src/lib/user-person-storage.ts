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

    // Store in the dedicated userPersons objectStore
    await db.put('userPersons', userPerson);

    console.log(
      `✅ [UserPersonStorage] Saved user profile: ${userPerson.name} (${userPerson.id}) for user ${userPerson.userId}`
    );
  }

  /**
   * Get user profile by userId (returns only the profile, not templates)
   */
  static async getUserPerson(userId: string): Promise<UserPerson | null> {
    const db = await getDatabase();

    try {
      // Use the userId index to find the user profile
      const userPersonsIndex = db
        .transaction('userPersons')
        .store.index('userId');
      const result = await userPersonsIndex.get(userId);

      if (!result) {
        console.log(
          `📋 [UserPersonStorage] No user profile found for user ${userId}`
        );
        return null;
      }

      console.log(
        `✅ [UserPersonStorage] Retrieved user profile: ${result.name} (${result.id}) for user ${userId}`
      );
      return result;
    } catch (error) {
      console.error(
        `❌ [UserPersonStorage] Error retrieving user profile for user ${userId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Get all user people (profile + templates) for a user
   */
  static async getAllUserPeople(userId: string): Promise<UserPerson[]> {
    const db = await getDatabase();

    try {
      // Use the userId index to find all user people for this user
      const userPersonsIndex = db
        .transaction('userPersons')
        .store.index('userId');
      const results = await userPersonsIndex.getAll(userId);

      console.log(
        `✅ [UserPersonStorage] Retrieved ${results.length} user people for user ${userId}`
      );
      return results.filter((person) => !person.isDeleted);
    } catch (error) {
      console.error(
        `❌ [UserPersonStorage] Error retrieving user people for user ${userId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Get user profile by UserPerson ID
   */
  static async getUserPersonById(
    userPersonId: string
  ): Promise<UserPerson | null> {
    const db = await getDatabase();

    try {
      const result = await db.get('userPersons', userPersonId);

      if (!result) {
        console.log(
          `📋 [UserPersonStorage] No user profile found for ID ${userPersonId}`
        );
        return null;
      }

      console.log(
        `✅ [UserPersonStorage] Retrieved user profile: ${result.name} (${result.id})`
      );
      return result;
    } catch (error) {
      console.error(
        `❌ [UserPersonStorage] Error retrieving user profile for ID ${userPersonId}:`,
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
      // First find the user profile by userId
      const userPerson = await this.getUserPerson(userId);
      if (!userPerson) {
        console.log(
          `📋 [UserPersonStorage] No user profile found to delete for user ${userId}`
        );
        return;
      }

      // Delete by the actual ID
      await db.delete('userPersons', userPerson.id);

      console.log(
        `✅ [UserPersonStorage] Deleted user profile: ${userPerson.name} (${userPerson.id}) for user ${userId}`
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
   * Delete a specific user person by ID (for templates and profiles)
   */
  static async deleteUserPersonById(userPersonId: string): Promise<void> {
    const db = await getDatabase();

    try {
      // First get the user person to log the deletion
      const userPerson = await this.getUserPersonById(userPersonId);
      if (!userPerson) {
        console.log(
          `📋 [UserPersonStorage] No user person found to delete for ID ${userPersonId}`
        );
        return;
      }

      // Delete by the actual ID
      await db.delete('userPersons', userPersonId);

      console.log(
        `✅ [UserPersonStorage] Deleted user person: ${
          userPerson.name
        } (${userPersonId}) - ${
          userPerson.isUserProfile ? 'profile' : 'template'
        }`
      );
    } catch (error) {
      console.error(
        `❌ [UserPersonStorage] Error deleting user person for ID ${userPersonId}:`,
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

  /**
   * Get all user profiles (for debugging/admin purposes)
   */
  static async getAllUserPersons(): Promise<UserPerson[]> {
    const db = await getDatabase();

    try {
      const allUserPersons = await db.getAll('userPersons');
      console.log(
        `✅ [UserPersonStorage] Retrieved ${allUserPersons.length} user profiles`
      );
      return allUserPersons;
    } catch (error) {
      console.error(
        `❌ [UserPersonStorage] Error retrieving all user profiles:`,
        error
      );
      return [];
    }
  }
}

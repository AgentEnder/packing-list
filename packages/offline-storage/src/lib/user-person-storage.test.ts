import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initializeDatabase, closeDatabase } from './database.js';
import { UserPersonStorage } from './user-person-storage.js';
import type { UserPerson } from '@packing-list/model';

const profile: UserPerson = {
  id: 'profile-1',
  userId: 'user-1',
  name: 'Tester',
  isUserProfile: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  version: 1,
  isDeleted: false,
};

describe('UserPersonStorage', () => {
  beforeEach(async () => {
    await initializeDatabase();
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('saves and retrieves a user profile', async () => {
    await UserPersonStorage.saveUserPerson(profile);
    const result = await UserPersonStorage.getUserPerson('user-1');
    expect(result?.name).toBe('Tester');
  });

  it('deletes a user profile', async () => {
    await UserPersonStorage.saveUserPerson(profile);
    await UserPersonStorage.deleteUserPerson('user-1');
    const result = await UserPersonStorage.getUserPerson('user-1');
    expect(result).toBeNull();
  });
});

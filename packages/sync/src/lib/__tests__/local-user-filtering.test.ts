/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach } from 'vitest';

// Recreate the local user checking function
function isLocalUser(userId: string): boolean {
  return (
    userId === 'local-shared-user' ||
    userId === 'local-user' ||
    userId.startsWith('local-')
  );
}

// Mock SyncService class with just the relevant methods for testing
class TestSyncService {
  private mockDatabase = new Map();
  private subscribers: ((state: any) => void)[] = [];

  async trackChange(change: any): Promise<void> {
    // Skip tracking for local users - they don't sync to remote
    if (isLocalUser(change.userId)) {
      console.log(
        `[SyncService] Skipping sync tracking for local user: ${change.operation} ${change.entityType}:${change.entityId}`
      );
      return;
    }

    // For non-local users, track the change
    const changeId = `change_${Date.now()}_${Math.random()}`;
    const fullChange = {
      ...change,
      id: changeId,
      timestamp: Date.now(),
      synced: false,
    };

    this.mockDatabase.set(changeId, fullChange);
    this.notifySubscribers();
  }

  async getPendingChanges(): Promise<any[]> {
    return Array.from(this.mockDatabase.values()).filter(
      (change) => !change.synced
    );
  }

  async getSyncState(): Promise<any> {
    const pendingChanges = await this.getPendingChanges();

    // Only count syncable changes in the state
    const syncableChanges = pendingChanges.filter(
      (change) => !isLocalUser(change.userId)
    );

    return {
      lastSyncTimestamp: Date.now(),
      pendingChanges: syncableChanges, // Only include syncable changes
      isOnline: true,
      isSyncing: false,
      conflicts: [],
    };
  }

  subscribe(callback: (state: any) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(): void {
    this.getSyncState().then((state) => {
      this.subscribers.forEach((callback) => callback(state));
    });
  }

  async cleanupLocalOnlyChanges(): Promise<void> {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const toDelete: string[] = [];

    for (const [id, change] of this.mockDatabase.entries()) {
      if (isLocalUser(change.userId) && change.timestamp < oneHourAgo) {
        toDelete.push(id);
      }
    }

    toDelete.forEach((id) => this.mockDatabase.delete(id));

    if (toDelete.length > 0) {
      console.log(
        `[SyncService] Cleaned up ${toDelete.length} old local-only changes`
      );
    }
  }

  getMockDatabase() {
    return this.mockDatabase;
  }
}

describe('Local User Filtering', () => {
  let syncService: TestSyncService;

  beforeEach(() => {
    syncService = new TestSyncService();
  });

  describe('isLocalUser function', () => {
    it('should identify local-shared-user as local', () => {
      expect(isLocalUser('local-shared-user')).toBe(true);
    });

    it('should identify local-user as local', () => {
      expect(isLocalUser('local-user')).toBe(true);
    });

    it('should identify users with local- prefix as local', () => {
      expect(isLocalUser('local-guest-123')).toBe(true);
      expect(isLocalUser('local-temp-user')).toBe(true);
      expect(isLocalUser('local-anonymous')).toBe(true);
    });

    it('should not identify regular users as local', () => {
      expect(isLocalUser('user-123')).toBe(false);
      expect(isLocalUser('authenticated-user-456')).toBe(false);
      expect(isLocalUser('google-oauth-789')).toBe(false);
      expect(isLocalUser('john.doe@email.com')).toBe(false);
    });

    it('should not identify users with local in the middle as local', () => {
      expect(isLocalUser('user-local-123')).toBe(false);
      expect(isLocalUser('mylocal-user')).toBe(false);
      expect(isLocalUser('user.local.domain')).toBe(false);
    });
  });

  describe('Change tracking for local users', () => {
    it('should not track changes for local-shared-user', async () => {
      const change = {
        entityType: 'trip',
        entityId: 'test-trip-1',
        operation: 'create',
        data: { title: 'Test Trip' },
        userId: 'local-shared-user',
        version: 1,
      };

      await syncService.trackChange(change);

      const pendingChanges = await syncService.getPendingChanges();
      expect(pendingChanges).toHaveLength(0);
    });

    it('should not track changes for local-user', async () => {
      const change = {
        entityType: 'person',
        entityId: 'test-person-1',
        operation: 'update',
        data: { name: 'John Doe' },
        userId: 'local-user',
        version: 2,
      };

      await syncService.trackChange(change);

      const pendingChanges = await syncService.getPendingChanges();
      expect(pendingChanges).toHaveLength(0);
    });

    it('should not track changes for users with local- prefix', async () => {
      const changes = [
        {
          entityType: 'item',
          entityId: 'test-item-1',
          operation: 'create',
          data: { name: 'Test Item' },
          userId: 'local-guest-123',
          version: 1,
        },
        {
          entityType: 'item',
          entityId: 'test-item-2',
          operation: 'update',
          data: { name: 'Updated Item' },
          userId: 'local-temp-user',
          version: 2,
        },
        {
          entityType: 'trip',
          entityId: 'test-trip-2',
          operation: 'delete',
          data: null,
          userId: 'local-anonymous',
          version: 3,
        },
      ];

      for (const change of changes) {
        await syncService.trackChange(change);
      }

      const pendingChanges = await syncService.getPendingChanges();
      expect(pendingChanges).toHaveLength(0);
    });

    it('should track changes for regular users', async () => {
      const change = {
        entityType: 'trip',
        entityId: 'test-trip-1',
        operation: 'create',
        data: { title: 'Test Trip' },
        userId: 'user-123',
        version: 1,
      };

      await syncService.trackChange(change);

      const pendingChanges = await syncService.getPendingChanges();
      expect(pendingChanges).toHaveLength(1);
      expect(pendingChanges[0].userId).toBe('user-123');
    });

    it('should track changes for authenticated users', async () => {
      const changes = [
        {
          entityType: 'trip',
          entityId: 'test-trip-1',
          operation: 'create',
          data: { title: 'Trip 1' },
          userId: 'auth-user-123',
          version: 1,
        },
        {
          entityType: 'person',
          entityId: 'test-person-1',
          operation: 'create',
          data: { name: 'John' },
          userId: 'google-oauth-456',
          version: 1,
        },
        {
          entityType: 'item',
          entityId: 'test-item-1',
          operation: 'create',
          data: { name: 'Item' },
          userId: 'john.doe@email.com',
          version: 1,
        },
      ];

      for (const change of changes) {
        await syncService.trackChange(change);
      }

      const pendingChanges = await syncService.getPendingChanges();
      expect(pendingChanges).toHaveLength(3);
    });
  });

  describe('Sync state filtering', () => {
    it('should exclude local user changes from sync state', async () => {
      // Add mix of local and regular user changes
      const changes = [
        {
          entityType: 'trip',
          entityId: 'trip-1',
          operation: 'create',
          data: { title: 'Local Trip' },
          userId: 'local-user',
          version: 1,
        },
        {
          entityType: 'trip',
          entityId: 'trip-2',
          operation: 'create',
          data: { title: 'Regular Trip' },
          userId: 'user-123',
          version: 1,
        },
        {
          entityType: 'person',
          entityId: 'person-1',
          operation: 'create',
          data: { name: 'Local Person' },
          userId: 'local-guest-456',
          version: 1,
        },
        {
          entityType: 'person',
          entityId: 'person-2',
          operation: 'create',
          data: { name: 'Regular Person' },
          userId: 'auth-user-789',
          version: 1,
        },
      ];

      for (const change of changes) {
        await syncService.trackChange(change);
      }

      const syncState = await syncService.getSyncState();

      // Should only show the 2 non-local user changes
      expect(syncState.pendingChanges).toHaveLength(2);
      expect(
        syncState.pendingChanges.every(
          (change: any) => !isLocalUser(change.userId)
        )
      ).toBe(true);
    });

    it('should show empty pending changes when only local user changes exist', async () => {
      const localChanges = [
        {
          entityType: 'trip',
          entityId: 'trip-1',
          operation: 'create',
          data: { title: 'Local Trip' },
          userId: 'local-shared-user',
          version: 1,
        },
        {
          entityType: 'person',
          entityId: 'person-1',
          operation: 'create',
          data: { name: 'Local Person' },
          userId: 'local-user',
          version: 1,
        },
        {
          entityType: 'item',
          entityId: 'item-1',
          operation: 'create',
          data: { name: 'Local Item' },
          userId: 'local-guest-123',
          version: 1,
        },
      ];

      for (const change of localChanges) {
        await syncService.trackChange(change);
      }

      const syncState = await syncService.getSyncState();
      expect(syncState.pendingChanges).toHaveLength(0);
    });
  });

  describe('Cleanup of local-only changes', () => {
    it('should clean up old local-only changes', async () => {
      // Mock old timestamps
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;

      // Manually add old local changes to the mock database
      const oldLocalChange = {
        id: 'change-old-local',
        entityType: 'trip',
        entityId: 'trip-old',
        operation: 'create',
        data: { title: 'Old Local Trip' },
        userId: 'local-user',
        version: 1,
        timestamp: twoHoursAgo,
        synced: false,
      };

      const recentLocalChange = {
        id: 'change-recent-local',
        entityType: 'trip',
        entityId: 'trip-recent',
        operation: 'create',
        data: { title: 'Recent Local Trip' },
        userId: 'local-guest-123',
        version: 1,
        timestamp: Date.now() - 30 * 60 * 1000, // 30 minutes ago
        synced: false,
      };

      const oldRegularChange = {
        id: 'change-old-regular',
        entityType: 'trip',
        entityId: 'trip-old-regular',
        operation: 'create',
        data: { title: 'Old Regular Trip' },
        userId: 'user-123',
        version: 1,
        timestamp: twoHoursAgo,
        synced: false,
      };

      const mockDb = syncService.getMockDatabase();
      mockDb.set(oldLocalChange.id, oldLocalChange);
      mockDb.set(recentLocalChange.id, recentLocalChange);
      mockDb.set(oldRegularChange.id, oldRegularChange);

      expect(mockDb.size).toBe(3);

      // Run cleanup
      await syncService.cleanupLocalOnlyChanges();

      // Should only remove old local changes, keeping recent local and old regular
      expect(mockDb.size).toBe(2);
      expect(mockDb.has(oldLocalChange.id)).toBe(false);
      expect(mockDb.has(recentLocalChange.id)).toBe(true);
      expect(mockDb.has(oldRegularChange.id)).toBe(true);
    });

    it('should not clean up recent local changes', async () => {
      const recentChanges = [
        {
          id: 'change-recent-1',
          entityType: 'trip',
          entityId: 'trip-1',
          operation: 'create',
          data: { title: 'Recent Trip 1' },
          userId: 'local-user',
          version: 1,
          timestamp: Date.now() - 30 * 60 * 1000, // 30 minutes ago
          synced: false,
        },
        {
          id: 'change-recent-2',
          entityType: 'trip',
          entityId: 'trip-2',
          operation: 'create',
          data: { title: 'Recent Trip 2' },
          userId: 'local-guest-456',
          version: 1,
          timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
          synced: false,
        },
      ];

      const mockDb = syncService.getMockDatabase();
      recentChanges.forEach((change) => mockDb.set(change.id, change));

      expect(mockDb.size).toBe(2);

      await syncService.cleanupLocalOnlyChanges();

      // Should not remove any recent changes
      expect(mockDb.size).toBe(2);
      recentChanges.forEach((change) => {
        expect(mockDb.has(change.id)).toBe(true);
      });
    });
  });

  describe('Subscription notifications', () => {
    it('should notify subscribers with filtered sync state', async () => {
      const notifications: any[] = [];
      const unsubscribe = syncService.subscribe((state) => {
        notifications.push(state);
      });

      // Add both local and regular user changes
      await syncService.trackChange({
        entityType: 'trip',
        entityId: 'trip-local',
        operation: 'create',
        data: { title: 'Local Trip' },
        userId: 'local-user',
        version: 1,
      });

      await syncService.trackChange({
        entityType: 'trip',
        entityId: 'trip-regular',
        operation: 'create',
        data: { title: 'Regular Trip' },
        userId: 'user-123',
        version: 1,
      });

      // Wait for async notifications
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(notifications.length).toBeGreaterThan(0);

      // Latest notification should only show regular user changes
      const latestState = notifications[notifications.length - 1];
      expect(latestState.pendingChanges).toHaveLength(1);
      expect(latestState.pendingChanges[0].userId).toBe('user-123');

      unsubscribe();
    });
  });
});

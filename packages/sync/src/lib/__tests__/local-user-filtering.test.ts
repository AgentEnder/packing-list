/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SyncService } from '../sync.js';
import {
  createTripChange,
  createPersonChange,
  createItemChange,
  createLocalSharedUserChange,
} from './test-utils.js';

describe('Local User Filtering in Real SyncService', () => {
  let syncService: SyncService;
  let storedChanges: Map<string, any>;
  let mockDb: any;

  beforeEach(async () => {
    // Create a mock database that actually stores data
    storedChanges = new Map();

    mockDb = {
      get: vi.fn().mockResolvedValue(0),
      put: vi.fn().mockImplementation((store, value, key) => {
        if (store === 'syncChanges') {
          storedChanges.set(value.id, value);
        }
        return Promise.resolve();
      }),
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn().mockReturnValue({
          getAll: vi.fn().mockImplementation(() => {
            return Promise.resolve(Array.from(storedChanges.values()));
          }),
          get: vi.fn().mockResolvedValue(null),
          put: vi.fn().mockResolvedValue(undefined),
          delete: vi.fn().mockImplementation((id) => {
            storedChanges.delete(id);
            return Promise.resolve();
          }),
        }),
        done: Promise.resolve(),
      }),
    };

    // Mock dependencies with dynamic mocking
    vi.doMock('@packing-list/supabase', () => ({
      supabase: {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      },
      isSupabaseAvailable: vi.fn().mockReturnValue(false), // Disable actual syncing
    }));

    vi.doMock('@packing-list/offline-storage', () => ({
      getDatabase: vi.fn().mockResolvedValue(mockDb),
      ConflictsStorage: {
        getAllConflicts: vi.fn().mockResolvedValue([]),
      },
    }));

    vi.doMock('@packing-list/connectivity', () => ({
      getConnectivityService: vi.fn().mockReturnValue({
        getState: vi
          .fn()
          .mockReturnValue({ isOnline: false, isConnected: false }),
        subscribe: vi.fn().mockReturnValue(() => {
          // Unsubscribe function
        }),
      }),
    }));

    // Create SyncService with offline mode
    syncService = new SyncService({
      demoMode: false,
      autoSyncInterval: 1000000, // Very long interval to prevent auto-sync
    });
  });

  afterEach(() => {
    syncService.stop();
    storedChanges.clear();
    vi.doUnmock('@packing-list/supabase');
    vi.doUnmock('@packing-list/offline-storage');
    vi.doUnmock('@packing-list/connectivity');
  });

  describe('Change tracking for local users', () => {
    it('should not track changes for local-shared-user', async () => {
      const change = createLocalSharedUserChange({
        entityId: 'test-trip-1',
        operation: 'create',
      });

      await syncService.trackChange(change);

      const syncState = await syncService.getSyncState();
      expect(syncState.pendingChanges).toHaveLength(0);

      // Verify the change was not stored in the database
      expect(storedChanges.size).toBe(0);
    });

    it('should not track changes for local-user', async () => {
      const change = createPersonChange({
        entityId: 'test-person-1',
        operation: 'update',
        userId: 'local-user',
      });

      await syncService.trackChange(change);

      const syncState = await syncService.getSyncState();
      expect(syncState.pendingChanges).toHaveLength(0);
      expect(storedChanges.size).toBe(0);
    });

    it('should not track changes for users with local- prefix', async () => {
      const changes = [
        createItemChange({
          entityId: 'test-item-1',
          operation: 'create',
          userId: 'local-guest-123',
        }),
        createItemChange({
          entityId: 'test-item-2',
          operation: 'update',
          userId: 'local-temp-user',
        }),
        createTripChange({
          entityId: 'test-trip-2',
          operation: 'delete',
          userId: 'local-anonymous',
        }),
      ];

      for (const change of changes) {
        await syncService.trackChange(change);
      }

      const syncState = await syncService.getSyncState();
      expect(syncState.pendingChanges).toHaveLength(0);
      expect(storedChanges.size).toBe(0);
    });

    it('should track changes for regular users', async () => {
      const changes = [
        createTripChange({
          entityId: 'test-trip-1',
          operation: 'create',
          userId: 'user-123',
        }),
        createPersonChange({
          entityId: 'test-person-1',
          operation: 'update',
          userId: 'authenticated-user-456',
        }),
        createItemChange({
          entityId: 'test-item-1',
          operation: 'delete',
          userId: 'google-oauth-789',
        }),
      ];

      for (const change of changes) {
        await syncService.trackChange(change);
      }

      const syncState = await syncService.getSyncState();
      expect(syncState.pendingChanges).toHaveLength(3);

      // Verify the changes were tracked correctly
      expect(syncState.pendingChanges[0].userId).toBe('user-123');
      expect(syncState.pendingChanges[1].userId).toBe('authenticated-user-456');
      expect(syncState.pendingChanges[2].userId).toBe('google-oauth-789');

      // Verify they're actually stored in the mock database
      expect(storedChanges.size).toBe(3);
    });
  });

  describe('Sync state filtering', () => {
    it('should exclude local user changes from sync state', async () => {
      // Track a mix of local and regular user changes
      await syncService.trackChange(
        createTripChange({
          entityId: 'trip-1',
          userId: 'local-user',
        })
      );

      await syncService.trackChange(
        createPersonChange({
          entityId: 'person-1',
          userId: 'local-shared-user',
        })
      );

      await syncService.trackChange(
        createTripChange({
          entityId: 'trip-2',
          userId: 'regular-user',
        })
      );

      const syncState = await syncService.getSyncState();

      // Only the regular user change should be in pending changes
      expect(syncState.pendingChanges).toHaveLength(1);
      expect(syncState.pendingChanges[0].userId).toBe('regular-user');

      // But only the regular user change should be stored
      expect(storedChanges.size).toBe(1);
    });

    it('should show empty pending changes when only local user changes exist', async () => {
      await syncService.trackChange(
        createTripChange({
          entityId: 'trip-1',
          userId: 'local-user',
        })
      );

      await syncService.trackChange(
        createPersonChange({
          entityId: 'person-1',
          userId: 'local-shared-user',
        })
      );

      await syncService.trackChange(
        createItemChange({
          entityId: 'item-1',
          userId: 'local-guest-123',
        })
      );

      const syncState = await syncService.getSyncState();
      expect(syncState.pendingChanges).toHaveLength(0);
      expect(storedChanges.size).toBe(0);
    });
  });

  describe('Subscription notifications', () => {
    it('should notify subscribers with filtered sync state', async () => {
      const mockCallback = vi.fn();
      const unsubscribe = syncService.subscribe(mockCallback);

      // Track a local user change (should not appear in notifications)
      await syncService.trackChange(
        createTripChange({
          entityId: 'trip-local',
          userId: 'local-user',
        })
      );

      // Track a regular user change (should appear in notifications)
      await syncService.trackChange(
        createTripChange({
          entityId: 'trip-regular',
          userId: 'regular-user',
        })
      );

      // Wait for async notifications
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockCallback).toHaveBeenCalled();
      const lastCall =
        mockCallback.mock.calls[mockCallback.mock.calls.length - 1];
      const notifiedState = lastCall[0];

      // Should only include the regular user change
      expect(notifiedState.pendingChanges).toHaveLength(1);
      expect(notifiedState.pendingChanges[0].userId).toBe('regular-user');

      unsubscribe();
    });
  });
});

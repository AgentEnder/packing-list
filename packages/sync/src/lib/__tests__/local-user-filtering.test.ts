/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Global state for test isolation
let storedChanges: Map<string, any>;
let storedSyncMetadata: Map<string, any>;
let mockDb: any;

// Mock all dependencies at the top level before any imports
vi.mock('@packing-list/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  },
  isSupabaseAvailable: vi.fn().mockReturnValue(false), // Disable actual syncing
}));

vi.mock('@packing-list/offline-storage', () => ({
  getDatabase: vi.fn().mockImplementation(() => {
    return Promise.resolve(mockDb);
  }),
  ConflictsStorage: {
    getAllConflicts: vi.fn().mockResolvedValue([]),
    saveConflict: vi.fn().mockResolvedValue(undefined),
    deleteConflict: vi.fn().mockResolvedValue(undefined),
    getConflict: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('@packing-list/connectivity', () => ({
  getConnectivityService: vi.fn().mockReturnValue({
    getState: vi.fn().mockReturnValue({ isOnline: false, isConnected: false }),
    subscribe: vi.fn().mockReturnValue(() => {
      // Unsubscribe function
    }),
  }),
}));

// Import after mocks
import { SyncService, resetSyncService } from '../sync.js';
import {
  createTripChange,
  createPersonChange,
  createItemChange,
  createLocalSharedUserChange,
} from './test-utils.js';

describe('Local User Filtering in Real SyncService', () => {
  let syncService: SyncService;

  beforeEach(async () => {
    // Reset the singleton before each test
    resetSyncService();

    // Clear all mocks
    vi.clearAllMocks();

    // Create fresh test state for each test
    storedChanges = new Map();
    storedSyncMetadata = new Map();

    // Create a fresh mock database for each test
    mockDb = {
      get: vi.fn().mockImplementation((store, key) => {
        if (store === 'syncMetadata') {
          return Promise.resolve(storedSyncMetadata.get(key));
        }
        return Promise.resolve(0);
      }),
      put: vi.fn().mockImplementation((store, value, key) => {
        if (store === 'syncChanges') {
          storedChanges.set(value.id, value);
        } else if (store === 'syncMetadata') {
          storedSyncMetadata.set(key, value);
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

    // Create SyncService with offline mode
    syncService = new SyncService({
      demoMode: false,
      autoSyncInterval: 1000000, // Very long interval to prevent auto-sync
    });
  });

  afterEach(() => {
    syncService.stop();
    resetSyncService(); // Clean up singleton
    storedChanges.clear();
    storedSyncMetadata.clear();
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

      // Sort by entityId to ensure consistent ordering for testing
      const sortedChanges = syncState.pendingChanges.sort((a, b) =>
        a.entityId.localeCompare(b.entityId)
      );

      // Verify the changes were tracked correctly (sorted by entityId)
      expect(sortedChanges[0].userId).toBe('google-oauth-789'); // test-item-1
      expect(sortedChanges[1].userId).toBe('authenticated-user-456'); // test-person-1
      expect(sortedChanges[2].userId).toBe('user-123'); // test-trip-1

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

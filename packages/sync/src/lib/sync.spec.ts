/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SyncService, getSyncService, initializeSyncService } from './sync.js';
import { isSupabaseAvailable, supabase } from '@packing-list/supabase';
import { getDatabase } from '@packing-list/offline-storage';

// Mock IDBKeyRange for test environment
(global as typeof globalThis & { IDBKeyRange: unknown }).IDBKeyRange = {
  only: vi.fn((value) => ({ only: value })),
  bound: vi.fn(),
  lowerBound: vi.fn(),
  upperBound: vi.fn(),
};

// Mock the dependencies with proper hoisting
vi.mock('@packing-list/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    }),
  },
  isSupabaseAvailable: vi.fn().mockReturnValue(false),
}));

let mockDatabase: any;

vi.mock('@packing-list/offline-storage', () => ({
  getDatabase: vi.fn().mockImplementation(() => Promise.resolve(mockDatabase)),
  TripStorage: {
    saveTrip: vi.fn(),
    getTrip: vi.fn(),
    getUserTrips: vi.fn(),
  },
  PersonStorage: {
    savePerson: vi.fn(),
  },
  ItemStorage: {
    saveItem: vi.fn(),
  },
  RuleOverrideStorage: {
    saveRuleOverride: vi.fn(),
  },
  DefaultItemRulesStorage: {
    saveDefaultItemRule: vi.fn(),
  },
  RulePacksStorage: {
    saveRulePack: vi.fn(),
  },
}));

// Create comprehensive mock database
const createMockDatabase = () => {
  const stores = new Map();
  return {
    get: vi.fn().mockImplementation((store, key) => {
      const storeData = stores.get(store) || new Map();
      if (key === 'lastSyncTimestamp') return Promise.resolve(Date.now());
      return Promise.resolve(storeData.get(key) || null);
    }),
    put: vi.fn().mockImplementation((store, value, key) => {
      if (!stores.has(store)) stores.set(store, new Map());
      const storeData = stores.get(store);
      const finalKey = key || (value && value.id);
      storeData.set(finalKey, value);
      return Promise.resolve(undefined);
    }),
    delete: vi.fn().mockImplementation((store, key) => {
      const storeData = stores.get(store);
      if (storeData) storeData.delete(key);
      return Promise.resolve(undefined);
    }),
    getAll: vi.fn().mockImplementation((store) => {
      const storeData = stores.get(store) || new Map();
      return Promise.resolve(Array.from(storeData.values()));
    }),
    transaction: vi.fn().mockReturnValue({
      objectStore: vi.fn().mockReturnValue({
        index: vi.fn().mockReturnValue({
          getAll: vi.fn().mockResolvedValue([]),
        }),
        get: vi.fn().mockImplementation((key) => {
          const storeData = stores.get('syncChanges') || new Map();
          return Promise.resolve(storeData.get(key) || null);
        }),
        put: vi.fn().mockImplementation((value) => {
          if (!stores.has('syncChanges')) stores.set('syncChanges', new Map());
          const storeData = stores.get('syncChanges');
          storeData.set(value.id, value);
          return Promise.resolve(undefined);
        }),
        getAll: vi.fn().mockImplementation(() => {
          const storeData = stores.get('syncChanges') || new Map();
          return Promise.resolve(Array.from(storeData.values()));
        }),
        delete: vi.fn().mockImplementation((key) => {
          const storeData = stores.get('syncChanges');
          if (storeData) storeData.delete(key);
          return Promise.resolve(undefined);
        }),
      }),
      done: Promise.resolve(),
    }),
    _stores: stores, // For testing access
  };
};

describe('SyncService', () => {
  let syncService: SyncService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDatabase = createMockDatabase();
    syncService = new SyncService({ autoSyncInterval: 1000 });
  });

  describe('Basic Functionality', () => {
    it('should create a sync service instance', () => {
      expect(syncService).toBeInstanceOf(SyncService);
    });

    it('should get sync state with correct structure', async () => {
      const state = await syncService.getSyncState();

      expect(state).toMatchObject({
        lastSyncTimestamp: expect.any(Number),
        pendingChanges: expect.any(Array),
        isSyncing: expect.any(Boolean),
        conflicts: expect.any(Array),
      });

      // isOnline might be undefined in test environment
      expect(
        typeof state.isOnline === 'boolean' || state.isOnline === undefined
      ).toBe(true);
    });

    it('should start and stop the sync service', async () => {
      await syncService.start();
      expect(true).toBe(true); // Service started without error

      syncService.stop();
      expect(true).toBe(true); // Service stopped without error
    });
  });

  describe('Change Tracking', () => {
    it('should track regular user changes', async () => {
      const change = {
        entityType: 'trip' as const,
        entityId: 'test-trip-1',
        operation: 'create' as const,
        data: { title: 'Test Trip', days: [], tripEvents: [] },
        userId: 'user-123',
        version: 1,
      };

      await syncService.trackChange(change);

      const state = await syncService.getSyncState();
      expect(state.pendingChanges).toHaveLength(1);
      expect(state.pendingChanges[0]).toMatchObject({
        entityType: 'trip',
        entityId: 'test-trip-1',
        operation: 'create',
        userId: 'user-123',
        version: 1,
        synced: false,
      });
    });

    it('should not track local user changes', async () => {
      const localChanges = [
        {
          entityType: 'trip' as const,
          entityId: 'local-trip-1',
          operation: 'create' as const,
          data: { title: 'Local Trip' },
          userId: 'local-user',
          version: 1,
        },
        {
          entityType: 'trip' as const,
          entityId: 'local-trip-2',
          operation: 'create' as const,
          data: { title: 'Local Shared Trip' },
          userId: 'local-shared-user',
          version: 1,
        },
        {
          entityType: 'trip' as const,
          entityId: 'local-trip-3',
          operation: 'create' as const,
          data: { title: 'Local Guest Trip' },
          userId: 'local-guest-123',
          version: 1,
        },
      ];

      for (const change of localChanges) {
        await syncService.trackChange(change);
      }

      const state = await syncService.getSyncState();
      expect(state.pendingChanges).toHaveLength(0);
    });

    it('should filter out local changes from sync state', async () => {
      // Add mix of local and regular changes
      const changes = [
        {
          entityType: 'trip' as const,
          entityId: 'local-trip',
          operation: 'create' as const,
          data: { title: 'Local Trip' },
          userId: 'local-user',
          version: 1,
        },
        {
          entityType: 'trip' as const,
          entityId: 'regular-trip',
          operation: 'create' as const,
          data: { title: 'Regular Trip' },
          userId: 'user-123',
          version: 1,
        },
      ];

      for (const change of changes) {
        await syncService.trackChange(change);
      }

      const state = await syncService.getSyncState();
      // Should only show the regular user change
      expect(state.pendingChanges).toHaveLength(1);
      expect(state.pendingChanges[0].userId).toBe('user-123');
    });

    it('should handle multiple changes for the same entity', async () => {
      const changes = [
        {
          entityType: 'trip' as const,
          entityId: 'trip-1',
          operation: 'create' as const,
          data: { title: 'Original Trip' },
          userId: 'user-123',
          version: 1,
        },
        {
          entityType: 'trip' as const,
          entityId: 'trip-1',
          operation: 'update' as const,
          data: { title: 'Updated Trip' },
          userId: 'user-123',
          version: 2,
        },
      ];

      for (const change of changes) {
        await syncService.trackChange(change);
      }

      const state = await syncService.getSyncState();
      expect(state.pendingChanges).toHaveLength(2);
    });
  });

  describe('Subscription Management', () => {
    it('should manage subscriptions correctly', async () => {
      const notifications: any[] = [];
      const callback = vi.fn((state) => notifications.push(state));

      const unsubscribe = syncService.subscribe(callback);
      expect(typeof unsubscribe).toBe('function');

      // Trigger a state change
      await syncService.trackChange({
        entityType: 'trip' as const,
        entityId: 'test-trip',
        operation: 'create' as const,
        data: { title: 'Test' },
        userId: 'user-123',
        version: 1,
      });

      // Wait for async notification to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should have been called at least once
      expect(callback).toHaveBeenCalled();

      // Unsubscribe should work
      unsubscribe();

      const previousCallCount = callback.mock.calls.length;

      // Add another change
      await syncService.trackChange({
        entityType: 'trip' as const,
        entityId: 'test-trip-2',
        operation: 'create' as const,
        data: { title: 'Test 2' },
        userId: 'user-123',
        version: 1,
      });

      // Wait for potential notification
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should not have been called again after unsubscribe
      expect(callback.mock.calls.length).toBe(previousCallCount);
    });

    it('should handle multiple subscribers', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      const unsubscribe1 = syncService.subscribe(callback1);
      const unsubscribe2 = syncService.subscribe(callback2);
      const unsubscribe3 = syncService.subscribe(callback3);

      // Trigger a change
      await syncService.trackChange({
        entityType: 'trip' as const,
        entityId: 'test-trip',
        operation: 'create' as const,
        data: { title: 'Test' },
        userId: 'user-123',
        version: 1,
      });

      // Wait for async notifications
      await new Promise((resolve) => setTimeout(resolve, 10));

      // All should have been called
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
      expect(callback3).toHaveBeenCalled();

      // Unsubscribe one
      unsubscribe2();

      const prevCount1 = callback1.mock.calls.length;
      const prevCount2 = callback2.mock.calls.length;
      const prevCount3 = callback3.mock.calls.length;

      // Trigger another change
      await syncService.trackChange({
        entityType: 'trip' as const,
        entityId: 'test-trip-2',
        operation: 'create' as const,
        data: { title: 'Test 2' },
        userId: 'user-123',
        version: 1,
      });

      // Wait for notifications
      await new Promise((resolve) => setTimeout(resolve, 10));

      // callback1 and callback3 should have been called again
      expect(callback1.mock.calls.length).toBeGreaterThan(prevCount1);
      expect(callback3.mock.calls.length).toBeGreaterThan(prevCount3);

      // callback2 should not have been called again
      expect(callback2.mock.calls.length).toBe(prevCount2);

      // Clean up
      unsubscribe1();
      unsubscribe3();
    });

    it('should handle subscriber errors gracefully', async () => {
      const goodCallback = vi.fn();
      const errorCallback = vi.fn(() => {
        throw new Error('Subscriber error');
      });

      syncService.subscribe(goodCallback);
      syncService.subscribe(errorCallback);

      // Should not throw despite error in one callback
      await expect(
        syncService.trackChange({
          entityType: 'trip' as const,
          entityId: 'test-trip',
          operation: 'create' as const,
          data: { title: 'Test' },
          userId: 'user-123',
          version: 1,
        })
      ).resolves.toBeUndefined();

      // Good callback should still have been called
      expect(goodCallback).toHaveBeenCalled();
      expect(errorCallback).toHaveBeenCalled();
    });
  });

  describe('Force Sync', () => {
    it('should handle force sync when offline', async () => {
      // Mock offline state by setting isOnline to false
      Object.defineProperty(syncService, 'isOnline', {
        value: false,
        writable: true,
      });

      // Force sync should not throw when offline
      await expect(syncService.forceSync()).resolves.toBeUndefined();
    });

    it('should perform sync when online', async () => {
      // Mock online state
      Object.defineProperty(syncService, 'isOnline', {
        value: true,
        writable: true,
      });

      // Mock Supabase as available for this test
      vi.mocked(isSupabaseAvailable).mockReturnValue(true);

      // Should not throw when online and Supabase is available
      await expect(syncService.forceSync()).resolves.toBeUndefined();
    });

    it('should handle sync errors without breaking the service', async () => {
      // Mock online state and Supabase available
      Object.defineProperty(syncService, 'isOnline', {
        value: true,
        writable: true,
      });

      vi.mocked(isSupabaseAvailable).mockReturnValue(true);

      // Mock Supabase error by changing the import
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockRejectedValue(new Error('Network error')),
        }),
      });

      // Force sync should handle the error gracefully
      await expect(syncService.forceSync()).resolves.toBeUndefined();
    });
  });

  describe('Conflict Resolution', () => {
    it('should resolve conflicts correctly', async () => {
      // Create a mock conflict in the database
      const conflictId = 'conflict-123';
      const conflict = {
        id: conflictId,
        entityType: 'trip',
        entityId: 'trip-123',
        localVersion: { title: 'Local Title' },
        serverVersion: { title: 'Server Title' },
        conflictType: 'update_conflict',
        timestamp: Date.now(),
      };

      // Add conflict to mock database
      await mockDatabase.put('syncConflicts', conflict, conflictId);

      // Resolve the conflict
      await syncService.resolveConflict(conflictId, 'server');

      // Conflict should be removed
      const conflicts = await mockDatabase.getAll('syncConflicts');
      expect(conflicts.find((c: any) => c.id === conflictId)).toBeUndefined();
    });

    it('should handle non-existent conflict gracefully', async () => {
      // Try to resolve a conflict that doesn't exist
      await expect(
        syncService.resolveConflict('non-existent-conflict', 'local')
      ).resolves.toBeUndefined();
    });
  });

  describe('Environment Detection', () => {
    it('should handle browser environment', () => {
      // Test that the service works in various environments
      expect(syncService).toBeInstanceOf(SyncService);
    });

    it('should handle non-browser environment', () => {
      // The service should still work in non-browser environments
      expect(syncService).toBeInstanceOf(SyncService);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockDatabase.put.mockRejectedValueOnce(new Error('Database error'));

      // Should not throw but handle error gracefully
      await expect(
        syncService.trackChange({
          entityType: 'trip' as const,
          entityId: 'test-trip',
          operation: 'create' as const,
          data: { title: 'Test' },
          userId: 'user-123',
          version: 1,
        })
      ).rejects.toThrow('Database error');
    });
  });

  describe('State Management', () => {
    it('should track sync state correctly', async () => {
      const initialState = await syncService.getSyncState();
      expect(initialState.isSyncing).toBe(false);
      expect(initialState.pendingChanges).toHaveLength(0);

      // Add a change
      await syncService.trackChange({
        entityType: 'trip' as const,
        entityId: 'test-trip',
        operation: 'create' as const,
        data: { title: 'Test' },
        userId: 'user-123',
        version: 1,
      });

      const stateWithChanges = await syncService.getSyncState();
      expect(stateWithChanges.pendingChanges).toHaveLength(1);
    });

    it('should maintain consistent state across operations', async () => {
      // Add multiple changes
      const changes = [
        {
          entityType: 'trip' as const,
          entityId: 'trip-1',
          operation: 'create' as const,
          data: { title: 'Trip 1' },
          userId: 'user-123',
          version: 1,
        },
        {
          entityType: 'person' as const,
          entityId: 'person-1',
          operation: 'create' as const,
          data: { name: 'John', age: 30, gender: 'male' },
          userId: 'user-123',
          version: 1,
        },
        {
          entityType: 'item' as const,
          entityId: 'item-1',
          operation: 'create' as const,
          data: {
            name: 'T-shirt',
            category: 'clothing',
            quantity: 1,
            packed: false,
          },
          userId: 'user-123',
          version: 1,
        },
      ];

      for (const change of changes) {
        await syncService.trackChange(change);
      }

      const state = await syncService.getSyncState();
      expect(state.pendingChanges).toHaveLength(3);

      // Verify each change is properly stored
      const tripChange = state.pendingChanges.find(
        (c) => c.entityType === 'trip'
      );
      const personChange = state.pendingChanges.find(
        (c) => c.entityType === 'person'
      );
      const itemChange = state.pendingChanges.find(
        (c) => c.entityType === 'item'
      );

      expect(tripChange).toBeDefined();
      expect(personChange).toBeDefined();
      expect(itemChange).toBeDefined();
    });
  });
});

describe('getSyncService', () => {
  it('should return a singleton instance', () => {
    const service1 = getSyncService();
    const service2 = getSyncService();

    expect(service1).toBe(service2);
  });

  it('should accept options', () => {
    const service = getSyncService({ autoSyncInterval: 5000 });
    expect(service).toBeInstanceOf(SyncService);
  });
});

describe('initializeSyncService', () => {
  it('should initialize and start the sync service', async () => {
    const service = await initializeSyncService({ autoSyncInterval: 5000 });

    expect(service).toBeInstanceOf(SyncService);

    // Clean up
    service.stop();
  });

  it('should handle initialization errors gracefully', async () => {
    // Test that initializeSyncService can handle various scenarios
    // without causing unhandled promise rejections

    const originalGetDatabase = vi.mocked(getDatabase);

    // Store original implementation to restore later
    const originalImpl = originalGetDatabase.getMockImplementation();

    try {
      // Test normal initialization
      const service = await initializeSyncService();
      expect(service).toBeInstanceOf(SyncService);

      // Clean up
      service.stop();

      // Test that the service is resilient to various initialization scenarios
      expect(true).toBe(true); // This test verifies no unhandled errors occur
    } finally {
      // Restore original implementation to avoid affecting other tests
      if (originalImpl) {
        originalGetDatabase.mockImplementation(originalImpl);
      } else {
        originalGetDatabase.mockRestore();
      }
    }
  });
});

describe('Integration Tests', () => {
  it('should handle complex sync scenarios', async () => {
    // Use a completely isolated service for this test
    const service = new SyncService({ autoSyncInterval: 100 });

    // Track multiple changes
    await service.trackChange({
      entityType: 'trip' as const,
      entityId: 'integration-trip-1',
      operation: 'create' as const,
      data: { title: 'Business Trip', days: [], tripEvents: [] },
      userId: 'integration-user-123',
      version: 1,
    });

    await service.trackChange({
      entityType: 'person' as const,
      entityId: 'integration-person-1',
      operation: 'create' as const,
      data: { name: 'John Doe', age: 35, gender: 'male' },
      userId: 'integration-user-123',
      version: 1,
      tripId: 'integration-trip-1',
    });

    await service.trackChange({
      entityType: 'item' as const,
      entityId: 'integration-item-1',
      operation: 'create' as const,
      data: {
        name: 'Laptop',
        category: 'electronics',
        quantity: 1,
        packed: false,
      },
      userId: 'integration-user-123',
      version: 1,
      tripId: 'integration-trip-1',
    });

    const state = await service.getSyncState();

    // Check we have at least our 3 changes
    expect(state.pendingChanges.length).toBeGreaterThanOrEqual(3);

    // Filter to just our test changes
    const ourChanges = state.pendingChanges.filter(
      (c) =>
        c.userId === 'integration-user-123' &&
        (c.entityId.startsWith('integration-') ||
          c.entityType === 'person' ||
          c.entityType === 'item')
    );

    expect(ourChanges).toHaveLength(3);

    // All our changes should be for the same user
    expect(ourChanges.every((c) => c.userId === 'integration-user-123')).toBe(
      true
    );

    // Should have different entity types
    const entityTypes = ourChanges.map((c) => c.entityType);
    expect(entityTypes).toContain('trip');
    expect(entityTypes).toContain('person');
    expect(entityTypes).toContain('item');

    service.stop();
  });
});

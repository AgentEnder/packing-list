/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SyncService, getSyncService, initializeSyncService } from './sync.js';
import { getDatabase } from '@packing-list/offline-storage';
import { TripChange } from '@packing-list/model';

// Mock Supabase
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

// Mock the storage modules but let getDatabase and ConflictsStorage work with fake-indexeddb
vi.mock('@packing-list/offline-storage', async () => {
  const actual = await vi.importActual('@packing-list/offline-storage');
  return {
    ...actual,
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
    // Let ConflictsStorage work with real fake-indexeddb
    ConflictsStorage: actual.ConflictsStorage,
  };
});

describe('SyncService', () => {
  let syncService: SyncService;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Clear the IndexedDB database before each test
    const db = await getDatabase();
    const tx = db.transaction(['syncChanges', 'syncMetadata'], 'readwrite');

    // Clear all data
    try {
      await tx.objectStore('syncChanges').clear();
      await tx.objectStore('syncMetadata').clear();
      await tx.done;
    } catch {
      // Ignore errors if stores don't exist yet
    }

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

      // lastSyncTimestamp should be 0 initially
      expect(state.lastSyncTimestamp).toBe(0);
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
      const change: TripChange = {
        entityType: 'trip' as const,
        entityId: 'test-trip-1',
        operation: 'create' as const,
        data: {
          id: 'test-trip-1',
          title: 'Test Trip',
          days: [],
          tripEvents: [],
        },
        userId: 'user-123',
        version: 1,
        timestamp: Date.now(),
        synced: false,
        id: 'change-1',
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
      const localChanges: TripChange[] = [
        {
          entityType: 'trip' as const,
          entityId: 'local-trip-1',
          operation: 'create' as const,
          data: {
            id: 'local-trip-1',
            title: 'Local Trip',
            days: [],
            tripEvents: [],
          },
          userId: 'local-user',
          version: 1,
          timestamp: Date.now(),
          synced: false,
          id: 'change-1',
        },
        {
          entityType: 'trip' as const,
          entityId: 'local-trip-2',
          operation: 'create' as const,
          data: {
            id: 'local-trip-2',
            title: 'Local Shared Trip',
            days: [],
            tripEvents: [],
          },
          userId: 'local-shared-user',
          version: 1,
          timestamp: Date.now(),
          synced: false,
          id: 'change-2',
        },
        {
          entityType: 'trip' as const,
          entityId: 'local-trip-3',
          operation: 'create' as const,
          data: {
            id: 'local-trip-3',
            title: 'Local Guest Trip',
            days: [],
            tripEvents: [],
          },
          userId: 'local-guest-123',
          version: 1,
          timestamp: Date.now(),
          synced: false,
          id: 'change-3',
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
      const changes: TripChange[] = [
        {
          entityType: 'trip' as const,
          entityId: 'local-trip',
          operation: 'create' as const,
          data: {
            id: 'local-trip',
            title: 'Local Trip',
            days: [],
            tripEvents: [],
          },
          userId: 'local-user',
          version: 1,
          timestamp: Date.now(),
          synced: false,
          id: 'change-1',
        },
        {
          entityType: 'trip' as const,
          entityId: 'regular-trip',
          operation: 'create' as const,
          data: {
            id: 'regular-trip',
            title: 'Regular Trip',
            days: [],
            tripEvents: [],
          },
          userId: 'user-123',
          version: 1,
          timestamp: Date.now(),
          synced: false,
          id: 'change-2',
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
      const changes: TripChange[] = [
        {
          entityType: 'trip' as const,
          entityId: 'trip-1',
          operation: 'create' as const,
          data: {
            id: 'trip-1',
            title: 'Original Trip',
            days: [],
            tripEvents: [],
          },
          userId: 'user-123',
          version: 1,
          timestamp: Date.now(),
          synced: false,
          id: 'change-1',
        },
        {
          entityType: 'trip' as const,
          entityId: 'trip-1',
          operation: 'update' as const,
          data: {
            id: 'trip-1',
            title: 'Updated Trip',
            days: [],
            tripEvents: [],
          },
          userId: 'user-123',
          version: 2,
          timestamp: Date.now(),
          synced: false,
          id: 'change-2',
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

      // Trigger a state change - trackChange calls notifySubscribers
      await syncService.trackChange({
        entityType: 'trip' as const,
        entityId: 'test-trip',
        operation: 'create' as const,
        data: {
          id: 'test-trip',
          title: 'Test',
          days: [],
          tripEvents: [],
        },
        userId: 'user-123',
        version: 1,
      });

      // Add a small delay to ensure async operations complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should have been called at least once
      expect(callback).toHaveBeenCalled();
      expect(notifications.length).toBeGreaterThan(0);

      // Test unsubscribe
      unsubscribe();

      // Clear previous calls
      callback.mockClear();

      // Trigger another change
      await syncService.trackChange({
        entityType: 'trip' as const,
        entityId: 'test-trip-2',
        operation: 'create' as const,
        data: {
          id: 'test-trip-2',
          title: 'Test 2',
          days: [],
          tripEvents: [],
        },
        userId: 'user-123',
        version: 1,
      });

      // Add delay before checking
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should not have been called after unsubscribe
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle multiple subscribers', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      syncService.subscribe(callback1);
      syncService.subscribe(callback2);

      // Trigger a change that calls notifySubscribers
      await syncService.trackChange({
        entityType: 'trip' as const,
        entityId: 'test-trip',
        operation: 'create' as const,
        data: {
          id: 'test-trip',
          title: 'Test',
          days: [],
          tripEvents: [],
        },
        userId: 'user-123',
        version: 1,
      });

      // Add delay to ensure async operations complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should handle subscriber errors gracefully', async () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Subscriber error');
      });
      const normalCallback = vi.fn();

      syncService.subscribe(errorCallback);
      syncService.subscribe(normalCallback);

      // This should not throw despite the error in errorCallback
      await syncService.trackChange({
        entityType: 'trip' as const,
        entityId: 'test-trip',
        operation: 'create' as const,
        data: {
          id: 'test-trip',
          title: 'Test',
          days: [],
          tripEvents: [],
        },
        userId: 'user-123',
        version: 1,
      });

      // Add delay to ensure async operations complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
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
        data: {
          id: 'test-trip',
          title: 'Test',
          days: [],
          tripEvents: [],
        },
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
          data: {
            id: 'trip-1',
            title: 'Trip 1',
            days: [],
            tripEvents: [],
          },
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

    try {
      // Test normal initialization
      const service = await initializeSyncService();
      expect(service).toBeInstanceOf(SyncService);

      // Clean up
      service.stop();

      // Test that the service is resilient to various initialization scenarios
      expect(true).toBe(true); // This test verifies no unhandled errors occur
    } catch (error) {
      // Should not throw under normal circumstances
      expect(error).toBeUndefined();
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
      data: {
        id: 'integration-trip-1',
        title: 'Business Trip',
        days: [],
        tripEvents: [],
      },
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
      (change) => change.userId === 'integration-user-123'
    );

    expect(ourChanges).toHaveLength(3);

    // Clean up
    service.stop();
  });
});

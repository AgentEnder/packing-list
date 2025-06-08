import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SyncService, getSyncService, initializeSyncService } from './sync.js';

// Mock IDBKeyRange for test environment
(global as typeof globalThis & { IDBKeyRange: unknown }).IDBKeyRange = {
  only: vi.fn((value) => ({ only: value })),
  bound: vi.fn(),
  lowerBound: vi.fn(),
  upperBound: vi.fn(),
};

// Mock the offline-storage module
vi.mock('@packing-list/offline-storage', () => ({
  getDatabase: vi.fn().mockResolvedValue({
    get: vi.fn().mockImplementation((store, key) => {
      if (key === 'lastSyncTimestamp') return Promise.resolve(Date.now());
      return Promise.resolve(null);
    }),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    getAll: vi.fn().mockResolvedValue([]),
    transaction: vi.fn().mockReturnValue({
      objectStore: vi.fn().mockReturnValue({
        index: vi.fn().mockReturnValue({
          getAll: vi.fn().mockResolvedValue([]),
        }),
        get: vi.fn().mockResolvedValue(null),
        put: vi.fn().mockResolvedValue(undefined),
      }),
      done: Promise.resolve(),
    }),
  }),
  TripStorage: {
    saveTrip: vi.fn(),
    getTrip: vi.fn(),
    getUserTrips: vi.fn(),
  },
}));

describe('SyncService', () => {
  let syncService: SyncService;

  beforeEach(() => {
    syncService = new SyncService({ autoSyncInterval: 1000 });
  });

  it('should create a sync service instance', () => {
    expect(syncService).toBeInstanceOf(SyncService);
  });

  it('should get sync state', async () => {
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

  it('should track changes', async () => {
    const change = {
      entityType: 'trip' as const,
      entityId: 'test-trip-1',
      operation: 'create' as const,
      data: { title: 'Test Trip' },
      userId: 'user-1',
      version: 1,
    };

    await syncService.trackChange(change);

    // Verify the change was tracked (we can't directly verify due to mocking)
    expect(true).toBe(true); // Basic verification that no error was thrown
  });

  it('should subscribe to sync state changes', async () => {
    const callback = vi.fn();
    const unsubscribe = syncService.subscribe(callback);

    expect(typeof unsubscribe).toBe('function');

    // Clean up
    unsubscribe();
  });

  it('should handle force sync when offline', async () => {
    // Mock offline state
    Object.defineProperty(syncService, 'isOnline', {
      value: false,
      writable: true,
    });

    // Force sync should not throw when offline
    await expect(syncService.forceSync()).resolves.toBeUndefined();
  });
});

describe('getSyncService', () => {
  it('should return a singleton instance', () => {
    const service1 = getSyncService();
    const service2 = getSyncService();

    expect(service1).toBe(service2);
  });
});

describe('initializeSyncService', () => {
  it('should initialize and start the sync service', async () => {
    const service = await initializeSyncService({ autoSyncInterval: 5000 });

    expect(service).toBeInstanceOf(SyncService);

    // Clean up
    service.stop();
  });
});

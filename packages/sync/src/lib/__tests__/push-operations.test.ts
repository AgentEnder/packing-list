/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SyncService } from '../sync.js';
import { createTripChange, createPersonChange } from './test-utils.js';

describe('Push Operations - Real SyncService', () => {
  let syncService: SyncService;
  let mockSupabaseTable: any;
  let mockSupabase: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Create mocks for this test
    mockSupabaseTable = {
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    };

    mockSupabase = {
      from: vi.fn().mockReturnValue(mockSupabaseTable),
    };

    // Mock the modules dynamically
    vi.doMock('@packing-list/supabase', () => ({
      supabase: mockSupabase,
      isSupabaseAvailable: vi.fn().mockReturnValue(true),
    }));

    vi.doMock('@packing-list/offline-storage', () => ({
      getDatabase: vi.fn().mockResolvedValue({
        get: vi.fn().mockResolvedValue(0),
        put: vi.fn().mockResolvedValue(undefined),
        transaction: vi.fn().mockReturnValue({
          objectStore: vi.fn().mockReturnValue({
            getAll: vi.fn().mockResolvedValue([]),
            get: vi.fn().mockResolvedValue(null),
            put: vi.fn().mockResolvedValue(undefined),
            delete: vi.fn().mockResolvedValue(undefined),
          }),
          done: Promise.resolve(),
        }),
      }),
      ConflictsStorage: {
        getAllConflicts: vi.fn().mockResolvedValue([]),
      },
    }));

    vi.doMock('@packing-list/connectivity', () => ({
      getConnectivityService: vi.fn().mockReturnValue({
        getState: vi
          .fn()
          .mockReturnValue({ isOnline: true, isConnected: true }),
        subscribe: vi.fn().mockReturnValue(() => {
          // Unsubscribe function
        }),
      }),
    }));

    // Create real SyncService with mocked dependencies
    syncService = new SyncService({
      demoMode: false,
      autoSyncInterval: 1000000, // Very long interval to prevent auto-sync
    });
  });

  afterEach(() => {
    syncService.stop();
    vi.doUnmock('@packing-list/supabase');
    vi.doUnmock('@packing-list/offline-storage');
    vi.doUnmock('@packing-list/connectivity');
  });

  describe('Trip Push Operations', () => {
    it('should push trip creation correctly', async () => {
      const tripChange = createTripChange({
        operation: 'create',
        entityId: 'trip-123',
        userId: 'user-456',
        version: 1,
        title: 'Summer Vacation',
        description: 'A fun summer trip',
        days: [{ date: '2024-07-01', activities: ['beach'] }],
        tripEvents: [{ type: 'departure', time: '10:00' }],
        settings: { notifications: true },
      });

      // Use the private method via type assertion for testing
      const syncServiceAny = syncService as any;
      await syncServiceAny.pushTripChange(tripChange);

      expect(mockSupabase.from).toHaveBeenCalledWith('trips');
      expect(mockSupabaseTable.insert).toHaveBeenCalledWith({
        id: 'trip-123',
        user_id: 'user-456',
        title: 'Summer Vacation',
        description: 'A fun summer trip',
        days: [{ date: '2024-07-01', activities: ['beach'] }],
        trip_events: [{ type: 'departure', time: '10:00' }],
        settings: { notifications: true },
        version: 1,
      });
    });

    it('should push trip update correctly', async () => {
      const tripChange = createTripChange({
        operation: 'update',
        entityId: 'trip-123',
        userId: 'user-456',
        version: 2,
        title: 'Updated Summer Vacation',
        description: 'Updated description',
        settings: { notifications: false },
      });

      const syncServiceAny = syncService as any;
      await syncServiceAny.pushTripChange(tripChange);

      expect(mockSupabase.from).toHaveBeenCalledWith('trips');
      expect(mockSupabaseTable.update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Summer Vacation',
          description: 'Updated description',
          version: 2,
          updated_at: expect.any(String),
        })
      );
    });

    it('should push trip deletion correctly', async () => {
      const tripChange = createTripChange({
        operation: 'delete',
        entityId: 'trip-123',
        userId: 'user-456',
        version: 3,
      });

      const syncServiceAny = syncService as any;
      await syncServiceAny.pushTripChange(tripChange);

      expect(mockSupabase.from).toHaveBeenCalledWith('trips');
      expect(mockSupabaseTable.update).toHaveBeenCalledWith({
        is_deleted: true,
        updated_at: expect.any(String),
      });
    });

    it('should handle trip with empty title', async () => {
      const tripChange = createTripChange({
        operation: 'create',
        entityId: 'trip-123',
        userId: 'user-456',
        version: 1,
        title: '',
      });

      const syncServiceAny = syncService as any;
      await syncServiceAny.pushTripChange(tripChange);

      expect(mockSupabaseTable.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Untitled Trip', // Should default to this
        })
      );
    });
  });

  describe('Person Push Operations', () => {
    it('should push person creation correctly', async () => {
      const personChange = createPersonChange({
        operation: 'create',
        entityId: 'person-123',
        userId: 'user-456',
        tripId: 'trip-789',
        version: 1,
        name: 'John Doe',
        age: 30,
        gender: 'male',
        settings: { dietary: ['vegetarian'] },
      });

      const syncServiceAny = syncService as any;
      await syncServiceAny.pushPersonChange(personChange);

      expect(mockSupabase.from).toHaveBeenCalledWith('trip_people');
      expect(mockSupabaseTable.insert).toHaveBeenCalledWith({
        trip_id: 'trip-789',
        name: 'John Doe',
        age: 30,
        gender: 'male',
        settings: { dietary: ['vegetarian'] },
        version: 1,
      });
    });

    it('should push person update correctly', async () => {
      const personChange = createPersonChange({
        operation: 'update',
        entityId: 'person-123',
        version: 2,
        name: 'John Smith',
        age: 31,
        gender: 'male',
        settings: { dietary: ['vegan'] },
      });

      const syncServiceAny = syncService as any;
      await syncServiceAny.pushPersonChange(personChange);

      expect(mockSupabaseTable.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Smith',
          age: 31,
          gender: 'male',
          settings: { dietary: ['vegan'] },
          version: 2,
          updated_at: expect.any(String),
        })
      );
    });

    it('should push person deletion correctly', async () => {
      const personChange = createPersonChange({
        operation: 'delete',
        entityId: 'person-123',
        version: 3,
      });

      const syncServiceAny = syncService as any;
      await syncServiceAny.pushPersonChange(personChange);

      expect(mockSupabaseTable.update).toHaveBeenCalledWith({
        is_deleted: true,
        updated_at: expect.any(String),
      });
    });
  });

  describe('Error handling', () => {
    it('should handle supabase errors gracefully', async () => {
      // Mock an error from supabase
      mockSupabaseTable.insert.mockResolvedValueOnce({
        error: new Error('DB Error'),
      });

      const tripChange = createTripChange({
        operation: 'create',
        title: 'Test Trip',
      });

      const syncServiceAny = syncService as any;

      await expect(syncServiceAny.pushTripChange(tripChange)).rejects.toThrow(
        'DB Error'
      );
    });
  });
});

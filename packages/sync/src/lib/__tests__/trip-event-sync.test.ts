import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SyncService, resetSyncService } from '../sync.js';
import { deepDiff } from '../deep-diff-utils.js';
import { createTripChange } from './test-utils.js';
import type { Trip, TripEvent } from '@packing-list/model';

// Mock the supabase client
vi.mock('@packing-list/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      gte: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('Trip Event Sync Conflicts', () => {
  let syncService: SyncService;

  beforeEach(() => {
    vi.clearAllMocks();
    syncService = new SyncService({
      demoMode: false,
      autoSyncInterval: 1000000,
    });
  });

  afterEach(() => {
    syncService.stop();
    resetSyncService();
  });

  it('should detect conflicts when trip event IDs are different', () => {
    // Create a trip with client-generated trip event IDs
    const localTripEvents: TripEvent[] = [
      {
        id: 'client-event-1',
        type: 'leave_home',
        date: '2024-01-15',
        notes: 'Flight at 8:30 AM',
      },
      {
        id: 'client-event-2',
        type: 'arrive_destination',
        date: '2024-01-15',
        location: 'London',
        notes: 'Hotel check-in at 3 PM',
      },
    ];

    // Simulate server returning different IDs for the same events
    const serverTripEvents: TripEvent[] = [
      {
        id: 'server-event-1',
        type: 'leave_home',
        date: '2024-01-15',
        notes: 'Flight at 8:30 AM',
      },
      {
        id: 'server-event-2',
        type: 'arrive_destination',
        date: '2024-01-15',
        location: 'London',
        notes: 'Hotel check-in at 3 PM',
      },
    ];

    const localTrip: Partial<Trip> = {
      id: 'trip-123',
      title: 'London Trip',
      tripEvents: localTripEvents,
      version: 1,
    };

    const serverTrip: Partial<Trip> = {
      id: 'trip-123',
      title: 'London Trip',
      tripEvents: serverTripEvents,
      version: 1,
    };

    // Perform deep diff analysis
    const diffResult = deepDiff(
      localTrip as Record<string, unknown>,
      serverTrip as Record<string, unknown>,
      ['lastSyncedAt', 'createdAt', 'updatedAt', 'version']
    );

    // This should detect conflicts due to different trip event IDs
    expect(diffResult.hasConflicts).toBe(true);
    expect(diffResult.conflicts).toHaveLength(2); // Two trip events = two ID conflicts
    expect(diffResult.conflicts[0].path).toBe('tripEvents.0.id');
    expect(diffResult.conflicts[0].type).toBe('modified');
    expect(diffResult.conflicts[1].path).toBe('tripEvents.1.id');
    expect(diffResult.conflicts[1].type).toBe('modified');
  });

  it('should not detect conflicts when trip events are identical', () => {
    const tripEvents: TripEvent[] = [
      {
        id: 'same-event-1',
        type: 'leave_home',
        date: '2024-01-15',
        notes: 'Flight at 8:30 AM',
      },
      {
        id: 'same-event-2',
        type: 'arrive_destination',
        date: '2024-01-15',
        location: 'London',
        notes: 'Hotel check-in at 3 PM',
      },
    ];

    const localTrip: Partial<Trip> = {
      id: 'trip-123',
      title: 'London Trip',
      tripEvents,
      version: 1,
    };

    const serverTrip: Partial<Trip> = {
      id: 'trip-123',
      title: 'London Trip',
      tripEvents,
      version: 1,
    };

    // Perform deep diff analysis
    const diffResult = deepDiff(
      localTrip as Record<string, unknown>,
      serverTrip as Record<string, unknown>,
      ['lastSyncedAt', 'createdAt', 'updatedAt', 'version']
    );

    // This should NOT detect conflicts when trip events are identical
    expect(diffResult.hasConflicts).toBe(false);
  });

  it('should detect conflicts when trip event content is different', () => {
    const localTripEvents: TripEvent[] = [
      {
        id: 'event-1',
        type: 'leave_home',
        date: '2024-01-15',
        notes: 'Flight at 8:30 AM',
      },
    ];

    const serverTripEvents: TripEvent[] = [
      {
        id: 'event-1',
        type: 'leave_home',
        date: '2024-01-15',
        notes: 'Flight at 9:00 AM', // Different time
      },
    ];

    const localTrip: Partial<Trip> = {
      id: 'trip-123',
      title: 'London Trip',
      tripEvents: localTripEvents,
      version: 1,
    };

    const serverTrip: Partial<Trip> = {
      id: 'trip-123',
      title: 'London Trip',
      tripEvents: serverTripEvents,
      version: 1,
    };

    // Perform deep diff analysis
    const diffResult = deepDiff(
      localTrip as Record<string, unknown>,
      serverTrip as Record<string, unknown>,
      ['lastSyncedAt', 'createdAt', 'updatedAt', 'version']
    );

    // This should detect conflicts due to different trip event content
    expect(diffResult.hasConflicts).toBe(true);
    expect(diffResult.conflicts).toHaveLength(1);
    expect(diffResult.conflicts[0].path).toBe('tripEvents.0.notes');
    expect(diffResult.conflicts[0].type).toBe('modified');
  });

  it('should preserve trip event IDs through the sync process', async () => {
    const originalEventId = 'client-generated-event-123';

    // Create a trip with client-generated trip event IDs
    const tripChange = createTripChange({
      operation: 'create',
      entityId: 'trip-123',
      userId: 'user-456',
      version: 1,
      title: 'London Trip',
      tripEvents: [
        {
          id: originalEventId,
          type: 'leave_home',
          date: '2024-01-15',
          notes: 'Flight at 8:30 AM',
        },
      ],
    });

    // Push the trip to the server (simulated)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const syncServiceAny = syncService as any;
    await syncServiceAny.pushTripChange(tripChange);

    // The logged trip event should have the original client-generated ID
    // This test will fail if something is regenerating the ID
    expect(tripChange.data.tripEvents?.[0].id).toBe(originalEventId);
  });
});

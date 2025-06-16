import { describe, it, expect } from 'vitest';
import type {
  SyncStateSlice,
  SyncActions,
  SyncStateUpdateCallback,
  TrackChangeCallback,
  EntityCallbacks,
  EntityExistence,
} from '../types.js';
import type { SyncConflict, Trip, Person, TripItem } from '@packing-list/model';

describe('Sync State Types', () => {
  describe('SyncStateSlice', () => {
    it('should have correct structure', () => {
      const mockSlice: SyncStateSlice = {
        syncState: {
          lastSyncTimestamp: null,
          pendingChanges: [],
          isOnline: true,
          isSyncing: false,
          conflicts: [],
        },
        isInitialized: false,
        lastError: null,
      };

      expect(mockSlice).toBeDefined();
      expect(mockSlice.syncState).toBeDefined();
      expect(mockSlice.isInitialized).toBe(false);
      expect(mockSlice.lastError).toBe(null);
    });

    it('should allow optional lastError', () => {
      const mockSlice: SyncStateSlice = {
        syncState: {
          lastSyncTimestamp: Date.now(),
          pendingChanges: [],
          isOnline: false,
          isSyncing: true,
          conflicts: [],
        },
        isInitialized: true,
        lastError: 'Test error',
      };

      expect(mockSlice.lastError).toBe('Test error');
    });
  });

  describe('SyncActions', () => {
    it('should support all action types', () => {
      const actions: SyncActions[] = [
        { type: 'SET_SYNC_STATE', payload: { isOnline: false } },
        { type: 'SET_SYNC_INITIALIZED', payload: true },
        { type: 'ADD_SYNC_CONFLICT', payload: {} as SyncConflict },
        { type: 'REMOVE_SYNC_CONFLICT', payload: 'conflict-id' },
        { type: 'CLEAR_SYNC_CONFLICTS' },
        { type: 'SET_SYNC_CONFLICTS', payload: [] },
        { type: 'SET_SYNC_ONLINE_STATUS', payload: true },
        { type: 'SET_SYNC_SYNCING_STATUS', payload: false },
        { type: 'UPDATE_LAST_SYNC_TIMESTAMP', payload: Date.now() },
        { type: 'SET_SYNC_PENDING_CHANGES', payload: [] },
        { type: 'SET_SYNC_ERROR', payload: 'error' },
        { type: 'RESET_SYNC_STATE' },
        { type: 'MERGE_SYNCED_TRIP', payload: {} as Trip },
        { type: 'MERGE_SYNCED_PERSON', payload: {} as Person },
        { type: 'MERGE_SYNCED_ITEM', payload: {} as TripItem },
        {
          type: 'TRACK_SYNC_CHANGE',
          payload: {
            entityType: 'trip',
            entityId: 'id',
            operation: 'create',
            data: {},
            userId: 'user',
            version: 1,
          },
        },
      ];

      expect(actions).toHaveLength(16);
      actions.forEach((action) => {
        expect(action.type).toBeDefined();
      });
    });
  });

  describe('Callback Types', () => {
    it('should define SyncStateUpdateCallback correctly', () => {
      const callback: SyncStateUpdateCallback = (slice: SyncStateSlice) => {
        expect(slice.syncState).toBeDefined();
        expect(typeof slice.isInitialized).toBe('boolean');
      };

      const mockSlice: SyncStateSlice = {
        syncState: {
          lastSyncTimestamp: null,
          pendingChanges: [],
          isOnline: true,
          isSyncing: false,
          conflicts: [],
        },
        isInitialized: true,
        lastError: null,
      };

      callback(mockSlice);
    });

    it('should define TrackChangeCallback correctly', () => {
      const callback: TrackChangeCallback = (change) => {
        expect(change.entityType).toBeDefined();
        expect(change.entityId).toBeDefined();
        expect(change.operation).toBeDefined();
      };

      callback({
        entityType: 'trip',
        entityId: 'trip-1',
        operation: 'create',
        data: { id: 'trip-1', title: 'Test' },
        userId: 'user-1',
        version: 1,
      });
    });
  });

  describe('EntityCallbacks', () => {
    it('should define optional callback functions', () => {
      const callbacks: EntityCallbacks = {
        onTripUpsert: (trip: Trip) => {
          expect(trip.id).toBeDefined();
          expect(trip.title).toBeDefined();
        },
        onPersonUpsert: (person: Person) => {
          expect(person.id).toBeDefined();
          expect(person.name).toBeDefined();
        },
        onItemUpsert: (item: TripItem) => {
          expect(item.id).toBeDefined();
          expect(item.name).toBeDefined();
        },
      };

      expect(callbacks.onTripUpsert).toBeDefined();
      expect(callbacks.onPersonUpsert).toBeDefined();
      expect(callbacks.onItemUpsert).toBeDefined();
    });

    it('should allow undefined callbacks', () => {
      const callbacks: EntityCallbacks = {};

      expect(callbacks.onTripUpsert).toBeUndefined();
      expect(callbacks.onPersonUpsert).toBeUndefined();
      expect(callbacks.onItemUpsert).toBeUndefined();
    });
  });

  describe('EntityExistence', () => {
    it('should define existence check functions', () => {
      const existence: EntityExistence = {
        tripExists: (tripId: string) => {
          expect(typeof tripId).toBe('string');
          return true;
        },
        personExists: (personId: string, tripId: string) => {
          expect(typeof personId).toBe('string');
          expect(typeof tripId).toBe('string');
          return false;
        },
        itemExists: (itemId: string, tripId: string) => {
          expect(typeof itemId).toBe('string');
          expect(typeof tripId).toBe('string');
          return true;
        },
      };

      expect(existence.tripExists('trip-1')).toBe(true);
      expect(existence.personExists('person-1', 'trip-1')).toBe(false);
      expect(existence.itemExists('item-1', 'trip-1')).toBe(true);
    });
  });
});

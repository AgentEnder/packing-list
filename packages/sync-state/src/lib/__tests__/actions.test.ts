import { describe, it, expect } from 'vitest';
import type {
  SyncState,
  SyncConflict,
  Trip,
  Person,
  TripItem,
  Change,
} from '@packing-list/model';
import {
  setSyncState,
  setSyncInitialized,
  addSyncConflict,
  removeSyncConflict,
  clearSyncConflicts,
  setSyncConflicts,
  setSyncOnlineStatus,
  setSyncSyncingStatus,
  updateLastSyncTimestamp,
  setSyncPendingChanges,
  setSyncError,
  resetSyncState,
  mergeSyncedTrip,
  mergeSyncedPerson,
  mergeSyncedItem,
  trackSyncChange,
} from '../actions.js';

describe('Sync State Actions', () => {
  describe('Basic sync state actions', () => {
    it('should create setSyncState action', () => {
      const payload: Partial<SyncState> = {
        isOnline: false,
        isSyncing: true,
      };

      const action = setSyncState(payload);

      expect(action).toEqual({
        type: 'SET_SYNC_STATE',
        payload,
      });
    });

    it('should create setSyncInitialized action', () => {
      const action = setSyncInitialized(true);

      expect(action).toEqual({
        type: 'SET_SYNC_INITIALIZED',
        payload: true,
      });
    });

    it('should create setSyncOnlineStatus action', () => {
      const action = setSyncOnlineStatus(false);

      expect(action).toEqual({
        type: 'SET_SYNC_ONLINE_STATUS',
        payload: false,
      });
    });

    it('should create setSyncSyncingStatus action', () => {
      const action = setSyncSyncingStatus(true);

      expect(action).toEqual({
        type: 'SET_SYNC_SYNCING_STATUS',
        payload: true,
      });
    });

    it('should create updateLastSyncTimestamp action', () => {
      const timestamp = Date.now();
      const action = updateLastSyncTimestamp(timestamp);

      expect(action).toEqual({
        type: 'UPDATE_LAST_SYNC_TIMESTAMP',
        payload: timestamp,
      });
    });

    it('should create setSyncPendingChanges action', () => {
      const changes: Change[] = [
        {
          id: 'change-1',
          entityType: 'trip',
          entityId: 'trip-1',
          operation: 'create',
          timestamp: Date.now(),
          synced: false,
          data: {
            id: 'trip-1',
            title: 'Test Trip',
            userId: 'user-1',
            days: [],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            settings: {
              defaultTimeZone: 'UTC',
              packingViewMode: 'by-day',
            },
            version: 1,
            isDeleted: false,
          },
          tripId: 'trip-1',
          userId: 'user-1',
          version: 1,
        },
      ];

      const action = setSyncPendingChanges(changes);

      expect(action).toEqual({
        type: 'SET_SYNC_PENDING_CHANGES',
        payload: changes,
      });
    });

    it('should create setSyncError action with error message', () => {
      const error = 'Sync failed';
      const action = setSyncError(error);

      expect(action).toEqual({
        type: 'SET_SYNC_ERROR',
        payload: error,
      });
    });

    it('should create setSyncError action with null', () => {
      const action = setSyncError(null);

      expect(action).toEqual({
        type: 'SET_SYNC_ERROR',
        payload: null,
      });
    });

    it('should create resetSyncState action', () => {
      const action = resetSyncState();

      expect(action).toEqual({
        type: 'RESET_SYNC_STATE',
      });
    });
  });

  describe('Conflict management actions', () => {
    const mockConflict: SyncConflict = {
      id: 'conflict-1',
      entityType: 'trip',
      entityId: 'trip-1',
      localVersion: {
        id: 'trip-1',
        title: 'Local Trip',
        userId: 'user-1',
        days: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        settings: {
          defaultTimeZone: 'UTC',
          packingViewMode: 'by-day' as const,
        },
        version: 1,
        isDeleted: false,
        defaultItemRules: [],
      } as Trip,
      serverVersion: {
        id: 'trip-1',
        title: 'Remote Trip',
        userId: 'user-1',
        days: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        settings: {
          defaultTimeZone: 'UTC',
          packingViewMode: 'by-day' as const,
        },
        version: 1,
        isDeleted: false,
        defaultItemRules: [],
      } as Trip,
      timestamp: Date.now(),
      conflictType: 'update_conflict',
    };

    it('should create addSyncConflict action', () => {
      const action = addSyncConflict(mockConflict);

      expect(action).toEqual({
        type: 'ADD_SYNC_CONFLICT',
        payload: mockConflict,
      });
    });

    it('should create removeSyncConflict action', () => {
      const conflictId = 'conflict-1';
      const action = removeSyncConflict(conflictId);

      expect(action).toEqual({
        type: 'REMOVE_SYNC_CONFLICT',
        payload: conflictId,
      });
    });

    it('should create clearSyncConflicts action', () => {
      const action = clearSyncConflicts();

      expect(action).toEqual({
        type: 'CLEAR_SYNC_CONFLICTS',
      });
    });

    it('should create setSyncConflicts action', () => {
      const conflicts = [mockConflict];
      const action = setSyncConflicts(conflicts);

      expect(action).toEqual({
        type: 'SET_SYNC_CONFLICTS',
        payload: conflicts,
      });
    });
  });

  describe('Entity merge actions', () => {
    it('should create mergeSyncedTrip action', () => {
      const trip: Trip = {
        id: 'trip-1',
        userId: 'user-1',
        title: 'Test Trip',
        description: 'A test trip',
        days: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        settings: {
          defaultTimeZone: 'UTC',
          packingViewMode: 'by-day',
        },
        version: 1,
        isDeleted: false,
        defaultItemRules: [],
      };

      const action = mergeSyncedTrip(trip);

      expect(action).toEqual({
        type: 'MERGE_SYNCED_TRIP',
        payload: trip,
      });
    });

    it('should create mergeSyncedPerson action', () => {
      const person: Person = {
        id: 'person-1',
        tripId: 'trip-1',
        name: 'John Doe',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        version: 1,
        isDeleted: false,
      };

      const action = mergeSyncedPerson(person);

      expect(action).toEqual({
        type: 'MERGE_SYNCED_PERSON',
        payload: person,
      });
    });

    it('should create mergeSyncedItem action', () => {
      const item: TripItem = {
        id: 'item-1',
        tripId: 'trip-1',
        name: 'Test Item',
        category: 'clothing',
        quantity: 2,
        packed: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        version: 1,
        isDeleted: false,
      };

      const action = mergeSyncedItem(item);

      expect(action).toEqual({
        type: 'MERGE_SYNCED_ITEM',
        payload: item,
      });
    });
  });

  describe('Change tracking actions', () => {
    it('should create trackSyncChange action', () => {
      const changePayload: Omit<Change, 'id' | 'timestamp' | 'synced'> = {
        entityType: 'trip',
        entityId: 'trip-1',
        operation: 'update',
        data: {},
        userId: 'user-1',
        version: 1,
      };

      const action = trackSyncChange(changePayload);

      expect(action).toEqual({
        type: 'TRACK_SYNC_CHANGE',
        payload: changePayload,
      });
    });

    it('should create trackSyncChange action for create operation', () => {
      const changePayload: Omit<Change, 'id' | 'timestamp' | 'synced'> = {
        entityType: 'person',
        entityId: 'person-1',
        operation: 'create',
        data: {},
        userId: 'user-1',
        version: 1,
      };

      const action = trackSyncChange(changePayload);

      expect(action).toEqual({
        type: 'TRACK_SYNC_CHANGE',
        payload: changePayload,
      });
    });

    it('should create trackSyncChange action for delete operation', () => {
      const changePayload: Omit<Change, 'id' | 'timestamp' | 'synced'> = {
        entityType: 'item',
        entityId: 'item-1',
        operation: 'delete',
        data: {},
        userId: 'user-1',
        version: 1,
      };

      const action = trackSyncChange(changePayload);

      expect(action).toEqual({
        type: 'TRACK_SYNC_CHANGE',
        payload: changePayload,
      });
    });
  });
});

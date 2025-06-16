import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  SyncState,
  SyncConflict,
  Trip,
  Person,
  TripItem,
  Change,
} from '@packing-list/model';
import type {
  SyncStateSlice,
  EntityCallbacks,
  EntityExistence,
  SyncActions,
} from '../types.js';
import {
  initialSyncState,
  syncStateReducer,
  createEntityMergeReducer,
  createChangeTrackingReducer,
} from '../reducers.js';
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

// Mock console.log to avoid noise in tests
vi.mock('console', () => ({
  log: vi.fn(),
}));

describe('Sync State Reducers', () => {
  describe('initialSyncState', () => {
    it('should have correct initial state structure', () => {
      expect(initialSyncState).toEqual({
        syncState: {
          lastSyncTimestamp: null,
          pendingChanges: [],
          isOnline: true,
          isSyncing: false,
          conflicts: [],
        },
        isInitialized: false,
        lastError: null,
      });
    });
  });

  describe('syncStateReducer', () => {
    let state: SyncStateSlice;

    beforeEach(() => {
      state = { ...initialSyncState };
    });

    it('should handle SET_SYNC_STATE action', () => {
      const payload: Partial<SyncState> = {
        isOnline: false,
        isSyncing: true,
      };

      const result = syncStateReducer(state, setSyncState(payload));

      expect(result).toEqual({
        ...state,
        syncState: {
          ...state.syncState,
          isOnline: false,
          isSyncing: true,
        },
      });
    });

    it('should handle SET_SYNC_INITIALIZED action', () => {
      const result = syncStateReducer(state, setSyncInitialized(true));

      expect(result).toEqual({
        ...state,
        isInitialized: true,
      });
    });

    it('should handle SET_SYNC_ONLINE_STATUS action', () => {
      const result = syncStateReducer(state, setSyncOnlineStatus(false));

      expect(result).toEqual({
        ...state,
        syncState: {
          ...state.syncState,
          isOnline: false,
        },
      });
    });

    it('should handle SET_SYNC_SYNCING_STATUS action', () => {
      const result = syncStateReducer(state, setSyncSyncingStatus(true));

      expect(result).toEqual({
        ...state,
        syncState: {
          ...state.syncState,
          isSyncing: true,
        },
      });
    });

    it('should handle UPDATE_LAST_SYNC_TIMESTAMP action', () => {
      const timestamp = Date.now();
      const result = syncStateReducer(
        state,
        updateLastSyncTimestamp(timestamp)
      );

      expect(result).toEqual({
        ...state,
        syncState: {
          ...state.syncState,
          lastSyncTimestamp: timestamp,
        },
      });
    });

    it('should handle SET_SYNC_PENDING_CHANGES action', () => {
      const changes: Change[] = [
        {
          id: 'change-1',
          entityType: 'trip' as const,
          entityId: 'trip-1',
          operation: 'create' as const,
          data: {
            id: 'trip-1',
            title: 'Test Trip',
            userId: 'user-1',
            days: [],
            createdAt: '2024-01-01T00:00:00Z',
          },
          timestamp: Date.now(),
          userId: 'user-1',
          version: 1,
          synced: false,
        },
      ];

      const result = syncStateReducer(state, setSyncPendingChanges(changes));

      expect(result).toEqual({
        ...state,
        syncState: {
          ...state.syncState,
          pendingChanges: changes,
        },
      });
    });

    it('should handle SET_SYNC_ERROR action with error message', () => {
      const error = 'Sync failed';
      const result = syncStateReducer(state, setSyncError(error));

      expect(result).toEqual({
        ...state,
        lastError: error,
      });
    });

    it('should handle SET_SYNC_ERROR action with null', () => {
      // First set an error
      const stateWithError = syncStateReducer(
        state,
        setSyncError('Some error')
      );

      // Then clear it
      const result = syncStateReducer(stateWithError, setSyncError(null));

      expect(result).toEqual({
        ...state,
        lastError: null,
      });
    });

    it('should handle RESET_SYNC_STATE action', () => {
      // Modify state first
      const modifiedState = {
        ...state,
        isInitialized: true,
        lastError: 'Some error',
        syncState: {
          ...state.syncState,
          isOnline: false,
          isSyncing: true,
        },
      };

      const result = syncStateReducer(modifiedState, resetSyncState());

      expect(result).toEqual(initialSyncState);
    });

    describe('Conflict management', () => {
      const mockConflict: SyncConflict = {
        id: 'conflict-1',
        entityType: 'trip',
        entityId: 'trip-1',
        localVersion: { id: 'trip-1', title: 'Local Trip' },
        serverVersion: { id: 'trip-1', title: 'Server Trip' },
        conflictType: 'update_conflict',
        timestamp: Date.now(),
      };

      it('should handle ADD_SYNC_CONFLICT action', () => {
        const result = syncStateReducer(state, addSyncConflict(mockConflict));

        expect(result).toEqual({
          ...state,
          syncState: {
            ...state.syncState,
            conflicts: [mockConflict],
          },
        });
      });

      it('should not add duplicate conflicts', () => {
        // Add conflict first time
        const stateWithConflict = syncStateReducer(
          state,
          addSyncConflict(mockConflict)
        );

        // Try to add same conflict again
        const result = syncStateReducer(
          stateWithConflict,
          addSyncConflict(mockConflict)
        );

        expect(result.syncState.conflicts).toHaveLength(1);
        expect(result).toEqual(stateWithConflict);
      });

      it('should handle REMOVE_SYNC_CONFLICT action', () => {
        // Add conflict first
        const stateWithConflict = syncStateReducer(
          state,
          addSyncConflict(mockConflict)
        );

        // Remove it
        const result = syncStateReducer(
          stateWithConflict,
          removeSyncConflict('conflict-1')
        );

        expect(result).toEqual({
          ...state,
          syncState: {
            ...state.syncState,
            conflicts: [],
          },
        });
      });

      it('should handle CLEAR_SYNC_CONFLICTS action', () => {
        // Add multiple conflicts
        const conflict2: SyncConflict = { ...mockConflict, id: 'conflict-2' };
        let stateWithConflicts = syncStateReducer(
          state,
          addSyncConflict(mockConflict)
        );
        stateWithConflicts = syncStateReducer(
          stateWithConflicts,
          addSyncConflict(conflict2)
        );

        // Clear all conflicts
        const result = syncStateReducer(
          stateWithConflicts,
          clearSyncConflicts()
        );

        expect(result).toEqual({
          ...state,
          syncState: {
            ...state.syncState,
            conflicts: [],
          },
        });
      });

      it('should handle SET_SYNC_CONFLICTS action', () => {
        const conflicts = [mockConflict, { ...mockConflict, id: 'conflict-2' }];
        const result = syncStateReducer(state, setSyncConflicts(conflicts));

        expect(result).toEqual({
          ...state,
          syncState: {
            ...state.syncState,
            conflicts,
          },
        });
      });
    });

    it('should return unchanged state for unknown actions', () => {
      const result = syncStateReducer(state, {
        type: 'UNKNOWN_ACTION',
      } as unknown as SyncActions);
      expect(result).toBe(state);
    });
  });

  describe('createEntityMergeReducer', () => {
    let entityCallbacks: EntityCallbacks;
    let entityExistence: EntityExistence;
    let entityMergeReducer: ReturnType<typeof createEntityMergeReducer>;
    let state: SyncStateSlice;

    beforeEach(() => {
      entityCallbacks = {
        onTripUpsert: vi.fn(),
        onPersonUpsert: vi.fn(),
        onItemUpsert: vi.fn(),
      };

      entityExistence = {
        tripExists: vi.fn(),
        personExists: vi.fn(),
        itemExists: vi.fn(),
      };

      entityMergeReducer = createEntityMergeReducer(
        entityCallbacks,
        entityExistence
      );
      state = { ...initialSyncState };
    });

    describe('MERGE_SYNCED_TRIP', () => {
      const mockTrip: Trip = {
        id: 'trip-1',
        userId: 'user-1',
        title: 'Test Trip',
        description: 'A test trip',
        days: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: {
          defaultTimeZone: 'UTC',
          packingViewMode: 'by-category',
        },
        version: 1,
        isDeleted: false,
        defaultItemRules: [],
      };

      it('should handle new trip creation', () => {
        vi.mocked(entityExistence.tripExists).mockReturnValue(false);

        const result = entityMergeReducer(state, mergeSyncedTrip(mockTrip));

        expect(entityExistence.tripExists).toHaveBeenCalledWith('trip-1');
        expect(entityCallbacks.onTripUpsert).toHaveBeenCalledWith(mockTrip);
        expect(result).toBe(state); // State unchanged, callbacks handle the actual updates
      });

      it('should handle existing trip update', () => {
        vi.mocked(entityExistence.tripExists).mockReturnValue(true);

        const result = entityMergeReducer(state, mergeSyncedTrip(mockTrip));

        expect(entityExistence.tripExists).toHaveBeenCalledWith('trip-1');
        expect(entityCallbacks.onTripUpsert).toHaveBeenCalledWith(mockTrip);
        expect(result).toBe(state);
      });

      it('should work without onTripUpsert callback', () => {
        entityCallbacks.onTripUpsert = undefined;
        vi.mocked(entityExistence.tripExists).mockReturnValue(false);

        const result = entityMergeReducer(state, mergeSyncedTrip(mockTrip));

        expect(entityExistence.tripExists).toHaveBeenCalledWith('trip-1');
        expect(result).toBe(state);
      });
    });

    describe('MERGE_SYNCED_PERSON', () => {
      const mockPerson: Person = {
        id: 'person-1',
        tripId: 'trip-1',
        name: 'John Doe',
        age: 30,
        gender: 'male',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        isDeleted: false,
      };

      it('should handle new person creation', () => {
        vi.mocked(entityExistence.personExists).mockReturnValue(false);

        const result = entityMergeReducer(state, mergeSyncedPerson(mockPerson));

        expect(entityExistence.personExists).toHaveBeenCalledWith(
          'person-1',
          'trip-1'
        );
        expect(entityCallbacks.onPersonUpsert).toHaveBeenCalledWith(mockPerson);
        expect(result).toBe(state);
      });

      it('should handle existing person update', () => {
        vi.mocked(entityExistence.personExists).mockReturnValue(true);

        const result = entityMergeReducer(state, mergeSyncedPerson(mockPerson));

        expect(entityExistence.personExists).toHaveBeenCalledWith(
          'person-1',
          'trip-1'
        );
        expect(entityCallbacks.onPersonUpsert).toHaveBeenCalledWith(mockPerson);
        expect(result).toBe(state);
      });

      it('should work without onPersonUpsert callback', () => {
        entityCallbacks.onPersonUpsert = undefined;
        vi.mocked(entityExistence.personExists).mockReturnValue(false);

        const result = entityMergeReducer(state, mergeSyncedPerson(mockPerson));

        expect(entityExistence.personExists).toHaveBeenCalledWith(
          'person-1',
          'trip-1'
        );
        expect(result).toBe(state);
      });
    });

    describe('MERGE_SYNCED_ITEM', () => {
      const mockItem: TripItem = {
        id: 'item-1',
        tripId: 'trip-1',
        name: 'Test Item',
        category: 'clothing',
        quantity: 2,
        packed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        isDeleted: false,
      };

      it('should handle new item creation', () => {
        vi.mocked(entityExistence.itemExists).mockReturnValue(false);

        const result = entityMergeReducer(state, mergeSyncedItem(mockItem));

        expect(entityExistence.itemExists).toHaveBeenCalledWith(
          'item-1',
          'trip-1'
        );
        expect(entityCallbacks.onItemUpsert).toHaveBeenCalledWith(mockItem);
        expect(result).toBe(state);
      });

      it('should handle existing item update', () => {
        vi.mocked(entityExistence.itemExists).mockReturnValue(true);

        const result = entityMergeReducer(state, mergeSyncedItem(mockItem));

        expect(entityExistence.itemExists).toHaveBeenCalledWith(
          'item-1',
          'trip-1'
        );
        expect(entityCallbacks.onItemUpsert).toHaveBeenCalledWith(mockItem);
        expect(result).toBe(state);
      });

      it('should work without onItemUpsert callback', () => {
        entityCallbacks.onItemUpsert = undefined;
        vi.mocked(entityExistence.itemExists).mockReturnValue(false);

        const result = entityMergeReducer(state, mergeSyncedItem(mockItem));

        expect(entityExistence.itemExists).toHaveBeenCalledWith(
          'item-1',
          'trip-1'
        );
        expect(result).toBe(state);
      });
    });

    it('should return unchanged state for unknown actions', () => {
      const result = entityMergeReducer(state, {
        type: 'UNKNOWN_ACTION',
      } as unknown as SyncActions);
      expect(result).toBe(state);
    });
  });

  describe('createChangeTrackingReducer', () => {
    let trackChangeCallback: ReturnType<typeof vi.fn>;
    let changeTrackingReducer: ReturnType<typeof createChangeTrackingReducer>;
    let state: SyncStateSlice;

    beforeEach(() => {
      trackChangeCallback = vi.fn();
      changeTrackingReducer = createChangeTrackingReducer(trackChangeCallback);
      state = { ...initialSyncState };
    });

    it('should handle TRACK_SYNC_CHANGE action', () => {
      const changePayload: Change = {
        entityType: 'trip' as const,
        entityId: 'trip-1',
        operation: 'update' as const,
        data: {
          id: 'trip-1',
          title: 'Updated Trip',
          userId: 'user-1',
          days: [],
          createdAt: '2024-01-01T00:00:00Z',
        },
        tripId: 'trip-1',
        timestamp: Date.now(),
        synced: false,
        id: 'change-1',
        userId: 'user-1',
        version: 2,
      };

      const result = changeTrackingReducer(
        state,
        trackSyncChange(changePayload)
      );

      expect(trackChangeCallback).toHaveBeenCalledWith(changePayload);
      expect(result).toBe(state); // State unchanged, callback handles the tracking
    });

    it('should handle different entity types and operations', () => {
      const changes: Change[] = [
        {
          entityType: 'trip' as const,
          entityId: 'trip-1',
          operation: 'create' as const,
          data: {
            id: 'trip-1',
            title: 'New Trip',
            userId: 'user-1',
            days: [],
            createdAt: '2024-01-01T00:00:00Z',
          },
          tripId: 'trip-1',
          timestamp: Date.now(),
          synced: false,
          id: 'change-1',
          userId: 'user-1',
          version: 1,
        },
        {
          entityType: 'person' as const,
          entityId: 'person-1',
          operation: 'update' as const,
          data: {
            id: 'person-1',
            name: 'Updated Name',
            age: 30,
            gender: 'male',
            createdAt: '2024-01-01T00:00:00Z',
          },
          tripId: 'trip-1',
          timestamp: Date.now(),
          synced: false,
          id: 'change-2',
          userId: 'user-1',
          version: 2,
        },
        {
          entityType: 'item' as const,
          entityId: 'item-1',
          operation: 'delete' as const,
          data: {
            id: 'item-1',
            name: 'Test Item',
            category: 'clothing',
            quantity: 2,
            packed: false,
          },
          tripId: 'trip-1',
          timestamp: Date.now(),
          synced: false,
          id: 'change-3',
          userId: 'user-1',
          version: 3,
        },
      ];

      changes.forEach((change) => {
        changeTrackingReducer(state, trackSyncChange(change));
      });

      expect(trackChangeCallback).toHaveBeenCalledTimes(3);
      changes.forEach((change) => {
        expect(trackChangeCallback).toHaveBeenCalledWith(change);
      });
    });

    it('should return unchanged state for unknown actions', () => {
      const result = changeTrackingReducer(state, {
        type: 'UNKNOWN_ACTION',
      } as unknown as SyncActions);
      expect(result).toBe(state);
    });
  });
});

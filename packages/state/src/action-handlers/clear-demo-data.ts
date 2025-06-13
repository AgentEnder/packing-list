import { ConflictsStorage } from '@packing-list/offline-storage';
import type { StoreType } from '../store.js';
import { resetSyncService } from '@packing-list/sync';

export type ClearDemoDataAction = {
  type: 'CLEAR_DEMO_DATA';
};

/**
 * Synchronous Redux action handler to clear demo data from state
 * This removes demo trips and conflicts from Redux state immediately
 * The async IndexedDB operations are handled by the clearDemoDataThunk
 */
export const clearDemoDataHandler = (state: StoreType): StoreType => {
  console.log('🧹 [CLEAR DEMO] Starting demo data cleanup...');

  // Clear demo conflicts from Redux state by filtering out known demo conflicts
  const filteredConflicts = state.sync.syncState.conflicts.filter(
    (conflict) => {
      const isSyncServiceDemo =
        conflict.id.startsWith('demo-conflict-') ||
        conflict.entityId.startsWith('demo-');

      const isReduxDemo =
        /^conflict-\d+$/.test(conflict.id) ||
        /^(person|item)-\d+$/.test(conflict.entityId);

      return !isSyncServiceDemo && !isReduxDemo;
    }
  );

  console.log('✅ [CLEAR DEMO] Demo data cleanup completed');

  return {
    ...state,
    trips: {
      ...state.trips,
      summaries: state.trips.summaries.filter(
        (summary) => summary.tripId !== 'DEMO_TRIP'
      ),
      selectedTripId:
        state.trips.selectedTripId === 'DEMO_TRIP'
          ? null
          : state.trips.selectedTripId,
      byId: Object.fromEntries(
        Object.entries(state.trips.byId).filter(
          ([tripId]) => tripId !== 'DEMO_TRIP'
        )
      ),
    },
    sync: {
      ...state.sync,
      syncState: {
        ...state.sync.syncState,
        conflicts: filteredConflicts,
      },
      isInitialized: false, // Reset sync state
      lastError: null,
    },
  };
};

/**
 * Thunk to clear demo data from IndexedDB and reset sync service
 * This ensures proper timing: IndexedDB is cleared BEFORE sync service restarts
 */
export const clearDemoDataThunk = () => {
  return async (dispatch: (action: ClearDemoDataAction) => void) => {
    console.log('🧹 [CLEAR DEMO THUNK] Starting async cleanup...');

    try {
      // STEP 1: Clear demo conflicts from IndexedDB FIRST (blocking)
      await clearDemoConflictsFromIndexedDB();

      // STEP 2: Dispatch the synchronous Redux action
      dispatch({ type: 'CLEAR_DEMO_DATA' });

      // STEP 3: Reset sync service AFTER IndexedDB is cleared
      await resetSyncServiceAsync();

      console.log('✅ [CLEAR DEMO THUNK] Async cleanup completed successfully');
    } catch (error) {
      console.error('❌ [CLEAR DEMO THUNK] Failed to clear demo data:', error);
    }
  };
};

/**
 * Async helper to reset sync service
 */
async function resetSyncServiceAsync(): Promise<void> {
  try {
    resetSyncService();
    console.log(
      '🔄 [CLEAR DEMO] Reset sync service to prevent demo mode conflicts'
    );
  } catch (error) {
    console.warn('⚠️ [CLEAR DEMO] Could not reset sync service:', error);
  }
}

/**
 * Clear demo conflicts from IndexedDB using ConflictsStorage
 */
async function clearDemoConflictsFromIndexedDB(): Promise<void> {
  try {
    // Only run in browser environment
    if (typeof (globalThis as Record<string, unknown>).window === 'undefined')
      return;

    // Use ConflictsStorage to clear demo conflicts
    const clearedCount = await ConflictsStorage.clearDemoConflicts();

    console.log(
      `🧹 [CLEAR DEMO] Cleared ${clearedCount} demo conflicts from IndexedDB`
    );
  } catch (error) {
    console.warn(
      '⚠️ [CLEAR DEMO] Could not clear demo conflicts from IndexedDB:',
      error
    );
  }
}

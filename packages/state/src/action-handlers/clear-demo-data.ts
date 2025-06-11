import { initialState, StoreType } from '../store.js';

export type ClearDemoDataAction = {
  type: 'CLEAR_DEMO_DATA';
};

export const clearDemoDataHandler = (state: StoreType): StoreType => {
  // Remove any demo trips
  const filteredSummaries = state.trips.summaries.filter(
    (summary) => summary.tripId !== 'DEMO_TRIP'
  );

  const filteredTripsById = Object.fromEntries(
    Object.entries(state.trips.byId).filter(([id]) => id !== 'DEMO_TRIP')
  );

  // Clear demo conflicts from IndexedDB asynchronously
  clearDemoConflictsFromIndexedDB().catch(console.error);

  return {
    ...state,
    trips: {
      summaries: filteredSummaries,
      selectedTripId: null, // Always select the new trip
      byId: filteredTripsById,
    },
    sync: {
      ...initialState.sync,
    },
  };
};

/**
 * Clear demo conflicts from IndexedDB
 * This removes the synthetic conflicts created by the sync service in demo mode
 */
async function clearDemoConflictsFromIndexedDB(): Promise<void> {
  try {
    // Only run in browser environment
    if (typeof document === 'undefined') return;

    // Dynamic import to avoid SSR issues
    const { getDatabase } = await import('@packing-list/offline-storage');
    const db = await getDatabase();

    // Get all conflicts and filter out demo ones
    const allConflicts = await db.getAll('syncConflicts');
    const demoConflictIds = allConflicts
      .filter(
        (conflict) =>
          conflict.id.startsWith('demo-conflict-') ||
          conflict.entityId.startsWith('demo-')
      )
      .map((conflict) => conflict.id);

    // Remove demo conflicts
    for (const conflictId of demoConflictIds) {
      await db.delete('syncConflicts', conflictId);
    }

    console.log(
      `🧹 [CLEAR DEMO] Cleared ${demoConflictIds.length} demo conflicts from IndexedDB`
    );
  } catch (error) {
    console.error(
      '🚨 [CLEAR DEMO] Failed to clear demo conflicts from IndexedDB:',
      error
    );
  }
}

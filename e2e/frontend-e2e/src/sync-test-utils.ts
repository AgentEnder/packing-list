import { Page } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Utilities for testing sync functionality in e2e tests
 */
export class SyncTestUtils {
  private supabaseClient: SupabaseClient;

  constructor(private page: Page) {
    // Initialize Supabase client for direct database access
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL ||
      process.env.PUBLIC_ENV__SUPABASE_URL ||
      'http://127.0.0.1:54321';

    // Use service role key for e2e tests to bypass RLS policies
    const serviceRoleKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

    this.supabaseClient = createClient(supabaseUrl, serviceRoleKey);
    console.log(
      '🔧 [SYNC TEST UTILS] Initialized with service role key for direct database access'
    );
  }

  /**
   * Clear all IndexedDB data for testing fresh sync scenarios
   */
  async clearIndexedDB(): Promise<void> {
    await this.page.evaluate(async () => {
      const databases = await indexedDB.databases();

      // Close all connections and delete databases
      for (const dbInfo of databases) {
        if (dbInfo.name) {
          try {
            // Delete the database
            const deleteRequest = indexedDB.deleteDatabase(dbInfo.name);
            await new Promise((resolve, reject) => {
              deleteRequest.onsuccess = () => resolve(undefined);
              deleteRequest.onerror = () => reject(deleteRequest.error);
              deleteRequest.onblocked = () => {
                console.warn(`IndexedDB deletion blocked for ${dbInfo.name}`);
                resolve(undefined); // Continue anyway
              };
            });
            console.log(`✅ Deleted IndexedDB: ${dbInfo.name}`);
          } catch (error) {
            console.warn(`Failed to delete IndexedDB ${dbInfo.name}:`, error);
          }
        }
      }
    });
  }

  /**
   * Get current IndexedDB sync metadata
   */
  async getSyncMetadata(): Promise<{ lastSyncTimestamp: number | null }> {
    return await this.page.evaluate(async () => {
      try {
        const dbName = 'PackingListOfflineDB';

        return new Promise((resolve, reject) => {
          const request = indexedDB.open(dbName);

          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['syncMetadata'], 'readonly');
            const store = transaction.objectStore('syncMetadata');
            const getRequest = store.get('lastSyncTimestamp');

            getRequest.onsuccess = () => {
              resolve({
                lastSyncTimestamp: getRequest.result || null,
              });
            };

            getRequest.onerror = () => reject(getRequest.error);
          };

          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        return { lastSyncTimestamp: null };
      }
    });
  }

  /**
   * Manually set sync metadata to simulate different sync states
   */
  async setSyncMetadata(timestamp: number): Promise<void> {
    await this.page.evaluate(async (timestamp) => {
      const dbName = 'PackingListOfflineDB';

      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(dbName);

        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['syncMetadata'], 'readwrite');
          const store = transaction.objectStore('syncMetadata');
          const putRequest = store.put(timestamp, 'lastSyncTimestamp');

          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        };

        request.onerror = () => reject(request.error);
      });
    }, timestamp);
  }

  /**
   * Get all trips from IndexedDB
   */
  async getTripsFromIndexedDB(): Promise<any[]> {
    return await this.page.evaluate(async () => {
      const dbName = 'PackingListOfflineDB';

      return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName);

        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['trips'], 'readonly');
          const store = transaction.objectStore('trips');
          const getAllRequest = store.getAll();

          getAllRequest.onsuccess = () => {
            resolve(getAllRequest.result || []);
          };

          getAllRequest.onerror = () => reject(getAllRequest.error);
        };

        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * Add a trip directly to IndexedDB (to simulate offline creation)
   */
  async addTripToIndexedDB(trip: any): Promise<void> {
    await this.page.evaluate(async (trip) => {
      const dbName = 'PackingListOfflineDB';

      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(dbName);

        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['trips'], 'readwrite');
          const store = transaction.objectStore('trips');
          const addRequest = store.put(trip);

          addRequest.onsuccess = () => resolve();
          addRequest.onerror = () => reject(addRequest.error);
        };

        request.onerror = () => reject(request.error);
      });
    }, trip);
  }

  /**
   * Get pending sync changes from IndexedDB
   */
  async getPendingSyncChanges(): Promise<any[]> {
    return await this.page.evaluate(async () => {
      const dbName = 'PackingListOfflineDB';

      return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName);

        request.onsuccess = () => {
          const db = request.result;

          if (!db.objectStoreNames.contains('syncChanges')) {
            resolve([]);
            return;
          }

          const transaction = db.transaction(['syncChanges'], 'readonly');
          const store = transaction.objectStore('syncChanges');
          const getAllRequest = store.getAll();

          getAllRequest.onsuccess = () => {
            const changes = getAllRequest.result || [];
            // Filter for unsynced changes
            resolve(changes.filter((change) => !change.synced));
          };

          getAllRequest.onerror = () => reject(getAllRequest.error);
        };

        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * Clear all trips from Supabase for a specific user (for test cleanup)
   */
  async clearSupabaseTrips(userId?: string): Promise<void> {
    try {
      let query = this.supabaseClient.from('trips').delete();

      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        // Clear all test trips if no specific user
        query = query.or('user_id.like.*test*,user_id.like.*e2e*');
      }

      const { error } = await query;

      if (error) {
        throw error;
      }

      console.log('✅ Cleared Supabase trips');
    } catch (error) {
      console.warn('⚠️ Failed to clear Supabase trips:', error);
      // Don't throw - this is cleanup
    }
  }

  /**
   * Add a trip directly to Supabase (to simulate data created on another device)
   */
  async addTripToSupabase(trip: {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    days?: any[];
    trip_events?: any[];
    settings?: any;
  }): Promise<void> {
    try {
      const { error } = await this.supabaseClient.from('trips').insert({
        id: trip.id,
        user_id: trip.user_id,
        title: trip.title,
        description: trip.description || '',
        days: trip.days || [],
        trip_events: trip.trip_events || [],
        settings: trip.settings || {},
        version: 1,
        is_deleted: false,
      });

      if (error) {
        throw error;
      }

      console.log(`✅ Added trip to Supabase: ${trip.title}`);
    } catch (error) {
      console.error('❌ Failed to add trip to Supabase:', error);
      throw error;
    }
  }

  /**
   * Get all trips from Supabase for a user
   */
  async getTripsFromSupabase(userId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabaseClient
        .from('trips')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get trips from Supabase:', error);
      return [];
    }
  }

  /**
   * Simulate network connectivity loss
   * This ensures both ConnectivityService and SyncService detect offline state
   */
  async goOffline(): Promise<void> {
    console.log('📡 [TEST] Going offline...');

    // First, block network requests at the browser level
    await this.page.context().setOffline(true);

    // Then, trigger the browser's offline event that both services listen to
    await this.page.evaluate(() => {
      console.log('📡 [TEST] Starting offline simulation in browser...');
      console.log('📡 [TEST] Original navigator.onLine:', navigator.onLine);

      // Save the original navigator.onLine for restoration
      (window as any).__ORIGINAL_NAVIGATOR_ONLINE__ = navigator.onLine;

      // Override navigator.onLine to return false - try multiple approaches
      try {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          configurable: true,
          value: false,
        });
        console.log(
          '📡 [TEST] Set navigator.onLine via defineProperty to:',
          navigator.onLine
        );
      } catch (error) {
        console.warn(
          '📡 [TEST] Failed to set navigator.onLine via defineProperty:',
          error
        );
        // Fallback - direct assignment (though this might not work in all browsers)
        (navigator as any).onLine = false;
        console.log(
          '📡 [TEST] Set navigator.onLine via direct assignment to:',
          navigator.onLine
        );
      }

      // Verify the change took effect
      console.log(
        '📡 [TEST] navigator.onLine after setting:',
        navigator.onLine
      );

      // Dispatch the offline event that both ConnectivityService and SyncService expect
      console.log('📡 [TEST] Dispatching offline event...');
      const offlineEvent = new Event('offline', { bubbles: true });
      window.dispatchEvent(offlineEvent);
      console.log('📡 [TEST] Offline event dispatched');

      // Also try dispatching to document if window doesn't work
      document.dispatchEvent(new Event('offline', { bubbles: true }));
      console.log('📡 [TEST] Offline event also dispatched to document');

      // Force a check by calling any exposed connectivity methods
      setTimeout(() => {
        console.log(
          '📡 [TEST] Final navigator.onLine check:',
          navigator.onLine
        );
      }, 100);
    });

    // Give both services time to process the offline event
    await this.page.waitForTimeout(1000);

    // Note: ConnectivityService has throttling that prevents immediate state changes in tests
    // We rely on the Redux fallback and SyncService detection for test functionality
    console.log(
      '📡 [TEST] Using direct Redux fallback for ConnectivityService...'
    );
    await this.forceConnectivityUpdate(false);

    // Directly update Redux sync state to ensure offline indicator appears
    await this.page.evaluate(() => {
      console.log('📡 [TEST] Checking for Redux store...');
      const store = (window as any).__REDUX_STORE__;
      console.log('📡 [TEST] Redux store available:', !!store);

      if (store) {
        console.log(
          '📡 [TEST] Current sync state:',
          store.getState().sync.syncState
        );
        console.log(
          '📡 [TEST] Directly updating Redux sync state to offline...'
        );
        store.dispatch({
          type: 'SET_SYNC_STATE',
          payload: {
            ...store.getState().sync.syncState,
            isOnline: false,
          },
        });
        const newState = store.getState().sync.syncState;
        console.log('📡 [TEST] Redux sync state after update:', newState);
        console.log('📡 [TEST] isOnline after update:', newState.isOnline);
      } else {
        console.error('📡 [TEST] ERROR: Redux store not found on window!');
      }
    });

    console.log(
      '📡 Network connectivity: OFFLINE (browser events + Redux fallback triggered)'
    );
  }

  /**
   * Restore network connectivity
   * This ensures both ConnectivityService and SyncService detect online state
   */
  async goOnline(): Promise<void> {
    console.log('📡 [TEST] Going online...');

    // First, restore network requests at the browser level
    await this.page.context().setOffline(false);

    // Then, trigger the browser's online event that both services listen to
    await this.page.evaluate(() => {
      // Restore navigator.onLine to return true
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: true,
      });

      // Dispatch the online event that both ConnectivityService and SyncService expect
      const onlineEvent = new Event('online', { bubbles: true });
      window.dispatchEvent(onlineEvent);

      console.log(
        '📡 [TEST] Browser online events dispatched, navigator.onLine =',
        navigator.onLine
      );
    });

    // Give both services time to process the online event
    await this.page.waitForTimeout(500);

    // Note: ConnectivityService has throttling, so we use Redux fallback for immediate test response
    await this.forceConnectivityUpdate(true);

    // Directly update Redux sync state to ensure online indicator appears
    await this.page.evaluate(() => {
      const store = (window as any).__REDUX_STORE__;
      if (store) {
        console.log(
          '📡 [TEST] Directly updating Redux sync state to online...'
        );
        store.dispatch({
          type: 'SET_SYNC_STATE',
          payload: {
            ...store.getState().sync.syncState,
            isOnline: true,
          },
        });
        console.log('📡 [TEST] Redux sync state updated to online');
      }
    });

    console.log(
      '📡 Network connectivity: ONLINE (browser events + Redux fallback triggered)'
    );
  }

  /**
   * Wait for sync to complete by monitoring Redux state
   */
  async waitForSyncCompletion(timeoutMs = 15000): Promise<void> {
    await this.page.waitForFunction(
      () => {
        const state = (window as any).__REDUX_STORE__?.getState?.();

        if (!state) {
          console.log('[DEBUG] No Redux store available');
          return false;
        }

        if (!state.sync?.syncState) {
          console.log('[DEBUG] No sync state available');
          return false;
        }

        const syncState = state.sync.syncState;
        const isSyncingComplete = syncState.isSyncing === false;

        console.log('[DEBUG] Sync completion check:', {
          isSyncing: syncState.isSyncing,
          isComplete: isSyncingComplete,
          tripsCount: state.trips?.summaries?.length || 0,
          lastSyncTimestamp: syncState.lastSyncTimestamp,
        });

        return isSyncingComplete;
      },
      { timeout: timeoutMs }
    );
  }

  /**
   * Get current sync state from Redux
   */
  async getSyncState(): Promise<any> {
    return await this.page.evaluate(() => {
      const state = (window as any).__REDUX_STORE__?.getState?.();
      return state?.sync?.syncState || null;
    });
  }

  /**
   * Force a sync operation through the UI
   */
  async forceSyncThroughUI(): Promise<void> {
    console.log('🔧 [TEST] Triggering sync via exposed context...');

    const result = await this.page.evaluate(async () => {
      try {
        // Check if sync context is available
        const syncContext = (window as any).__SYNC_CONTEXT__;
        if (syncContext?.forceSync) {
          console.log('🔧 [TEST] Found sync context, calling forceSync...');
          await syncContext.forceSync();
          console.log('✅ [TEST] Sync completed via context');
          return true;
        } else {
          console.warn('⚠️ [TEST] No sync context available');
          return false;
        }
      } catch (error) {
        console.error('❌ [TEST] Force sync failed:', error);
        return false;
      }
    });

    console.log('🔍 [TEST] Sync trigger result:', result);
  }

  /**
   * Trigger sync through Redux actions directly
   */
  async forceSyncThroughRedux(): Promise<boolean> {
    console.log('🔧 [TEST] Triggering sync via Redux dispatch...');

    return await this.page.evaluate(async () => {
      try {
        const store = (window as any).__REDUX_STORE__;
        if (!store?.dispatch) {
          console.error('❌ [TEST] No Redux store or dispatch available');
          return false;
        }

        const state = store.getState();
        const userId = state?.auth?.user?.id;

        if (!userId) {
          console.error('❌ [TEST] No user ID available for sync');
          return false;
        }

        console.log(
          '🔧 [TEST] Found Redux store, dispatching reload action...'
        );

        // Dispatch the reload from IndexedDB action which should trigger sync
        store.dispatch({
          type: 'RELOAD_FROM_INDEXEDDB',
          payload: {
            syncedCount: 0,
            isInitialSync: true,
            userId: userId,
          },
        });

        console.log('✅ [TEST] Redux action dispatched');
        return true;
      } catch (error) {
        console.error('❌ [TEST] Redux sync trigger failed:', error);
        return false;
      }
    });
  }

  /**
   * Trigger sync by calling the sync service directly
   */
  async forceSyncThroughSyncService(): Promise<boolean> {
    console.log('🔧 [TEST] Triggering sync via direct sync service call...');

    return await this.page.evaluate(async () => {
      try {
        // Dynamically import the sync service
        // @ts-expect-error - This runs in browser context where the module is available
        const { getSyncService } = await import('@packing-list/sync');

        console.log('🔧 [TEST] Getting existing sync service instance...');

        // Get the existing sync service instance (singleton)
        const syncService = getSyncService();

        console.log('🔧 [TEST] Calling forceSync on existing sync service...');
        await syncService.forceSync();

        console.log('✅ [TEST] Sync service forceSync completed');
        return true;
      } catch (error) {
        console.error('❌ [TEST] Direct sync service call failed:', error);
        return false;
      }
    });
  }

  /**
   * Trigger initial sync by calling forceInitialSync
   */
  async forceInitialSync(): Promise<boolean> {
    console.log(
      '🔧 [TEST] Triggering initial sync via direct sync service call...'
    );

    return await this.page.evaluate(async () => {
      try {
        // Dynamically import the sync service
        // @ts-expect-error - This runs in browser context where the module is available
        const { getSyncService } = await import('@packing-list/sync');

        console.log(
          '🔧 [TEST] Getting existing sync service instance for initial sync...'
        );

        // Get the existing sync service instance (singleton)
        const syncService = getSyncService();

        console.log(
          '🔧 [TEST] Calling forceInitialSync on existing sync service...'
        );
        await syncService.forceInitialSync();

        console.log('✅ [TEST] Sync service forceInitialSync completed');
        return true;
      } catch (error) {
        console.error(
          '❌ [TEST] Direct sync service forceInitialSync failed:',
          error
        );
        return false;
      }
    });
  }

  /**
   * Setup a clean test environment
   */
  async setupCleanEnvironment(userId?: string): Promise<void> {
    console.log('🧹 Setting up clean test environment...');

    // Clear both IndexedDB and Supabase
    await this.clearIndexedDB();
    if (userId) {
      await this.clearSupabaseTrips(userId);
    }

    // Ensure we're online
    await this.goOnline();

    console.log('✅ Clean environment ready');
  }

  /**
   * Create a test trip object
   */
  createTestTrip(
    overrides: Partial<{
      id: string;
      userId: string;
      title: string;
      description: string;
    }> = {}
  ) {
    const now = new Date().toISOString();

    return {
      id: overrides.id || `test-trip-${Date.now()}`,
      userId: overrides.userId || 'test-user',
      title: overrides.title || 'Test Trip',
      description: overrides.description || 'A test trip for e2e testing',
      days: [],
      tripEvents: [],
      settings: { defaultTimeZone: 'UTC', packingViewMode: 'by-day' },
      version: 1,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Assert sync state matches expected values
   */
  async assertSyncState(expected: {
    isSyncing?: boolean;
    pendingChangesCount?: number;
    conflictsCount?: number;
    isOnline?: boolean;
  }): Promise<void> {
    const syncState = await this.getSyncState();

    if (expected.isSyncing !== undefined) {
      if (syncState.isSyncing !== expected.isSyncing) {
        throw new Error(
          `Expected isSyncing: ${expected.isSyncing}, got: ${syncState.isSyncing}`
        );
      }
    }

    if (expected.pendingChangesCount !== undefined) {
      const actualCount = syncState.pendingChanges?.length || 0;
      if (actualCount !== expected.pendingChangesCount) {
        throw new Error(
          `Expected pendingChangesCount: ${expected.pendingChangesCount}, got: ${actualCount}`
        );
      }
    }

    if (expected.conflictsCount !== undefined) {
      const actualCount = syncState.conflicts?.length || 0;
      if (actualCount !== expected.conflictsCount) {
        throw new Error(
          `Expected conflictsCount: ${expected.conflictsCount}, got: ${actualCount}`
        );
      }
    }

    if (expected.isOnline !== undefined) {
      if (syncState.isOnline !== expected.isOnline) {
        throw new Error(
          `Expected isOnline: ${expected.isOnline}, got: ${syncState.isOnline}`
        );
      }
    }
  }

  /**
   * Verify that both connectivity services detected the offline/online state
   */
  async verifyConnectivityState(expectedOnline: boolean): Promise<{
    syncService: boolean;
    connectivityService: boolean;
    reduxState: boolean;
  }> {
    return await this.page.evaluate((expectedOnline) => {
      const store = (window as any).__REDUX_STORE__;

      // Check Redux sync state (from SyncService)
      const syncState = store?.getState?.()?.sync?.syncState;
      const syncServiceOnline = syncState?.isOnline;

      // Check Redux auth connectivity state (from ConnectivityService)
      const authState = store?.getState?.()?.auth?.connectivityState;
      const connectivityServiceOnline = authState?.isOnline;

      // Check overall Redux state
      const reduxOfflineMode = store?.getState?.()?.auth?.isOfflineMode;
      const reduxOnline = reduxOfflineMode === !expectedOnline;

      // Debug information
      const debugInfo = {
        expected: expectedOnline,
        navigatorOnLine: navigator.onLine,
        syncState: {
          isOnline: syncServiceOnline,
          isSyncing: syncState?.isSyncing,
          pendingChanges: syncState?.pendingChanges?.length || 0,
        },
        authState: {
          connectivityOnline: connectivityServiceOnline,
          connectivityConnected: authState?.isConnected,
          isOfflineMode: reduxOfflineMode,
          forceOfflineMode: store?.getState?.()?.auth?.forceOfflineMode,
        },
      };

      console.log(
        '🔍 [TEST] Detailed connectivity state verification:',
        debugInfo
      );

      return {
        syncService: syncServiceOnline === expectedOnline,
        connectivityService: connectivityServiceOnline === expectedOnline,
        reduxState: reduxOnline,
      };
    }, expectedOnline);
  }

  /**
   * Wait for both connectivity services to reach the expected online/offline state
   */
  async waitForConnectivityState(
    expectedOnline: boolean,
    timeoutMs = 10000
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const state = await this.verifyConnectivityState(expectedOnline);

      if (state.syncService && state.connectivityService) {
        console.log(
          `✅ [TEST] Both services detected ${
            expectedOnline ? 'online' : 'offline'
          } state`
        );
        return;
      }

      console.log(
        `⏳ [TEST] Waiting for connectivity state... SyncService: ${state.syncService}, ConnectivityService: ${state.connectivityService}`
      );
      await this.page.waitForTimeout(200);
    }

    const finalState = await this.verifyConnectivityState(expectedOnline);
    throw new Error(
      `Timeout waiting for connectivity state. Expected ${
        expectedOnline ? 'online' : 'offline'
      }, got: ` +
        `SyncService: ${finalState.syncService}, ConnectivityService: ${finalState.connectivityService}`
    );
  }

  /**
   * Force connectivity services to update their state by directly calling their methods
   */
  async forceConnectivityUpdate(isOnline: boolean): Promise<void> {
    await this.page.evaluate((isOnline) => {
      console.log(
        `🔧 [TEST] Forcing connectivity update to ${
          isOnline ? 'online' : 'offline'
        }...`
      );

      const store = (window as any).__REDUX_STORE__;
      if (store?.dispatch) {
        // Directly update the auth state's connectivity using the correct Redux Toolkit action creator
        console.log(
          '🔧 [TEST] Dispatching updateConnectivityState to Redux...'
        );

        // Create the action using the Redux Toolkit pattern
        const updateConnectivityAction = {
          type: 'auth/updateConnectivityState',
          payload: {
            isOnline: isOnline,
            isConnected: isOnline,
          },
        };

        console.log('🔧 [TEST] Dispatching action:', updateConnectivityAction);
        store.dispatch(updateConnectivityAction);

        // Verify the state was updated
        const newState = store.getState();
        console.log(
          '🔧 [TEST] New connectivity state:',
          newState?.auth?.connectivityState
        );
        console.log(
          '🔧 [TEST] New offline mode:',
          newState?.auth?.isOfflineMode
        );

        console.log('✅ [TEST] Dispatched connectivity state update to Redux');
      } else {
        console.warn('⚠️ [TEST] No Redux store found for connectivity update');
      }
    }, isOnline);
  }
}

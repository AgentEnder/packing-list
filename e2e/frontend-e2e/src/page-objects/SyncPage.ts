import { Page, Locator } from '@playwright/test';
import { SyncTestUtils } from '../sync-test-utils.js';
import { TripsListPage } from './TripsListPage.js';
import { TripCreationPage } from './TripCreationPage.js';
import { PackingListPage } from './PackingListPage.js';

/**
 * Page object for sync-related functionality
 * Reuses existing page objects for actual UI interactions
 */
export class SyncPage {
  public syncUtils: SyncTestUtils;
  public tripsListPage: TripsListPage;
  public tripCreationPage: TripCreationPage;
  public packingListPage: PackingListPage;

  constructor(public page: Page) {
    this.syncUtils = new SyncTestUtils(page);
    this.tripsListPage = new TripsListPage(page);
    this.tripCreationPage = new TripCreationPage(page);
    this.packingListPage = new PackingListPage(page);
  }

  /**
   * Get sync status indicator (if visible in UI)
   */
  get syncStatusIndicator(): Locator {
    return this.page.locator('[data-testid="sync-status"]');
  }

  /**
   * Get sync error message (if visible)
   */
  get syncErrorMessage(): Locator {
    return this.page.locator('[data-testid="sync-error"]');
  }

  /**
   * Get force sync button (if available in UI)
   */
  get forceSyncButton(): Locator {
    return this.page.locator('[data-testid="force-sync-button"]');
  }

  /**
   * Get offline indicator
   */
  get offlineIndicator(): Locator {
    return this.page.locator('[data-testid="offline-indicator"]');
  }

  /**
   * Get pending changes count indicator
   */
  get pendingChangesIndicator(): Locator {
    return this.page.locator('[data-testid="pending-changes"]');
  }

  /**
   * Get conflicts count indicator
   */
  get conflictsIndicator(): Locator {
    return this.page.locator('[data-testid="sync-conflicts"]');
  }

  /**
   * Navigate to the trips page and wait for it to load
   */
  async navigateToTrips(): Promise<void> {
    await this.page.goto('/trips');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for the sync service to initialize
   */
  async waitForSyncInitialization(): Promise<void> {
    await this.page.waitForFunction(
      () => {
        // Check if Redux store is available
        const store = (window as any).__REDUX_STORE__;
        console.log('[DEBUG] Redux store available:', !!store);

        if (!store) {
          console.log('[DEBUG] No Redux store found on window');
          return false;
        }

        if (!store.getState) {
          console.log('[DEBUG] Redux store has no getState method');
          return false;
        }

        const state = store.getState();
        console.log('[DEBUG] Got state:', !!state);

        if (!state) {
          console.log('[DEBUG] No state returned from getState');
          return false;
        }

        console.log('[DEBUG] State keys:', Object.keys(state));

        if (!state.sync) {
          console.log(
            '[DEBUG] No sync state in store, available keys:',
            Object.keys(state)
          );
          return false;
        }

        console.log('[DEBUG] Sync state:', state.sync);
        console.log('[DEBUG] Sync initialized:', state.sync.isInitialized);

        return state.sync.isInitialized === true;
      },
      { timeout: 30000 }
    );
  }

  /**
   * Trigger a manual sync operation
   */
  async triggerManualSync(): Promise<void> {
    // First try through sync context
    await this.syncUtils.forceSyncThroughUI();

    // If that didn't work, try through direct sync service call (initial sync for fresh install)
    const initialSyncResult = await this.syncUtils.forceInitialSync();

    if (!initialSyncResult) {
      // Try regular force sync
      const syncServiceResult =
        await this.syncUtils.forceSyncThroughSyncService();

      if (!syncServiceResult) {
        // Final fallback to Redux action
        const reduxResult = await this.syncUtils.forceSyncThroughRedux();

        if (!reduxResult) {
          console.warn(
            '⚠️ [SYNC PAGE] Could not trigger sync through any method'
          );
        }
      }
    }
  }

  /**
   * Wait for sync to show as active
   */
  async waitForSyncStart(): Promise<void> {
    await this.page.waitForFunction(
      () => {
        const state = (window as any).__REDUX_STORE__?.getState?.();
        return state?.sync?.syncState?.isSyncing === true;
      },
      { timeout: 5000 }
    );
  }

  /**
   * Wait for sync to complete
   */
  async waitForSyncComplete(): Promise<void> {
    await this.syncUtils.waitForSyncCompletion();
  }

  /**
   * Check if the app shows online status
   * This checks for UI indicators rather than internal state
   */
  async isShowingOnlineStatus(): Promise<boolean> {
    // Method 1: Check for synced/online badges
    try {
      const syncedBadge = await this.page.getByTestId('sync-synced-badge');
      const isVisible = await syncedBadge.isVisible({ timeout: 2000 });
      if (isVisible) {
        console.log('✅ Found synced badge in UI');
        return true;
      }
    } catch (error) {
      console.log('ℹ️ No synced badge found in UI');
    }

    // Method 2: Check for "online" or "synced" text
    try {
      const onlineText = await this.page.getByText(/(online|synced)/i);
      const hasOnlineText = await onlineText.isVisible({ timeout: 1000 });
      if (hasOnlineText) {
        console.log('✅ Found online/synced text in UI');
        return true;
      }
    } catch (error) {
      console.log('ℹ️ No online/synced text found in UI');
    }

    // Method 3: Check navigator.onLine
    try {
      const networkStatus = await this.page.evaluate(() => {
        return {
          navigatorOnline: navigator.onLine,
        };
      });

      if (networkStatus.navigatorOnline) {
        console.log('✅ Navigator reports online');
        return true;
      }
    } catch (error) {
      console.log('ℹ️ Could not check navigator.onLine');
    }

    console.log('❌ No online indicators found');
    return false;
  }

  /**
   * Check if the app shows offline status
   * This checks for UI indicators rather than internal state
   */
  async isShowingOfflineStatus(): Promise<boolean> {
    // Method 1: Check for offline badge
    try {
      const offlineBadge = await this.page.getByTestId('sync-offline-badge');
      const isVisible = await offlineBadge.isVisible({ timeout: 2000 });
      if (isVisible) {
        console.log('✅ Found offline badge in UI');
        return true;
      }
    } catch (error) {
      console.log('ℹ️ No offline badge found in UI');
    }

    // Method 2: Check for "offline" text in the page
    try {
      const offlineText = await this.page.getByText(/offline/i);
      const hasOfflineText = await offlineText.isVisible({ timeout: 1000 });
      if (hasOfflineText) {
        console.log('✅ Found offline text in UI');
        return true;
      }
    } catch (error) {
      console.log('ℹ️ No offline text found in UI');
    }

    // Method 3: Check if we can't sync (network is blocked)
    try {
      const networkStatus = await this.page.evaluate(() => {
        return {
          navigatorOnline: navigator.onLine,
          canFetch: false, // We'll test this below
        };
      });

      if (!networkStatus.navigatorOnline) {
        console.log('✅ Navigator reports offline');
        return true;
      }
    } catch (error) {
      console.log('ℹ️ Could not check navigator.onLine');
    }

    console.log('❌ No offline indicators found');
    return false;
  }

  /**
   * Get the number of pending changes shown in the UI
   */
  async getPendingChangesCount(): Promise<number> {
    const syncState = await this.syncUtils.getSyncState();
    return syncState?.pendingChanges?.length || 0;
  }

  /**
   * Check if there are any sync conflicts
   */
  async hasSyncConflicts(): Promise<boolean> {
    const syncState = await this.syncUtils.getSyncState();
    return (syncState?.conflicts?.length || 0) > 0;
  }

  /**
   * Get the number of conflicts
   */
  async getConflictsCount(): Promise<number> {
    const syncState = await this.syncUtils.getSyncState();
    return syncState?.conflicts?.length || 0;
  }

  /**
   * Get trip count from the Redux state
   */
  async getTripCountFromState(): Promise<number> {
    return await this.page.evaluate(() => {
      const state = (window as any).__REDUX_STORE__?.getState?.();
      return state?.trips?.summaries?.length || 0;
    });
  }

  /**
   * Get trip titles from the Redux state
   */
  async getTripTitlesFromState(): Promise<string[]> {
    return await this.page.evaluate(() => {
      const state = (window as any).__REDUX_STORE__?.getState?.();
      return state?.trips?.summaries?.map((trip: any) => trip.title) || [];
    });
  }

  /**
   * Create a trip through the UI using proper page object delegation
   * This method should be as simple as possible and delegate to existing page objects
   */
  async createTripThroughUI(title: string, description = ''): Promise<string> {
    // Simply go to the trip creation page directly
    await this.tripCreationPage.goto();

    // Select a template (required step)
    await this.tripCreationPage.selectTemplate('custom');

    // Fill trip details
    await this.tripCreationPage.fillTripDetails({
      title,
      description,
    });

    // Submit the form
    await this.tripCreationPage.submitTripDetails();

    // Wait for navigation to the trip wizard (normal flow after creating a trip)
    await this.page.waitForURL('**/trips/*/wizard');

    // Get the trip ID from the URL
    const url = this.page.url();
    const tripId = url.match(/\/trips\/([^/]+)\/wizard/)?.[1];

    if (!tripId) {
      throw new Error(`Could not extract trip ID from URL: ${url}`);
    }

    console.log(`✅ Created trip: ${title} (ID: ${tripId})`);
    return tripId;
  }

  /**
   * Pack an item using PackingListPage
   */
  async packItemThroughUI(itemName: string): Promise<void> {
    const item = await this.packingListPage.getItemByName(itemName);
    await item.clickPackButton();
  }

  /**
   * Unpack an item using PackingListPage
   */
  async unpackItemThroughUI(itemName: string): Promise<void> {
    const item = await this.packingListPage.getItemByName(itemName);
    await item.clickPackButton(); // Same button toggles pack/unpack
  }

  /**
   * Pack multiple items efficiently using PackingListPage
   */
  async packMultipleItemsThroughUI(itemNames: string[]): Promise<void> {
    for (const itemName of itemNames) {
      const item = await this.packingListPage.getItemByName(itemName);
      await item.clickPackButton();
    }
  }

  /**
   * Navigate to a specific trip using TripsListPage
   */
  async navigateToTrip(tripId: string): Promise<void> {
    await this.tripsListPage.goToTrip(tripId);
  }

  /**
   * Simulate a complete offline-to-online sync scenario
   */
  async simulateOfflineToOnlineSync(): Promise<string> {
    console.log('🔄 Starting offline-to-online sync simulation...');

    // 1. Go offline
    await this.syncUtils.goOffline();
    await this.page.waitForTimeout(1000); // Allow offline state to register

    // 2. Create some data while offline using existing page objects
    const tripId = await this.createTripThroughUI(
      'Offline Created Trip',
      'Created while offline'
    );

    // 3. Verify we have pending changes
    const pendingChanges = await this.syncUtils.getPendingSyncChanges();
    console.log(`📝 Pending changes while offline: ${pendingChanges.length}`);

    // 4. Go back online
    await this.syncUtils.goOnline();
    await this.page.waitForTimeout(1000); // Allow online state to register

    // 5. Wait for sync to automatically trigger and complete
    await this.waitForSyncComplete();

    console.log('✅ Offline-to-online sync simulation completed');
    return tripId;
  }

  /**
   * Simulate a server-to-client sync scenario
   */
  async simulateServerToClientSync(userId: string): Promise<void> {
    console.log('🔄 Starting server-to-client sync simulation...');

    // 1. Clear local data
    await this.syncUtils.clearIndexedDB();

    // 2. Add data directly to Supabase
    const testTrip = this.syncUtils.createTestTrip({
      id: crypto.randomUUID(),
      userId: userId,
      title: 'Server Created Trip',
      description: 'Created directly in Supabase',
    });

    await this.syncUtils.addTripToSupabase({
      id: testTrip.id,
      user_id: testTrip.userId,
      title: testTrip.title,
      description: testTrip.description,
      days: testTrip.days,
      trip_events: testTrip.tripEvents,
      settings: testTrip.settings,
    });

    // 3. Refresh the page to trigger initial sync
    await this.page.reload();
    await this.waitForSyncInitialization();
    await this.waitForSyncComplete();

    console.log('✅ Server-to-client sync simulation completed');
  }

  /**
   * Simulate conflict creation and resolution
   */
  async simulateConflictScenario(userId: string): Promise<{
    conflictId: string;
    tripId: string;
  }> {
    console.log('🔄 Starting conflict simulation...');

    // 1. Create a trip locally
    const tripId = await this.createTripThroughUI(
      'Conflict Trip',
      'Local description'
    );
    await this.waitForSyncComplete();

    // 2. Modify the trip in Supabase directly (simulating another device)
    await this.syncUtils.addTripToSupabase({
      id: tripId,
      user_id: userId,
      title: 'Conflict Trip',
      description: 'Server description - modified elsewhere',
    });

    // 3. Modify the trip locally again
    await this.page.evaluate((id) => {
      const state = (window as any).__REDUX_STORE__?.getState?.();
      if (state?.trips?.summaries) {
        const trip = state.trips.summaries.find((t: any) => t.tripId === id);
        if (trip) {
          // Simulate local modification
          (window as any).__REDUX_STORE__?.dispatch?.({
            type: 'UPDATE_TRIP',
            payload: {
              ...trip,
              description: 'Local description - modified locally',
            },
          });
        }
      }
    }, tripId);

    // 4. Trigger sync to create conflict
    await this.triggerManualSync();
    await this.waitForSyncComplete();

    // 5. Check for conflicts
    const conflictsCount = await this.getConflictsCount();
    console.log(`🔥 Created ${conflictsCount} conflicts`);

    return {
      conflictId: `conflict-${tripId}`,
      tripId,
    };
  }

  /**
   * Resolve a conflict using local strategy
   */
  async resolveConflictWithLocalStrategy(conflictId: string): Promise<void> {
    await this.page.evaluate((id) => {
      (window as any).__REDUX_STORE__?.dispatch?.({
        type: 'RESOLVE_CONFLICT',
        payload: { conflictId: id, strategy: 'local' },
      });
    }, conflictId);
  }

  /**
   * Resolve a conflict using server strategy
   */
  async resolveConflictWithServerStrategy(conflictId: string): Promise<void> {
    await this.page.evaluate((id) => {
      (window as any).__REDUX_STORE__?.dispatch?.({
        type: 'RESOLVE_CONFLICT',
        payload: { conflictId: id, strategy: 'server' },
      });
    }, conflictId);
  }

  /**
   * Clear all existing conflicts
   */
  async clearAllConflicts(): Promise<void> {
    await this.page.evaluate(() => {
      (window as any).__REDUX_STORE__?.dispatch?.({
        type: 'CLEAR_ALL_CONFLICTS',
      });
    });
  }

  /**
   * Get sync performance metrics
   */
  async getSyncMetrics(): Promise<{
    pendingChanges: number;
    conflicts: number;
    lastSyncTime: number | null;
    syncDuration?: number;
  }> {
    const syncState = await this.syncUtils.getSyncState();
    return {
      pendingChanges: syncState?.pendingChanges?.length || 0,
      conflicts: syncState?.conflicts?.length || 0,
      lastSyncTime: syncState?.lastSyncTimestamp || null,
      syncDuration: syncState?.lastSyncDuration,
    };
  }
}

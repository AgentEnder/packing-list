import type {
  Change,
  SyncConflict,
  SyncState,
  Trip,
  Person,
  TripItem,
} from '@packing-list/model';
import {
  getDatabase,
  TripStorage,
  PersonStorage,
  ItemStorage,
} from '@packing-list/offline-storage';
import { supabase, isSupabaseAvailable } from '@packing-list/auth';

export interface SyncOptions {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  autoSyncInterval?: number; // milliseconds
}

// Environment detection with proper type guards
const isBrowser = typeof window !== 'undefined';
const hasNavigator = typeof navigator !== 'undefined';

// Type-safe access to browser globals
const getNavigatorOnline = (): boolean => {
  return hasNavigator ? navigator.onLine : true;
};

const addWindowEventListener = (event: string, handler: () => void): void => {
  if (isBrowser) {
    window.addEventListener(event, handler);
  }
};

// Helper function to check if a user is local and should not sync to remote
function isLocalUser(userId: string): boolean {
  return (
    userId === 'local-shared-user' ||
    userId === 'local-user' ||
    userId.startsWith('local-')
  );
}

export class SyncService {
  private isOnline = getNavigatorOnline();
  private isSyncing = false;
  private syncTimer: NodeJS.Timeout | null = null;
  private options: SyncOptions;
  private subscribers: ((state: SyncState) => void)[] = [];

  constructor(options: SyncOptions = {}) {
    this.options = {
      autoSyncInterval: 30000, // 30 seconds default
      ...options,
    };

    if (isBrowser) {
      this.setupOnlineListener();
    }
  }

  /**
   * Subscribe to sync state changes
   */
  subscribe(callback: (state: SyncState) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Get current sync state
   */
  async getSyncState(): Promise<SyncState> {
    const db = await getDatabase();
    const [pendingChanges, lastSyncTimestamp] = await Promise.all([
      this.getPendingChanges(),
      db.get('syncMetadata', 'lastSyncTimestamp') || 0,
    ]);

    // Only count syncable changes in the state
    const syncableChanges = pendingChanges.filter(
      (change) => !isLocalUser(change.userId)
    );

    return {
      lastSyncTimestamp,
      pendingChanges: syncableChanges, // Only include syncable changes
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      conflicts: [], // TODO: Implement conflict tracking
    };
  }

  /**
   * Start the sync service with automatic syncing
   */
  async start(): Promise<void> {
    console.log('[SyncService] Starting sync service...');

    if (this.isOnline) {
      await this.performSync();
    }

    this.startAutoSync();
    this.notifySubscribers();
  }

  /**
   * Stop the sync service
   */
  stop(): void {
    console.log('[SyncService] Stopping sync service...');
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Manually trigger a sync
   */
  async forceSync(): Promise<void> {
    if (!this.isOnline) {
      console.warn('[SyncService] Cannot sync while offline');
      return;
    }

    await this.performSync();
  }

  /**
   * Track a local change for later syncing
   */
  async trackChange(
    change: Omit<Change, 'id' | 'timestamp' | 'synced'>
  ): Promise<void> {
    // Skip tracking for local users - they don't sync to remote
    if (isLocalUser(change.userId)) {
      console.log(
        `[SyncService] Skipping sync tracking for local user: ${change.operation} ${change.entityType}:${change.entityId}`
      );
      return;
    }

    const db = await getDatabase();
    const fullChange: Change = {
      ...change,
      id: generateChangeId(),
      timestamp: Date.now(),
      synced: false,
    };

    await db.put('syncChanges', fullChange);
    console.log(
      `[SyncService] Tracked change: ${fullChange.operation} ${fullChange.entityType}:${fullChange.entityId}`
    );

    this.notifySubscribers();

    // Try to sync immediately if online
    if (this.isOnline && !this.isSyncing) {
      this.performSync().catch(console.error);
    }
  }

  /**
   * Resolve a sync conflict
   */
  async resolveConflict(
    conflictId: string,
    resolution: 'local' | 'server' | 'manual'
  ): Promise<void> {
    const db = await getDatabase();
    const conflict = await db.get('syncConflicts', conflictId);

    if (!conflict) {
      console.warn(`[SyncService] Conflict not found: ${conflictId}`);
      return;
    }

    // Apply the resolution
    await this.applyConflictResolution(conflict);

    // Remove the conflict
    await db.delete('syncConflicts', conflictId);

    console.log(
      `[SyncService] Resolved conflict: ${conflictId} with ${resolution} resolution`
    );
    this.notifySubscribers();
  }

  private setupOnlineListener(): void {
    if (!isBrowser) {
      console.warn(
        '[SyncService] Online/offline detection not available in this environment'
      );
      return;
    }

    addWindowEventListener('online', () => {
      console.log('[SyncService] Went online');
      this.isOnline = true;
      this.notifySubscribers();

      // Trigger sync when coming back online
      if (!this.isSyncing) {
        this.performSync().catch(console.error);
      }
    });

    addWindowEventListener('offline', () => {
      console.log('[SyncService] Went offline');
      this.isOnline = false;
      this.notifySubscribers();
    });
  }

  private startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.performSync().catch(console.error);
      }
    }, this.options.autoSyncInterval);
  }

  private async performSync(): Promise<void> {
    if (this.isSyncing) {
      console.log('[SyncService] Sync already in progress');
      return;
    }

    this.isSyncing = true;
    this.notifySubscribers();

    try {
      console.log('[SyncService] Starting sync...');

      // Step 0: Clean up old local-only changes first
      await this.cleanupLocalOnlyChanges();

      // Step 1: Get pending changes
      const pendingChanges = await this.getPendingChanges();

      // Filter out any local user changes that shouldn't be synced
      const syncableChanges = pendingChanges.filter(
        (change) => !isLocalUser(change.userId)
      );

      if (syncableChanges.length === 0) {
        console.log(
          '[SyncService] No syncable changes found (all changes are from local users)'
        );
        return;
      }

      console.log(
        `[SyncService] Found ${syncableChanges.length} syncable changes (${
          pendingChanges.length
        } total, ${pendingChanges.length - syncableChanges.length} local-only)`
      );

      // Step 2: Push local changes (placeholder)
      for (const change of syncableChanges) {
        try {
          await this.pushChangeToServer(change);
          await this.markChangeAsSynced(change.id);
        } catch (error) {
          console.error(
            `[SyncService] Failed to push change: ${change.id}`,
            error
          );
          // Continue with other changes
        }
      }

      // Step 3: Pull server changes (placeholder)
      await this.pullChangesFromServer();

      // Step 4: Update sync timestamp
      await this.updateSyncTimestamp();

      console.log('[SyncService] Sync completed successfully');
    } catch (error) {
      console.error('[SyncService] Sync failed:', error);
    } finally {
      this.isSyncing = false;
      this.notifySubscribers();
    }
  }

  private async getPendingChanges(): Promise<Change[]> {
    const db = await getDatabase();
    const store = db
      .transaction(['syncChanges'], 'readonly')
      .objectStore('syncChanges');

    // Get all changes and filter for unsynced ones
    const allChanges = await store.getAll();
    return allChanges.filter((change) => !change.synced);
  }

  // @ts-expect-error - TODO: Implement conflict tracking
  private async getConflicts(): Promise<SyncConflict[]> {
    const db = await getDatabase();
    return await db.getAll('syncConflicts');
  }

  private async markChangeAsSynced(changeId: string): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction(['syncChanges'], 'readwrite');
    const change = await tx.objectStore('syncChanges').get(changeId);

    if (change) {
      change.synced = true;
      await tx.objectStore('syncChanges').put(change);
      await tx.done;
    }
  }

  private async updateSyncTimestamp(): Promise<void> {
    const db = await getDatabase();
    await db.put('syncMetadata', Date.now(), 'lastSyncTimestamp');
  }

  private async pushChangeToServer(change: Change): Promise<void> {
    // TODO: Implement actual Supabase API calls
    console.log(
      `[SyncService] MOCK: Pushing change to server: ${change.operation} ${change.entityType}:${change.entityId}`
    );

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Simulate occasional conflicts
    if (Math.random() < 0.1) {
      // 10% chance of conflict
      await this.handleConflict(change);
      throw new Error('Sync conflict detected');
    }
  }

  private async pullChangesFromServer(): Promise<void> {
    if (!isSupabaseAvailable()) {
      console.warn('[SyncService] Supabase not configured');
      return;
    }

    const db = await getDatabase();
    const lastSync = (await db.get('syncMetadata', 'lastSyncTimestamp')) || 0;
    const since = new Date(lastSync).toISOString();

    console.log(`[SyncService] Pulling changes since ${since}`);

    const { data: trips, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .gte('updated_at', since);
    if (tripError) {
      console.error('[SyncService] Failed to fetch trips', tripError);
    } else if (trips) {
      for (const trip of trips) {
        await TripStorage.saveTrip(trip as Trip);
      }
    }

    const { data: people, error: peopleError } = await supabase
      .from('trip_people')
      .select('*')
      .gte('updated_at', since);
    if (peopleError) {
      console.error('[SyncService] Failed to fetch people', peopleError);
    } else if (people) {
      for (const person of people) {
        await PersonStorage.savePerson(person as Person);
      }
    }

    const { data: items, error: itemError } = await supabase
      .from('trip_items')
      .select('*')
      .gte('updated_at', since);
    if (itemError) {
      console.error('[SyncService] Failed to fetch items', itemError);
    } else if (items) {
      for (const item of items) {
        await ItemStorage.saveItem(item as TripItem);
      }
    }
  }

  private async handleConflict(localChange: Change): Promise<void> {
    const db = await getDatabase();

    // Create a mock server version for demonstration
    const serverVersion = {
      ...(localChange.data as Record<string, unknown>),
      serverModified: true,
      timestamp: Date.now() + 1000, // Simulate server being newer
    };

    const conflict: SyncConflict = {
      id: generateConflictId(),
      entityType: localChange.entityType,
      entityId: localChange.entityId,
      localVersion: localChange.data,
      serverVersion,
      conflictType: 'update_conflict',
      timestamp: Date.now(),
    };

    await db.put('syncConflicts', conflict);
    console.log(`[SyncService] Created conflict: ${conflict.id}`);
  }

  private async applyConflictResolution(conflict: SyncConflict): Promise<void> {
    // TODO: Apply the resolved data to the appropriate entity
    console.log(
      `[SyncService] MOCK: Applying conflict resolution for ${conflict.entityType}:${conflict.entityId}`
    );
  }

  private async notifySubscribers(): Promise<void> {
    const state = await this.getSyncState();
    this.subscribers.forEach((callback) => {
      try {
        callback(state);
      } catch (error) {
        console.error('[SyncService] Error in subscriber callback:', error);
      }
    });
  }

  /**
   * Clean up local-only changes that don't need to be synced
   */
  private async cleanupLocalOnlyChanges(): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction(['syncChanges'], 'readwrite');
    const store = tx.objectStore('syncChanges');

    // Get all changes
    const allChanges = await store.getAll();

    // Find local-only changes that are older than 1 hour (to avoid deleting very recent changes)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const localChangesToDelete = allChanges.filter(
      (change) => isLocalUser(change.userId) && change.timestamp < oneHourAgo
    );

    // Delete old local-only changes
    for (const change of localChangesToDelete) {
      await store.delete(change.id);
    }

    await tx.done;

    if (localChangesToDelete.length > 0) {
      console.log(
        `[SyncService] Cleaned up ${localChangesToDelete.length} old local-only changes`
      );
    }
  }
}

// Global sync service instance
let syncServiceInstance: SyncService | null = null;

/**
 * Get the global sync service instance
 */
export function getSyncService(options?: SyncOptions): SyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new SyncService(options);
  }
  return syncServiceInstance;
}

/**
 * Initialize and start the sync service
 */
export async function initializeSyncService(
  options?: SyncOptions
): Promise<SyncService> {
  const service = getSyncService(options);
  await service.start();
  return service;
}

function generateChangeId(): string {
  return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateConflictId(): string {
  return (
    'conflict_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
  );
}

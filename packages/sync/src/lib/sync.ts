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
    const [pendingChanges, conflicts, lastSyncTimestamp] = await Promise.all([
      this.getPendingChanges(),
      this.getConflicts(),
      db.get('syncMetadata', 'lastSyncTimestamp') || 0,
    ]);

    return {
      lastSyncTimestamp,
      pendingChanges,
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      conflicts,
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

      // Step 1: Get pending changes
      const pendingChanges = await this.getPendingChanges();
      console.log(
        `[SyncService] Found ${pendingChanges.length} pending changes`
      );

      // Step 2: Push local changes (placeholder)
      for (const change of pendingChanges) {
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
  return 'change_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

function generateConflictId(): string {
  return (
    'conflict_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
  );
}

import type { Change, SyncConflict, SyncState } from '@packing-list/model';
import { getDatabase, ConflictsStorage } from '@packing-list/offline-storage';
import {
  ConnectivityService,
  getConnectivityService,
} from '@packing-list/connectivity';
import type { SyncOptions } from './types.js';
// import { isLocalUser } from './utils.js';

/**
 * Simplified sync service that handles conflict resolution and state management
 * Pull operations are now handled by async thunks
 * Push operations are now handled by middleware
 */
export class SyncService {
  private connectivityService: ConnectivityService;
  private options: SyncOptions;
  private subscribers: ((state: SyncState) => void)[] = [];

  constructor(options: SyncOptions = {}) {
    this.options = { ...options };
    this.connectivityService = getConnectivityService();
    this.setupConnectivityListener();
  }

  // Subscription management
  subscribe(callback: (state: SyncState) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  // Get current sync state
  async getSyncState(): Promise<SyncState> {
    const db = await getDatabase();
    const pendingChanges = await this.getPendingChanges();
    const conflicts = await this.getConflicts();
    const lastSyncTimestamp = await db.get('syncMetadata', 'lastSyncTimestamp');
    const isOnline = this.connectivityService.getState().isOnline;

    return {
      lastSyncTimestamp: lastSyncTimestamp || null,
      pendingChanges,
      isOnline,
      isSyncing: false, // This is now managed by Redux
      conflicts,
    };
  }

  // Conflict resolution
  async resolveConflict(
    conflictId: string,
    resolution: 'local' | 'server' | 'manual'
  ): Promise<void> {
    console.log(
      `🔄 [SYNC] Resolving conflict ${conflictId} with resolution: ${resolution}`
    );

    const conflict = await ConflictsStorage.getConflict(conflictId);
    if (!conflict) {
      console.warn(`🔄 [SYNC] Conflict ${conflictId} not found`);
      return;
    }

    // Apply resolution based on choice
    switch (resolution) {
      case 'local':
        // Keep local version, mark conflict as resolved
        await ConflictsStorage.deleteConflict(conflictId);
        break;
      case 'server':
        // Apply server version, mark conflict as resolved
        // This would need to dispatch appropriate Redux actions
        await ConflictsStorage.deleteConflict(conflictId);
        break;
      case 'manual':
        // Manual resolution - conflict remains for user to handle
        break;
    }

    await this.notifySubscribers();
  }

  private setupConnectivityListener(): void {
    this.connectivityService.subscribe((state) => {
      console.log(
        `🔄 [SYNC] Connectivity changed: online=${state.isOnline}, connected=${state.isConnected}`
      );
      this.notifySubscribers();
    });
  }

  private async getPendingChanges(): Promise<Change[]> {
    try {
      const db = await getDatabase();
      const changes = await db.getAll('changes');
      return changes.filter((change) => !change.synced);
    } catch {
      console.warn('🔄 [SYNC] Changes table not available yet');
      return [];
    }
  }

  private async getConflicts(): Promise<SyncConflict[]> {
    return await ConflictsStorage.getAllConflicts();
  }

  private async notifySubscribers(): Promise<void> {
    const state = await this.getSyncState();
    this.subscribers.forEach((callback) => callback(state));
  }

  updateOptions(newOptions: Partial<SyncOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }
}

/**
 * Simplified change tracker - now just provides helper methods
 * Actual change tracking is handled by middleware
 */
export class ChangeTracker {
  constructor(private syncService: SyncService) {}

  async getPendingChangesCount(): Promise<number> {
    const state = await this.syncService.getSyncState();
    return state.pendingChanges.length;
  }

  async getConflictsCount(): Promise<number> {
    const state = await this.syncService.getSyncState();
    return state.conflicts.length;
  }
}

/**
 * Conflict resolver - handles conflict resolution
 */
export class ConflictResolver {
  constructor(private syncService: SyncService) {}

  async resolveConflict(
    conflictId: string,
    resolution: 'local' | 'server' | 'manual'
  ): Promise<void> {
    await this.syncService.resolveConflict(conflictId, resolution);
  }
}

// Singleton instances
let syncServiceInstance: SyncService | null = null;
let changeTrackerInstance: ChangeTracker | null = null;
let conflictResolverInstance: ConflictResolver | null = null;

export function getSyncService(options?: SyncOptions): SyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new SyncService(options);
  }
  return syncServiceInstance;
}

export function getChangeTracker(): ChangeTracker {
  if (!changeTrackerInstance) {
    changeTrackerInstance = new ChangeTracker(getSyncService());
  }
  return changeTrackerInstance;
}

export function getConflictResolver(): ConflictResolver {
  if (!conflictResolverInstance) {
    conflictResolverInstance = new ConflictResolver(getSyncService());
  }
  return conflictResolverInstance;
}

export function resetSyncService(): void {
  syncServiceInstance = null;
  changeTrackerInstance = null;
  conflictResolverInstance = null;
}

export async function initializeSyncService(
  options?: SyncOptions
): Promise<SyncService> {
  console.log('🔄 [SYNC] Initializing simplified sync service');
  const service = getSyncService(options);
  return service;
}

export function enableSyncMode(): void {
  console.log('🔄 [SYNC] Sync mode enabled (handled by middleware)');
}

export function disableSyncMode(): void {
  console.log('🔄 [SYNC] Sync mode disabled (handled by middleware)');
}

export function isChangeTrackingDisabled(): boolean {
  return false; // Change tracking is always enabled via middleware
}

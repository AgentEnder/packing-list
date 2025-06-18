import type {
  Change,
  SyncConflict,
  SyncState,
  Trip,
  Person,
  TripItem,
  RuleOverride,
  DefaultItemRule,
  RulePack,
  TripRule,
} from '@packing-list/model';
import {
  getDatabase,
  TripStorage,
  PersonStorage,
  ItemStorage,
  RuleOverrideStorage,
  DefaultItemRulesStorage,
  RulePacksStorage,
  ConflictsStorage,
} from '@packing-list/offline-storage';
import { supabase, isSupabaseAvailable } from '@packing-list/supabase';
import type { Json, Tables } from '@packing-list/supabase';
import {
  ConnectivityService,
  getConnectivityService,
} from '@packing-list/connectivity';
import type { SyncOptions, SyncStateUpdateCallback } from './types.js';
import { toJson, fromJson, isLocalUser } from './utils.js';

/**
 * Core sync service that handles pushing and pulling changes to/from the server
 */
export class SyncService {
  private connectivityService: ConnectivityService;
  private isSyncing = false;
  private syncTimer: NodeJS.Timeout | null = null;
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
      isSyncing: this.isSyncing,
      conflicts,
    };
  }

  // Main sync operations
  async start(): Promise<void> {
    if (this.isSyncing) return;

    console.log('🔄 [SYNC] Starting sync service');
    this.startAutoSync();

    // Perform initial sync if we're online
    if (this.connectivityService.getState().isOnline) {
      await this.forceSync();
    }
  }

  stop(): void {
    console.log('🔄 [SYNC] Stopping sync service');
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    this.isSyncing = false;
  }

  async forceSync(): Promise<void> {
    if (this.isSyncing) {
      console.log('🔄 [SYNC] Already syncing, skipping');
      return;
    }

    await this.performSync();
  }

  // Track a new change
  async trackChange(
    change: Omit<Change, 'id' | 'timestamp' | 'synced'>
  ): Promise<void> {
    // Skip tracking for local users
    if (isLocalUser(change.userId)) {
      console.log('🔄 [SYNC] Skipping change tracking for local user');
      return;
    }

    const changeId = this.generateChangeId();
    const changeWithId: Change = {
      ...change,
      id: changeId,
      timestamp: Date.now(),
      synced: false,
    };

    console.log(
      `🔄 [SYNC] Tracking change: ${change.operation} ${change.entityType}:${change.entityId}`
    );

    const db = await getDatabase();
    await db.add('changes', changeWithId);

    await this.notifySubscribers();

    // Try to sync immediately if online
    if (this.connectivityService.getState().isOnline && !this.isSyncing) {
      setImmediate(() => this.performSync());
    }
  }

  // Conflict resolution
  async resolveConflict(
    conflictId: string,
    resolution: 'local' | 'server' | 'manual'
  ): Promise<void> {
    console.log(
      `🔄 [SYNC] Resolving conflict ${conflictId} with ${resolution}`
    );

    // Implementation would handle conflict resolution
    await ConflictsStorage.deleteConflict(conflictId);
    await this.notifySubscribers();
  }

  // Private methods
  private setupConnectivityListener(): void {
    this.connectivityService.subscribe((state) => {
      const isOnline = state.isOnline;
      console.log(
        `🔄 [SYNC] Connectivity changed: ${isOnline ? 'online' : 'offline'}`
      );

      if (isOnline && !this.isSyncing) {
        // Delay sync to allow for network stabilization
        setTimeout(() => this.performSync(), 1000);
      }

      this.notifySubscribers();
    });
  }

  private startAutoSync(): void {
    const interval = this.options.autoSyncInterval || 30000; // 30 seconds default

    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.connectivityService.getState().isOnline && !this.isSyncing) {
        this.performSync();
      }
    }, interval);
  }

  private async performSync(): Promise<void> {
    if (this.isSyncing || !this.connectivityService.getState().isOnline) {
      return;
    }

    this.isSyncing = true;
    await this.notifySubscribers();

    try {
      console.log('🔄 [SYNC] Starting sync operation');

      // Push pending changes first
      await this.pushPendingChanges();

      // Then pull new changes from server
      await this.pullChangesFromServer();

      await this.updateSyncTimestamp();
      console.log('✅ [SYNC] Sync completed successfully');
    } catch (error) {
      console.error('❌ [SYNC] Sync failed:', error);
    } finally {
      this.isSyncing = false;
      await this.notifySubscribers();
    }
  }

  private async pushPendingChanges(): Promise<void> {
    const pendingChanges = await this.getPendingChanges();
    console.log(`🔄 [SYNC] Pushing ${pendingChanges.length} pending changes`);

    for (const change of pendingChanges) {
      try {
        await this.pushChangeToServer(change);
        await this.markChangeAsSynced(change.id);
      } catch (error) {
        console.error(`❌ [SYNC] Failed to push change ${change.id}:`, error);
      }
    }
  }

  private async pushChangeToServer(change: Change): Promise<void> {
    if (!isSupabaseAvailable()) {
      console.warn('[SYNC] Supabase not configured, skipping push');
      return;
    }

    console.log(
      `🔄 [SYNC] Pushing change: ${change.operation} ${change.entityType}:${change.entityId}`
    );

    // Implement basic push logic for each entity type
    switch (change.entityType) {
      case 'trip':
        await this.pushTripChange(change);
        break;
      case 'person':
        await this.pushPersonChange(change);
        break;
      case 'item':
        await this.pushItemChange(change);
        break;
      case 'default_item_rule':
        await this.pushDefaultItemRuleChange(change);
        break;
      case 'rule_pack':
        await this.pushRulePackChange(change);
        break;
      case 'rule_override':
        await this.pushRuleOverrideChange(change);
        break;
      case 'trip_rule':
        await this.pushTripRuleChange(change);
        break;
      default:
        console.warn(`🔄 [SYNC] Unknown entity type: ${change.entityType}`);
    }
  }

  private async pullChangesFromServer(): Promise<void> {
    if (!isSupabaseAvailable()) {
      console.warn('[SYNC] Supabase not configured, skipping pull');
      return;
    }

    console.log('🔄 [SYNC] Pulling changes from server');

    const db = await getDatabase();
    const lastSync = (await db.get('syncMetadata', 'lastSyncTimestamp')) || 0;
    const since = new Date(lastSync).toISOString();

    // Pull and apply changes for each entity type
    // This is a simplified implementation - full implementation would handle
    // more complex scenarios like conflict detection and resolution
    await this.pullTrips(since);
    await this.pullPeople(since);
    await this.pullItems(since);
    await this.pullDefaultItemRules(since);
    await this.pullRulePacks(since);
    await this.pullRuleOverrides(since);
    await this.pullTripRules(since);
  }

  // Entity-specific push methods (simplified)
  private async pushTripChange(change: Change): Promise<void> {
    const data = change.data as Partial<Trip>;
    const table = 'trips';

    switch (change.operation) {
      case 'create':
        await supabase.from(table).insert({
          id: change.entityId,
          user_id: change.userId,
          title: data.title || 'Untitled Trip',
          description: data.description,
          days: toJson(data.days),
          trip_events: toJson(data.tripEvents),
          settings: toJson(data.settings),
          version: change.version || 1,
        });
        break;
      case 'update':
        await supabase
          .from(table)
          .update({
            title: data.title,
            description: data.description,
            days: toJson(data.days),
            trip_events: toJson(data.tripEvents),
            settings: toJson(data.settings),
            version: change.version || 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', change.entityId)
          .eq('user_id', change.userId);
        break;
      case 'delete':
        await supabase
          .from(table)
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('id', change.entityId)
          .eq('user_id', change.userId);
        break;
    }
  }

  private async pushPersonChange(change: Change): Promise<void> {
    const data = change.data as Partial<Person>;
    const table = 'trip_people';

    switch (change.operation) {
      case 'create':
        await supabase.from(table).insert({
          id: change.entityId,
          trip_id: change.tripId!,
          name: data.name!,
          age: data.age,
          gender: data.gender,
          settings: toJson(data.settings),
          version: change.version || 1,
        });
        break;
      case 'update':
        await supabase
          .from(table)
          .update({
            name: data.name,
            age: data.age,
            gender: data.gender,
            settings: toJson(data.settings),
            version: change.version || 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', change.entityId);
        break;
      case 'delete':
        await supabase
          .from(table)
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('id', change.entityId);
        break;
    }
  }

  private async pushItemChange(change: Change): Promise<void> {
    const data = change.data as Partial<TripItem>;
    const table = 'trip_items';

    switch (change.operation) {
      case 'create':
        await supabase.from(table).insert({
          id: change.entityId,
          trip_id: change.tripId!,
          name: data.name!,
          category: data.category,
          quantity: data.quantity || 1,
          packed: data.packed || false,
          notes: data.notes,
          person_id: data.personId!,
          day_index: data.dayIndex,
          version: change.version || 1,
        });
        break;
      case 'update':
        await supabase
          .from(table)
          .update({
            name: data.name,
            category: data.category,
            quantity: data.quantity,
            packed: data.packed,
            notes: data.notes,
            person_id: data.personId,
            day_index: data.dayIndex,
            version: change.version || 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', change.entityId);
        break;
      case 'delete':
        await supabase
          .from(table)
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('id', change.entityId);
        break;
    }
  }

  private async pushDefaultItemRuleChange(change: Change): Promise<void> {
    console.log('🔄 [SYNC] Pushing default item rule change (not implemented)');
  }

  private async pushRulePackChange(change: Change): Promise<void> {
    console.log('🔄 [SYNC] Pushing rule pack change (not implemented)');
  }

  private async pushRuleOverrideChange(change: Change): Promise<void> {
    console.log('🔄 [SYNC] Pushing rule override change (not implemented)');
  }

  private async pushTripRuleChange(change: Change): Promise<void> {
    console.log('🔄 [SYNC] Pushing trip rule change (not implemented)');
  }

  // Entity-specific pull methods (simplified)
  private async pullTrips(since: string): Promise<void> {
    const { data: trips } = await supabase
      .from('trips')
      .select('*')
      .gte('updated_at', since);

    if (trips) {
      for (const trip of trips) {
        // Apply to local storage
        const mappedTrip: Trip = {
          id: trip.id,
          title: trip.title,
          description: trip.description || '',
          days: fromJson(trip.days) || [],
          tripEvents: fromJson(trip.trip_events) || [],
          settings: fromJson(trip.settings) || {},
        };
        await TripStorage.upsertTrip(mappedTrip);
      }
    }
  }

  private async pullPeople(since: string): Promise<void> {
    const { data: people } = await supabase
      .from('trip_people')
      .select('*')
      .gte('updated_at', since);

    if (people) {
      for (const person of people) {
        const mappedPerson: Person = {
          id: person.id,
          tripId: person.trip_id,
          name: person.name,
          age: person.age || undefined,
          gender: person.gender || undefined,
          settings: fromJson(person.settings) || {},
        };
        await PersonStorage.upsertPerson(mappedPerson);
      }
    }
  }

  private async pullItems(since: string): Promise<void> {
    const { data: items } = await supabase
      .from('trip_items')
      .select('*')
      .gte('updated_at', since);

    if (items) {
      for (const item of items) {
        const mappedItem: TripItem = {
          id: item.id,
          tripId: item.trip_id,
          name: item.name,
          category: item.category || '',
          quantity: item.quantity || 1,
          packed: item.packed || false,
          notes: item.notes || '',
          personId: item.person_id,
          dayIndex: item.day_index || undefined,
        };
        await ItemStorage.upsertItem(mappedItem);
      }
    }
  }

  private async pullDefaultItemRules(since: string): Promise<void> {
    console.log('🔄 [SYNC] Pulling default item rules (not implemented)');
  }

  private async pullRulePacks(since: string): Promise<void> {
    console.log('🔄 [SYNC] Pulling rule packs (not implemented)');
  }

  private async pullRuleOverrides(since: string): Promise<void> {
    console.log('🔄 [SYNC] Pulling rule overrides (not implemented)');
  }

  private async pullTripRules(since: string): Promise<void> {
    console.log('🔄 [SYNC] Pulling trip rules (not implemented)');
  }

  // Helper methods
  private async getPendingChanges(): Promise<Change[]> {
    const db = await getDatabase();
    return db.getAll('changes');
  }

  private async getConflicts(): Promise<SyncConflict[]> {
    return ConflictsStorage.getAllConflicts();
  }

  private async markChangeAsSynced(changeId: string): Promise<void> {
    const db = await getDatabase();
    const change = await db.get('changes', changeId);
    if (change) {
      change.synced = true;
      await db.put('changes', change);
    }
  }

  private async updateSyncTimestamp(): Promise<void> {
    const db = await getDatabase();
    await db.put('syncMetadata', Date.now(), 'lastSyncTimestamp');
  }

  private async notifySubscribers(): Promise<void> {
    const state = await this.getSyncState();
    this.subscribers.forEach((callback) => callback(state));
  }

  private generateChangeId(): string {
    return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  updateOptions(newOptions: Partial<SyncOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }
}

// Change tracker for backward compatibility
export class ChangeTracker {
  constructor(private syncService: SyncService) {}

  async trackTripChange(
    operation: 'create' | 'update' | 'delete',
    trip: Trip,
    userId: string
  ): Promise<void> {
    await this.syncService.trackChange({
      entityType: 'trip',
      entityId: trip.id,
      operation,
      data: trip,
      userId,
      version: 1,
    });
  }

  async trackPersonChange(
    operation: 'create' | 'update' | 'delete',
    person: Person,
    userId: string
  ): Promise<void> {
    await this.syncService.trackChange({
      entityType: 'person',
      entityId: person.id,
      operation,
      data: person,
      userId,
      tripId: person.tripId,
      version: 1,
    });
  }

  async trackItemChange(
    operation: 'create' | 'update' | 'delete',
    item: TripItem,
    userId: string
  ): Promise<void> {
    await this.syncService.trackChange({
      entityType: 'item',
      entityId: item.id,
      operation,
      data: item,
      userId,
      tripId: item.tripId,
      version: 1,
    });
  }

  async trackDefaultItemRuleChange(
    operation: 'create' | 'update' | 'delete',
    rule: DefaultItemRule,
    userId: string,
    tripId?: string
  ): Promise<void> {
    await this.syncService.trackChange({
      entityType: 'default_item_rule',
      entityId: rule.id,
      operation,
      data: rule,
      userId,
      tripId,
      version: 1,
    });
  }

  async trackTripRuleChange(
    operation: 'create' | 'update' | 'delete',
    tripRule: TripRule,
    userId: string
  ): Promise<void> {
    await this.syncService.trackChange({
      entityType: 'trip_rule',
      entityId: tripRule.id,
      operation,
      data: tripRule,
      userId,
      tripId: tripRule.tripId,
      version: 1,
    });
  }

  async trackRulePackChange(
    operation: 'create' | 'update' | 'delete',
    rulePack: RulePack,
    userId: string
  ): Promise<void> {
    await this.syncService.trackChange({
      entityType: 'rule_pack',
      entityId: rulePack.id,
      operation,
      data: rulePack,
      userId,
      version: 1,
    });
  }

  async getPendingChangesCount(): Promise<number> {
    const state = await this.syncService.getSyncState();
    return state.pendingChanges.length;
  }

  async getConflictsCount(): Promise<number> {
    const state = await this.syncService.getSyncState();
    return state.conflicts.length;
  }
}

// Conflict resolver for backward compatibility
export class ConflictResolver {
  constructor(private syncService: SyncService) {}

  async resolveConflict(
    conflictId: string,
    resolution: 'local' | 'server' | 'manual'
  ): Promise<void> {
    await this.syncService.resolveConflict(conflictId, resolution);
  }
}

// Global service instances
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
  if (syncServiceInstance) {
    syncServiceInstance.stop();
  }
  syncServiceInstance = null;
  changeTrackerInstance = null;
  conflictResolverInstance = null;
}

export async function initializeSyncService(
  options?: SyncOptions
): Promise<SyncService> {
  const service = getSyncService(options);
  await service.start();
  return service;
}

// Backward compatibility exports
export function enableSyncMode(): void {
  console.log('🔄 [SYNC] Sync mode enabled');
}

export function disableSyncMode(): void {
  console.log('🔄 [SYNC] Sync mode disabled');
}

export function isChangeTrackingDisabled(): boolean {
  return false;
}

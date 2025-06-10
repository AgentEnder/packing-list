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
} from '@packing-list/model';
import {
  getDatabase,
  TripStorage,
  PersonStorage,
  ItemStorage,
  RuleOverrideStorage,
  DefaultItemRulesStorage,
  RulePacksStorage,
} from '@packing-list/offline-storage';
import { supabase, isSupabaseAvailable } from '@packing-list/auth';

// Type definitions for special sync data formats
interface PackingStatusData {
  id: string;
  packed: boolean;
  updatedAt?: string;
  _packingStatusOnly: true;
  _previousStatus?: boolean;
  _bulkOperation?: boolean;
}

interface BulkPackingData {
  bulkPackingUpdate: true;
  changes: Array<{
    itemId: string;
    packed: boolean;
    previousStatus?: boolean;
  }>;
  updatedAt?: string;
}

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
    const [pendingChanges, lastSyncTimestamp, conflicts] = await Promise.all([
      this.getPendingChanges(),
      db.get('syncMetadata', 'lastSyncTimestamp') || 0,
      this.getConflicts(),
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
    if (!isSupabaseAvailable()) {
      console.warn('[SyncService] Supabase not configured');
      throw new Error('Supabase not available');
    }

    console.log(
      `[SyncService] Pushing change to server: ${change.operation} ${change.entityType}:${change.entityId}`
    );

    try {
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
        case 'rule_override':
          await this.pushRuleOverrideChange(change);
          break;
        case 'default_item_rule':
          await this.pushDefaultItemRuleChange(change);
          break;
        case 'rule_pack':
          await this.pushRulePackChange(change);
          break;
        default:
          console.warn(
            `[SyncService] Unknown entity type: ${change.entityType}`
          );
      }
    } catch (error) {
      console.error(`[SyncService] Failed to push change ${change.id}:`, error);
      throw error;
    }
  }

  private async pushTripChange(change: Change): Promise<void> {
    const table = 'trips';
    const data = change.data as Trip;

    switch (change.operation) {
      case 'create': {
        const { error: createError } = await supabase.from(table).insert({
          id: data.id,
          user_id: change.userId,
          title: data.title || 'Untitled Trip',
          description: data.description,
          days: data.days || [],
          trip_events: data.tripEvents || [],
          settings: data.settings || {},
          version: change.version,
        });
        if (createError) throw createError;
        break;
      }

      case 'update': {
        const { error: updateError } = await supabase
          .from(table)
          .update({
            title: data.title,
            description: data.description,
            days: data.days,
            trip_events: data.tripEvents,
            settings: data.settings,
            version: change.version,
            updated_at: new Date().toISOString(),
          })
          .eq('id', change.entityId)
          .eq('user_id', change.userId);
        if (updateError) throw updateError;
        break;
      }

      case 'delete': {
        const { error: deleteError } = await supabase
          .from(table)
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('id', change.entityId)
          .eq('user_id', change.userId);
        if (deleteError) throw deleteError;
        break;
      }
    }
  }

  private async pushPersonChange(change: Change): Promise<void> {
    const table = 'trip_people';
    const data = change.data as Person;

    switch (change.operation) {
      case 'create': {
        const { error: createError } = await supabase.from(table).insert({
          id: data.id,
          trip_id: change.tripId,
          name: data.name,
          age: data.age,
          gender: data.gender,
          settings: data.settings || {},
          version: change.version,
        });
        if (createError) throw createError;
        break;
      }

      case 'update': {
        const { error: updateError } = await supabase
          .from(table)
          .update({
            name: data.name,
            age: data.age,
            gender: data.gender,
            settings: data.settings,
            version: change.version,
            updated_at: new Date().toISOString(),
          })
          .eq('id', change.entityId);
        if (updateError) throw updateError;
        break;
      }

      case 'delete': {
        const { error: deleteError } = await supabase
          .from(table)
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('id', change.entityId);
        if (deleteError) throw deleteError;
        break;
      }
    }
  }

  private async pushItemChange(change: Change): Promise<void> {
    const table = 'trip_items';
    const data = change.data as TripItem;

    // Handle bulk packing updates
    if ((data as unknown as BulkPackingData).bulkPackingUpdate) {
      await this.pushBulkPackingUpdate(change);
      return;
    }

    // Handle individual packing status changes
    if ((data as unknown as PackingStatusData)._packingStatusOnly) {
      await this.pushPackingStatusUpdate(change);
      return;
    }

    switch (change.operation) {
      case 'create': {
        const { error: createError } = await supabase.from(table).insert({
          id: data.id,
          trip_id: change.tripId,
          name: data.name,
          category: data.category,
          quantity: data.quantity || 1,
          packed: data.packed || false,
          notes: data.notes,
          person_id: data.personId,
          day_index: data.dayIndex,
          version: change.version,
        });
        if (createError) throw createError;
        break;
      }

      case 'update': {
        const { error: updateError } = await supabase
          .from(table)
          .update({
            name: data.name,
            category: data.category,
            quantity: data.quantity,
            packed: data.packed,
            notes: data.notes,
            person_id: data.personId,
            day_index: data.dayIndex,
            version: change.version,
            updated_at: new Date().toISOString(),
          })
          .eq('id', change.entityId);
        if (updateError) throw updateError;
        break;
      }

      case 'delete': {
        const { error: deleteError } = await supabase
          .from(table)
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('id', change.entityId);
        if (deleteError) throw deleteError;
        break;
      }
    }
  }

  private async pushPackingStatusUpdate(change: Change): Promise<void> {
    const data = change.data as PackingStatusData;
    const { error } = await supabase
      .from('trip_items')
      .update({
        packed: data.packed,
        updated_at: data.updatedAt || new Date().toISOString(),
      })
      .eq('id', change.entityId);

    if (error) throw error;
  }

  private async pushBulkPackingUpdate(change: Change): Promise<void> {
    const data = change.data as BulkPackingData;
    const updates = data.changes;

    // Process bulk updates in batches for better performance
    const batchSize = 50;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);

      // Use upsert with conflict resolution for each item
      for (const update of batch) {
        const { error } = await supabase
          .from('trip_items')
          .update({
            packed: update.packed,
            updated_at: data.updatedAt || new Date().toISOString(),
          })
          .eq('id', update.itemId);

        if (error) {
          console.error(
            `[SyncService] Failed to update item ${update.itemId}:`,
            error
          );
          // Continue with other items rather than failing the whole batch
        }
      }
    }
  }

  private async pushRuleOverrideChange(change: Change): Promise<void> {
    const table = 'trip_rule_overrides';
    const data = change.data as RuleOverride;

    switch (change.operation) {
      case 'create': {
        const { error: createError } = await supabase.from(table).insert({
          trip_id: change.tripId || data.tripId,
          rule_id: data.ruleId,
          override_data: data,
          version: change.version,
        });
        if (createError) throw createError;
        break;
      }

      case 'update': {
        const { error: updateError } = await supabase
          .from(table)
          .update({
            override_data: data,
            version: change.version,
            updated_at: new Date().toISOString(),
          })
          .eq('trip_id', change.tripId || data.tripId)
          .eq('rule_id', data.ruleId);
        if (updateError) throw updateError;
        break;
      }

      case 'delete': {
        const { error: deleteError } = await supabase
          .from(table)
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('trip_id', change.tripId || data.tripId)
          .eq('rule_id', data.ruleId);
        if (deleteError) throw deleteError;
        break;
      }
    }
  }

  private async pushDefaultItemRuleChange(change: Change): Promise<void> {
    const table = 'default_item_rules';
    const data = change.data as DefaultItemRule;

    switch (change.operation) {
      case 'create': {
        const { error: createError } = await supabase.from(table).insert({
          user_id: change.userId,
          rule_id: data.id,
          name: data.name,
          calculation: data.calculation,
          conditions: data.conditions || [],
          notes: data.notes,
          category_id: data.categoryId,
          subcategory_id: data.subcategoryId,
          pack_ids: data.packIds || [],
          version: change.version,
        });
        if (createError) throw createError;
        break;
      }

      case 'update': {
        const { error: updateError } = await supabase
          .from(table)
          .update({
            name: data.name,
            calculation: data.calculation,
            conditions: data.conditions || [],
            notes: data.notes,
            category_id: data.categoryId,
            subcategory_id: data.subcategoryId,
            pack_ids: data.packIds || [],
            version: change.version,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', change.userId)
          .eq('rule_id', data.id);
        if (updateError) throw updateError;
        break;
      }

      case 'delete': {
        const { error: deleteError } = await supabase
          .from(table)
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('user_id', change.userId)
          .eq('rule_id', data.id);
        if (deleteError) throw deleteError;
        break;
      }
    }
  }

  private async pushRulePackChange(change: Change): Promise<void> {
    const table = 'rule_packs';
    const data = change.data as RulePack;

    switch (change.operation) {
      case 'create': {
        const { error: createError } = await supabase.from(table).insert({
          user_id: change.userId,
          pack_id: data.id,
          name: data.name,
          description: data.description,
          author: data.author,
          metadata: data.metadata,
          stats: data.stats,
          primary_category_id: data.primaryCategoryId,
          icon: data.icon,
          color: data.color,
          version: change.version,
        });
        if (createError) throw createError;
        break;
      }

      case 'update': {
        const { error: updateError } = await supabase
          .from(table)
          .update({
            name: data.name,
            description: data.description,
            author: data.author,
            metadata: data.metadata,
            stats: data.stats,
            primary_category_id: data.primaryCategoryId,
            icon: data.icon,
            color: data.color,
            version: change.version,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', change.userId)
          .eq('pack_id', data.id);
        if (updateError) throw updateError;
        break;
      }

      case 'delete': {
        const { error: deleteError } = await supabase
          .from(table)
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('user_id', change.userId)
          .eq('pack_id', data.id);
        if (deleteError) throw deleteError;
        break;
      }
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

    // Pull trips
    const { data: trips, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .gte('updated_at', since);
    if (tripError) {
      console.error('[SyncService] Failed to fetch trips', tripError);
    } else if (trips) {
      for (const tripRow of trips) {
        await this.applyServerChange(
          'trip',
          tripRow.id as string,
          tripRow,
          async (serverTrip) => {
            await TripStorage.saveTrip(serverTrip as Trip);
          }
        );
      }
    }

    // Pull people
    const { data: people, error: peopleError } = await supabase
      .from('trip_people')
      .select('*')
      .gte('updated_at', since);
    if (peopleError) {
      console.error('[SyncService] Failed to fetch people', peopleError);
    } else if (people) {
      for (const personRow of people) {
        await this.applyServerChange(
          'person',
          personRow.id as string,
          personRow,
          async (serverPerson) => {
            await PersonStorage.savePerson(serverPerson as Person);
          }
        );
      }
    }

    // Pull items
    const { data: items, error: itemError } = await supabase
      .from('trip_items')
      .select('*')
      .gte('updated_at', since);
    if (itemError) {
      console.error('[SyncService] Failed to fetch items', itemError);
    } else if (items) {
      for (const itemRow of items) {
        await this.applyServerChange(
          'item',
          itemRow.id as string,
          itemRow,
          async (serverItem) => {
            await ItemStorage.saveItem(serverItem as TripItem);
          }
        );
      }
    }

    // Pull rule overrides
    const { data: ruleOverrides, error: ruleOverrideError } = await supabase
      .from('trip_rule_overrides')
      .select('*')
      .gte('updated_at', since);
    if (ruleOverrideError) {
      console.error(
        '[SyncService] Failed to fetch rule overrides',
        ruleOverrideError
      );
    } else if (ruleOverrides) {
      for (const ruleOverride of ruleOverrides) {
        const compositeKey = `${ruleOverride.trip_id}_${ruleOverride.rule_id}`;
        await this.applyServerChange(
          'rule_override',
          compositeKey,
          ruleOverride,
          async (serverOverride) => {
            await RuleOverrideStorage.saveRuleOverride(
              (serverOverride as { override_data: RuleOverride }).override_data
            );
          }
        );
      }
    }

    // Pull default item rules
    const { data: defaultRules, error: defaultRulesError } = await supabase
      .from('default_item_rules')
      .select('*')
      .gte('updated_at', since);
    if (defaultRulesError) {
      console.error(
        '[SyncService] Failed to fetch default item rules',
        defaultRulesError
      );
    } else if (defaultRules) {
      for (const ruleRow of defaultRules) {
        // Map database row to DefaultItemRule type
        const rule: DefaultItemRule = {
          id: ruleRow.rule_id as string,
          name: ruleRow.name as string,
          calculation:
            ruleRow.calculation as unknown as DefaultItemRule['calculation'],
          conditions: ruleRow.conditions as DefaultItemRule['conditions'],
          notes: ruleRow.notes as string,
          categoryId: ruleRow.category_id as string,
          subcategoryId: ruleRow.subcategory_id as string,
          packIds: ruleRow.pack_ids as string[],
        };

        await this.applyServerChange(
          'default_item_rule',
          rule.id,
          rule,
          async (serverRule) => {
            await DefaultItemRulesStorage.saveDefaultItemRule(
              serverRule as DefaultItemRule
            );
          }
        );
      }
    }

    // Pull rule packs
    const { data: rulePacks, error: rulePacksError } = await supabase
      .from('rule_packs')
      .select('*')
      .gte('updated_at', since);
    if (rulePacksError) {
      console.error('[SyncService] Failed to fetch rule packs', rulePacksError);
    } else if (rulePacks) {
      for (const packRow of rulePacks) {
        // Map database row to RulePack type
        const pack: RulePack = {
          id: packRow.pack_id as string,
          name: packRow.name as string,
          description: packRow.description as string,
          author: packRow.author as RulePack['author'],
          metadata: packRow.metadata as RulePack['metadata'],
          stats: packRow.stats as RulePack['stats'],
          rules: [], // Rules will be loaded separately
          primaryCategoryId: packRow.primary_category_id as string,
          icon: packRow.icon as string,
          color: packRow.color as string,
        };

        await this.applyServerChange(
          'rule_pack',
          pack.id,
          pack,
          async (serverPack) => {
            await RulePacksStorage.saveRulePack(serverPack as RulePack);
          }
        );
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
    console.log(
      `[SyncService] Applying conflict resolution for ${conflict.entityType}:${conflict.entityId}`
    );

    // Apply the resolved data to the appropriate entity based on type
    switch (conflict.entityType) {
      case 'trip':
        await TripStorage.saveTrip(conflict.serverVersion as Trip);
        break;
      case 'person':
        await PersonStorage.savePerson(conflict.serverVersion as Person);
        break;
      case 'item':
        await ItemStorage.saveItem(conflict.serverVersion as TripItem);
        break;
      case 'rule_override':
        await RuleOverrideStorage.saveRuleOverride(
          conflict.serverVersion as RuleOverride
        );
        break;
      case 'default_item_rule':
        await DefaultItemRulesStorage.saveDefaultItemRule(
          conflict.serverVersion as DefaultItemRule
        );
        break;
      case 'rule_pack':
        await RulePacksStorage.saveRulePack(conflict.serverVersion as RulePack);
        break;
      default:
        console.warn(
          `[SyncService] Unknown entity type for conflict resolution: ${conflict.entityType}`
        );
    }
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

  private async applyServerChange(
    entityType: string,
    entityId: string,
    serverData: unknown,
    applyCallback: (serverData: unknown) => Promise<void>
  ): Promise<void> {
    const db = await getDatabase();

    // Check for pending local changes for this entity
    const pendingChanges = await this.getPendingChanges();
    const localChange = pendingChanges.find(
      (change) =>
        change.entityType === entityType && change.entityId === entityId
    );

    if (localChange && !localChange.synced) {
      // We have a local change that conflicts with the server change
      const conflict: SyncConflict = {
        id: generateConflictId(),
        entityType,
        entityId,
        localVersion: localChange.data,
        serverVersion: serverData,
        conflictType: 'update_conflict',
        timestamp: Date.now(),
      };

      await db.put('syncConflicts', conflict);
      console.log(
        `[SyncService] Detected conflict for ${entityType}:${entityId}, stored as ${conflict.id}`
      );
    } else {
      // No conflict, apply the server change directly
      await applyCallback(serverData);
      console.log(
        `[SyncService] Applied server change for ${entityType}:${entityId}`
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

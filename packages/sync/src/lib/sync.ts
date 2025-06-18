import type {
  Change,
  TripChange,
  PersonChange,
  ItemChange,
  RuleOverrideChange,
  DefaultItemRuleChange,
  RulePackChange,
  TripRuleChange,
  PackingStatusChange,
  BulkPackingChange,
  SyncConflict,
  SyncState,
  Trip,
  Person,
  TripItem,
  RuleOverride,
  DefaultItemRule,
  PackRuleRef,
  RulePack,
  RulePackAuthor,
  RulePackMetadata,
  RulePackStats,
  TripRule,
} from '@packing-list/model';
import {
  mapDatabaseTripToTrip,
  mapDatabasePersonToPerson,
  mapDatabaseItemToTripItem,
  isDatabaseTripRow,
  isDatabasePersonRow,
  isDatabaseItemRow,
} from './database-mappers.js';
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
import {
  deepDiff,
  getDefaultIgnorePaths,
  type DeepDiffResult,
} from './deep-diff-utils.js';

// Type definitions for special sync data formats - these are now moved to the model package
// but kept here temporarily for any remaining references

export interface SyncOptions {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  autoSyncInterval?: number; // milliseconds
  demoMode?: boolean; // Disable active syncing, only show demo conflicts
  userId?: string; // Current user ID for data filtering
  callbacks?: {
    onTripUpsert?: (trip: Trip) => void;
    onPersonUpsert?: (person: Person) => void;
    onItemUpsert?: (item: TripItem) => void;
    onRulePackUpsert?: (pack: RulePack) => void;
    onTripRuleUpsert?: (tripRule: TripRule) => void;
  };
}

// Helper function to check if a user is local and should not sync to remote
function isLocalUser(userId: string): boolean {
  return (
    userId === 'local-shared-user' ||
    userId === 'local-user' ||
    userId.startsWith('local-')
  );
}

// Type guard functions and safe converters
function toJson(data: unknown): Json {
  if (data === null || data === undefined) {
    return null;
  }

  // For complex objects, we need to ensure they're serializable as Json
  if (typeof data === 'object') {
    try {
      // Test if it can be serialized and parsed
      const serialized = JSON.stringify(data);
      return JSON.parse(serialized) as Json;
    } catch {
      // If serialization fails, return null
      return null;
    }
  }

  // Primitive types that are valid Json
  if (
    typeof data === 'string' ||
    typeof data === 'number' ||
    typeof data === 'boolean'
  ) {
    return data as Json;
  }

  return null;
}

function fromJson<T>(json: Json): T {
  // Simple cast since we trust the database to have valid data
  // In a production system, you might want to add runtime validation here
  return json as unknown as T;
}

// Type guard functions for discriminated union changes
function isPackingStatusChange(change: Change): change is PackingStatusChange {
  return (
    change.entityType === 'item' &&
    typeof change.data === 'object' &&
    change.data !== null &&
    '_packingStatusOnly' in change.data &&
    change.data._packingStatusOnly === true
  );
}

function isBulkPackingChange(change: Change): change is BulkPackingChange {
  return (
    change.entityType === 'item' &&
    typeof change.data === 'object' &&
    change.data !== null &&
    'bulkPackingUpdate' in change.data &&
    change.data.bulkPackingUpdate === true
  );
}

// Helper function to validate required fields for different operations
function validateChangeData(change: Change): boolean {
  switch (change.entityType) {
    case 'trip':
      // For trips, we need at least an id (always) and for creates we need a title
      if (change.operation === 'create') {
        return 'title' in change.data && typeof change.data.title === 'string';
      }
      return 'id' in change.data && typeof change.data.id === 'string';

    case 'person':
      // For people, we need at least name for creates, id for updates/deletes
      if (change.operation === 'create') {
        return 'name' in change.data && typeof change.data.name === 'string';
      }
      return true; // Updates and deletes are more flexible

    case 'item':
      // Handle special packing cases
      if (isPackingStatusChange(change) || isBulkPackingChange(change)) {
        return true; // These have their own validation
      }
      // For regular items, we need at least name for creates
      if (change.operation === 'create') {
        return 'name' in change.data && typeof change.data.name === 'string';
      }
      return true;

    case 'rule_override':
      // Rule overrides always need a ruleId
      return 'ruleId' in change.data && typeof change.data.ruleId === 'string';

    case 'default_item_rule':
      // Default rules need an id
      return 'id' in change.data && typeof change.data.id === 'string';

    case 'rule_pack':
      // Rule packs need an id
      return 'id' in change.data && typeof change.data.id === 'string';

    case 'trip_rule':
      // Trip rules need a ruleId
      return 'ruleId' in change.data && typeof change.data.ruleId === 'string';

    default:
      return false;
  }
}

export class SyncService {
  private connectivityService: ConnectivityService;
  private isSyncing = false;
  private syncTimer: NodeJS.Timeout | null = null;
  private options: SyncOptions;
  private subscribers: ((state: SyncState) => void)[] = [];
  // private notifyDebounceTimer: NodeJS.Timeout | null = null;
  // private readonly NOTIFY_DEBOUNCE_MS = 100; // Debounce notifications to prevent rapid updates

  constructor(options: SyncOptions = {}) {
    this.options = {
      autoSyncInterval: 30000, // 30 seconds default
      demoMode: false,
      ...options,
    };

    // Initialize connectivity service
    this.connectivityService = getConnectivityService();

    if (typeof window !== 'undefined' && !this.options.demoMode) {
      this.setupConnectivityListener();
    }

    console.log(
      `🔧 [SYNC SERVICE] Initialized with demo mode: ${this.options.demoMode}`
    );
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
    const [pendingChanges, lastSyncTimestampRaw, conflicts] = await Promise.all(
      [
        this.getPendingChanges(),
        db.get('syncMetadata', 'lastSyncTimestamp'),
        this.getConflicts(),
      ]
    );

    // Handle the case where lastSyncTimestamp doesn't exist yet
    const lastSyncTimestamp = lastSyncTimestampRaw || 0;

    // Only count syncable changes in the state
    const syncableChanges = pendingChanges.filter(
      (change) => !isLocalUser(change.userId)
    );

    return {
      lastSyncTimestamp,
      pendingChanges: syncableChanges, // Only include syncable changes
      isOnline: this.getIsOnline(),
      isSyncing: this.isSyncing,
      conflicts,
    };
  }

  /**
   * Start the sync service with automatic syncing
   */
  async start(): Promise<void> {
    console.log(
      `[SyncService] Starting sync service... (demo mode: ${this.options.demoMode})`
    );

    if (this.options.demoMode) {
      console.log(
        '[SyncService] Demo mode enabled - initializing with demo conflicts only'
      );
      this.notifySubscribers();
      return;
    }

    if (this.getIsOnline()) {
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
    if (this.options.demoMode) {
      console.log(
        '[SyncService] 🎭 Demo mode - sync disabled, regenerating demo conflicts'
      );
      this.notifySubscribers();
      return;
    }

    if (!this.getIsOnline()) {
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
    if (this.options.demoMode) {
      console.log(
        `[SyncService] 🎭 Demo mode - skipping change tracking: ${change.operation} ${change.entityType}:${change.entityId}`
      );
      return;
    }

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
    } as Change; // Type assertion needed due to discriminated union complexity

    await db.put('syncChanges', fullChange);
    console.log(
      `[SyncService] Tracked change: ${fullChange.operation} ${fullChange.entityType}:${fullChange.entityId}`
    );

    this.notifySubscribers();

    // Try to sync immediately if online and not already syncing
    if (this.getIsOnline() && !this.isSyncing) {
      // Use setTimeout to avoid synchronous sync operations
      setTimeout(() => {
        if (!this.isSyncing) {
          this.performSync().catch(console.error);
        }
      }, 100);
    }
  }

  /**
   * Resolve a sync conflict
   */
  async resolveConflict(
    conflictId: string,
    resolution: 'local' | 'server' | 'manual'
  ): Promise<void> {
    const conflict = await ConflictsStorage.getConflict(conflictId);

    if (!conflict) {
      console.warn(`[SyncService] Conflict not found: ${conflictId}`);
      return;
    }

    // Apply the resolution
    await this.applyConflictResolution(conflict);

    // Remove the conflict
    await ConflictsStorage.deleteConflict(conflictId);

    console.log(
      `[SyncService] Resolved conflict: ${conflictId} with ${resolution} resolution`
    );
    this.notifySubscribers();
  }

  private setupConnectivityListener(): void {
    if (typeof window === 'undefined') {
      console.warn(
        '[SyncService] Online/offline detection not available in this environment'
      );
      return;
    }

    // Subscribe to connectivity changes
    this.connectivityService.subscribe((connectivityState) => {
      const wasOffline = !this.getIsOnline();
      console.log(
        `[SyncService] Connectivity changed: online=${connectivityState.isOnline}, connected=${connectivityState.isConnected}`
      );

      this.notifySubscribers();

      // Trigger sync when coming back online, but only if we were actually offline
      if (connectivityState.isOnline && wasOffline && !this.isSyncing) {
        console.log('[SyncService] 🌐 Went online - triggering sync');
        this.performSync().catch(console.error);
      } else if (!connectivityState.isOnline) {
        console.log('[SyncService] 📡 Went offline');
      }
    });

    // Start auto-sync if currently online
    if (this.getIsOnline() && !this.isSyncing) {
      this.startAutoSync();
    }
  }

  private getIsOnline(): boolean {
    return this.connectivityService.getState().isOnline;
  }

  private startAutoSync(): void {
    if (this.options.demoMode) {
      console.log('[SyncService] 🎭 Demo mode - auto-sync disabled');
      return;
    }

    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.getIsOnline() && !this.isSyncing) {
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

      // Step 1: Always pull server changes first (especially important for initial sync)
      await this.pullChangesFromServer();

      // Step 2: Get pending changes to push
      const pendingChanges = await this.getPendingChanges();

      // Filter out any local user changes that shouldn't be synced
      const syncableChanges = pendingChanges.filter(
        (change) => !isLocalUser(change.userId)
      );

      if (syncableChanges.length === 0) {
        console.log(
          '[SyncService] No local changes to push (all changes are from local users or none exist)'
        );
      } else {
        console.log(
          `[SyncService] Found ${
            syncableChanges.length
          } syncable changes to push (${pendingChanges.length} total, ${
            pendingChanges.length - syncableChanges.length
          } local-only)`
        );

        // Step 3: Push local changes to server
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
      }

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
    return await ConflictsStorage.getAllConflicts();
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

    // Validate the change data before proceeding
    if (!validateChangeData(change)) {
      throw new Error(
        `Invalid change data for ${change.entityType} ${change.operation}`
      );
    }

    try {
      switch (change.entityType) {
        case 'trip':
          await this.pushTripChange(change as TripChange);
          break;
        case 'person':
          await this.pushPersonChange(change as PersonChange);
          break;
        case 'item':
          await this.pushItemChange(
            change as ItemChange | PackingStatusChange | BulkPackingChange
          );
          break;
        case 'rule_override':
          await this.pushRuleOverrideChange(change as RuleOverrideChange);
          break;
        case 'default_item_rule':
          await this.pushDefaultItemRuleChange(change as DefaultItemRuleChange);
          break;
        case 'rule_pack':
          await this.pushRulePackChange(change as RulePackChange);
          break;
        case 'trip_rule':
          await this.pushTripRuleChange(change as TripRuleChange);
          break;
        default: {
          // This should never happen with discriminated unions
          const exhaustiveCheck: never = change;
          throw new Error(
            `Unknown entity type: ${(exhaustiveCheck as Change).entityType}`
          );
        }
      }
    } catch (error) {
      console.error(`[SyncService] Failed to push change ${change.id}:`, error);
      throw error;
    }
  }

  private async pushTripChange(change: TripChange): Promise<void> {
    const table = 'trips';

    // The discriminated union ensures this is trip data
    const data = change.data;

    switch (change.operation) {
      case 'create': {
        const { error: createError } = await supabase.from(table).insert({
          id: data.id,
          user_id: change.userId,
          title: data.title || 'Untitled Trip',
          description: data.description,
          days: toJson(data.days) || null,
          trip_events: toJson(data.tripEvents) || null,
          settings: toJson(data.settings) || null,
          version: change.version,
        });
        if (createError) throw createError;
        break;
      }

      case 'update': {
        const updateData: Partial<Tables<'trips'>> = {
          version: change.version,
          updated_at: new Date().toISOString(),
        };

        // Only include fields that are present in the partial data
        if ('title' in data) updateData.title = data.title;
        if ('description' in data) updateData.description = data.description;
        if ('days' in data) updateData.days = toJson(data.days);
        if ('tripEvents' in data) {
          updateData.trip_events = toJson(data.tripEvents);
        }
        if ('settings' in data) updateData.settings = toJson(data.settings);

        const { error: updateError } = await supabase
          .from(table)
          .update(updateData)
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

  private async pushPersonChange(change: PersonChange): Promise<void> {
    const table = 'trip_people';

    // The discriminated union ensures this is person data
    const data = change.data;

    switch (change.operation) {
      case 'create': {
        if (!data.name) {
          throw new Error('Person name is required');
        }

        const { error: createError } = await supabase.from(table).insert({
          id: change.entityId, // Include client-generated ID
          trip_id: change.tripId,
          name: data.name,
          age: data.age,
          gender: data.gender,
          settings: toJson(data.settings),
          version: change.version,
        });
        if (createError) throw createError;
        break;
      }

      case 'update': {
        const updateData: Partial<Tables<'trip_people'>> = {
          version: change.version,
          updated_at: new Date().toISOString(),
        };

        // Only include fields that are present in the partial data
        if ('name' in data) updateData.name = data.name;
        if ('age' in data) updateData.age = data.age;
        if ('gender' in data) updateData.gender = data.gender;
        if ('settings' in data) updateData.settings = toJson(data.settings);

        const { error: updateError } = await supabase
          .from(table)
          .update(updateData)
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

  private async pushItemChange(
    change: ItemChange | PackingStatusChange | BulkPackingChange
  ): Promise<void> {
    // Handle bulk packing updates
    if (isBulkPackingChange(change)) {
      await this.pushBulkPackingUpdate(change);
      return;
    }

    // Handle individual packing status changes
    if (isPackingStatusChange(change)) {
      await this.pushPackingStatusUpdate(change);
      return;
    }

    // Handle regular item changes
    const table = 'trip_items';
    const data = change.data;

    switch (change.operation) {
      case 'create': {
        if (!data.name) {
          throw new Error('Item name is required');
        }

        if (!data.personId) {
          throw new Error('Item personId is required');
        }
        const { error: createError } = await supabase.from(table).insert({
          id: change.entityId, // Include client-generated ID
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
        const updateData: Partial<Tables<'trip_items'>> = {
          version: change.version,
          updated_at: new Date().toISOString(),
        };

        // Only include fields that are present in the partial data
        if ('name' in data) updateData.name = data.name;
        if ('category' in data) updateData.category = data.category;
        if ('quantity' in data) updateData.quantity = data.quantity;
        if ('packed' in data) updateData.packed = data.packed;
        if ('notes' in data) updateData.notes = data.notes;
        if ('personId' in data) updateData.person_id = data.personId;
        if ('dayIndex' in data) updateData.day_index = data.dayIndex;

        const { error: updateError } = await supabase
          .from(table)
          .update(updateData)
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

  private async pushPackingStatusUpdate(
    change: PackingStatusChange
  ): Promise<void> {
    const data = change.data;
    const { error } = await supabase
      .from('trip_items')
      .update({
        packed: data.packed,
        updated_at: data.updatedAt || new Date().toISOString(),
      })
      .eq('id', change.entityId);

    if (error) throw error;
  }

  private async pushBulkPackingUpdate(
    change: BulkPackingChange
  ): Promise<void> {
    const data = change.data;
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

  private async pushRuleOverrideChange(
    change: RuleOverrideChange
  ): Promise<void> {
    const table = 'trip_rule_overrides';
    const data = change.data;

    switch (change.operation) {
      case 'create': {
        const { error: createError } = await supabase.from(table).insert({
          trip_id: change.tripId,
          rule_id: data.ruleId,
          override_data: toJson(data),
          version: change.version,
        });
        if (createError) throw createError;
        break;
      }

      case 'update': {
        const { error: updateError } = await supabase
          .from(table)
          .update({
            override_data: toJson(data),
            version: change.version,
            updated_at: new Date().toISOString(),
          })
          .eq('trip_id', change.tripId)
          .eq('rule_id', data.ruleId);
        if (updateError) throw updateError;
        break;
      }

      case 'delete': {
        const { error: deleteError } = await supabase
          .from(table)
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('trip_id', change.tripId)
          .eq('rule_id', data.ruleId);
        if (deleteError) throw deleteError;
        break;
      }
    }
  }

  private async pushTripRuleChange(change: TripRuleChange): Promise<void> {
    const table = 'trip_default_item_rules';
    const data = change.data;

    switch (change.operation) {
      case 'create': {
        const { error: createError } = await supabase.from(table).insert({
          id: change.entityId, // Include client-generated ID
          user_id: change.userId, // Required field for the new schema
          trip_id: change.tripId,
          rule_id: data.ruleId,
          version: change.version,
        });
        if (createError) throw createError;
        break;
      }

      case 'update': {
        const { error: updateError } = await supabase
          .from(table)
          .update({
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

  private async pushDefaultItemRuleChange(
    change: DefaultItemRuleChange
  ): Promise<void> {
    const table = 'default_item_rules';
    const data = change.data;

    switch (change.operation) {
      case 'create': {
        if (!data.name) {
          throw new Error('Default item rule name is required');
        }

        if (!data.categoryId) {
          throw new Error('Default item rule categoryId is required');
        }
        const { error: createError } = await supabase.from(table).insert({
          user_id: change.userId,
          rule_id: data.id,
          name: data.name,
          calculation: toJson(data.calculation),
          conditions: toJson(data.conditions) || null,
          notes: data.notes,
          category_id: data.categoryId,
          subcategory_id: data.subcategoryId,
          pack_ids: toJson(data.packIds) || null,
          version: change.version,
          original_rule_id: data.originalRuleId,
        });
        if (createError) throw createError;

        // Create trip association if tripId is provided
        if (change.tripId) {
          const { error: tripRuleError } = await supabase
            .from('trip_default_item_rules')
            .insert({
              user_id: change.userId,
              trip_id: change.tripId,
              rule_id: data.id,
              version: change.version,
            });
          if (tripRuleError) throw tripRuleError;
        }

        break;
      }

      case 'update': {
        const updateData: Partial<Tables<'default_item_rules'>> = {
          version: change.version,
          updated_at: new Date().toISOString(),
        };

        // Only include fields that are present in the partial data
        if ('name' in data) updateData.name = data.name;
        if ('calculation' in data)
          updateData.calculation = toJson(data.calculation);
        if ('conditions' in data)
          updateData.conditions = toJson(data.conditions) || null;
        if ('notes' in data) updateData.notes = data.notes;
        if ('categoryId' in data) updateData.category_id = data.categoryId;
        if ('subcategoryId' in data)
          updateData.subcategory_id = data.subcategoryId;
        if ('packIds' in data)
          updateData.pack_ids = toJson(data.packIds) || null;
        if ('originalRuleId' in data)
          updateData.original_rule_id = data.originalRuleId;

        const { error: updateError } = await supabase
          .from(table)
          .update(updateData)
          .eq('user_id', change.userId)
          .eq('rule_id', data.id);
        if (updateError) throw updateError;

        // Update trip association version if tripId is provided
        if (change.tripId) {
          const { error: tripRuleUpdateError } = await supabase
            .from('trip_default_item_rules')
            .update({
              version: change.version,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', change.userId)
            .eq('trip_id', change.tripId)
            .eq('rule_id', data.id);
          if (tripRuleUpdateError) throw tripRuleUpdateError;
        }
        break;
      }

      case 'delete': {
        const { error: deleteError } = await supabase
          .from(table)
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('user_id', change.userId)
          .eq('rule_id', data.id);
        if (deleteError) throw deleteError;

        // Remove trip association if tripId is provided
        if (change.tripId) {
          const { error: tripRuleDeleteError } = await supabase
            .from('trip_default_item_rules')
            .update({
              is_deleted: true,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', change.userId)
            .eq('trip_id', change.tripId)
            .eq('rule_id', data.id);
          if (tripRuleDeleteError) throw tripRuleDeleteError;
        }
        break;
      }
    }
  }

  private async pushRulePackChange(change: RulePackChange): Promise<void> {
    const table = 'rule_packs';
    const data = change.data;

    switch (change.operation) {
      case 'create': {
        if (!data.name) {
          throw new Error('Rule pack name is required');
        }

        if (!data.primaryCategoryId) {
          throw new Error('Rule pack primaryCategoryId is required');
        }
        const { error: createError } = await supabase.from(table).insert({
          user_id: change.userId,
          pack_id: data.id,
          name: data.name,
          description: data.description,
          author: toJson(data.author),
          metadata: toJson(data.metadata),
          stats: toJson(data.stats),
          primary_category_id: data.primaryCategoryId,
          icon: data.icon,
          color: data.color,
          version: change.version,
        });
        if (createError) throw createError;
        break;
      }

      case 'update': {
        const updateData: Partial<Tables<'rule_packs'>> = {
          version: change.version,
          updated_at: new Date().toISOString(),
        };

        // Only include fields that are present in the partial data
        if ('name' in data) updateData.name = data.name;
        if ('description' in data) updateData.description = data.description;
        if ('author' in data) updateData.author = toJson(data.author);
        if ('metadata' in data) updateData.metadata = toJson(data.metadata);
        if ('stats' in data) updateData.stats = toJson(data.stats);
        if ('primaryCategoryId' in data)
          updateData.primary_category_id = data.primaryCategoryId;
        if ('icon' in data) updateData.icon = data.icon;
        if ('color' in data) updateData.color = data.color;

        const { error: updateError } = await supabase
          .from(table)
          .update(updateData)
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
    const isInitialSync = lastSync === 0;

    console.log(
      `[SyncService] ${
        isInitialSync ? '🚀 Initial sync -' : '📥'
      } Pulling changes since ${since}${isInitialSync ? ' (all data)' : ''}`
    );

    let syncedCount = 0;

    // Pull trips
    const { data: trips, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .gte('updated_at', since);
    if (tripError) {
      console.error('[SyncService] Failed to fetch trips', tripError);
    } else if (trips) {
      for (const tripRow of trips) {
        if (!isDatabaseTripRow(tripRow)) {
          console.error(
            '[SyncService] Invalid trip row from database:',
            tripRow
          );
          continue;
        }

        const mappedTrip = mapDatabaseTripToTrip(tripRow);
        await this.applyServerChange(
          'trip',
          mappedTrip.id,
          mappedTrip,
          async (serverTrip) => {
            // Preserve existing defaultItemRules when syncing trip from server
            // since rules are managed separately via trip_default_item_rules table
            const existingTrip = await TripStorage.getTrip(mappedTrip.id);
            const tripToSave = {
              ...(serverTrip as Trip),
              defaultItemRules: existingTrip?.defaultItemRules || [],
            };
            await TripStorage.saveTrip(tripToSave);
            this.options.callbacks?.onTripUpsert?.(tripToSave as Trip);
            syncedCount++;
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
        if (!isDatabasePersonRow(personRow)) {
          console.error(
            '[SyncService] Invalid person row from database:',
            personRow
          );
          continue;
        }

        const mappedPerson = mapDatabasePersonToPerson(personRow);
        await this.applyServerChange(
          'person',
          mappedPerson.id,
          mappedPerson,
          async (serverPerson) => {
            await PersonStorage.savePerson(serverPerson as Person);
            this.options.callbacks?.onPersonUpsert?.(serverPerson as Person);
            syncedCount++;
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
        if (!isDatabaseItemRow(itemRow)) {
          console.error(
            '[SyncService] Invalid item row from database:',
            itemRow
          );
          continue;
        }

        const mappedItem = mapDatabaseItemToTripItem(itemRow);
        await this.applyServerChange(
          'item',
          mappedItem.id,
          mappedItem,
          async (serverItem) => {
            await ItemStorage.saveItem(serverItem as TripItem);
            this.options.callbacks?.onItemUpsert?.(serverItem as TripItem);
            syncedCount++;
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
            const overrideData = fromJson<RuleOverride>(
              (serverOverride as { override_data: Json }).override_data
            );
            await RuleOverrideStorage.saveRuleOverride(overrideData);
            syncedCount++;
          }
        );
      }
    }

    // Pull default item rules first (before trip associations)
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
          calculation: fromJson<DefaultItemRule['calculation']>(
            ruleRow.calculation
          ),
          conditions: fromJson<DefaultItemRule['conditions']>(
            ruleRow.conditions
          ),
          notes: ruleRow.notes as string,
          categoryId: ruleRow.category_id as string,
          subcategoryId: ruleRow.subcategory_id as string,
          packIds: fromJson<PackRuleRef[]>(ruleRow.pack_ids),
          originalRuleId: ruleRow.original_rule_id as string,
        };

        await this.applyServerChange(
          'default_item_rule',
          rule.id,
          rule,
          async (serverRule) => {
            await DefaultItemRulesStorage.saveDefaultItemRule(
              serverRule as DefaultItemRule
            );
            syncedCount++;
          }
        );
      }
    }

    // Pull trip rule associations and apply them to trips
    const { data: tripRules, error: tripRuleError } = await supabase
      .from('trip_default_item_rules')
      .select('*')
      .gte('updated_at', since);
    if (tripRuleError) {
      console.error(
        '[SyncService] Failed to fetch trip rule links',
        tripRuleError
      );
    } else if (tripRules) {
      console.log(
        `[SyncService] Processing ${tripRules.length} trip rule associations that changed since ${since}`
      );

      for (const tripRuleRow of tripRules) {
        if (!tripRuleRow.is_deleted) {
          const tripRule: TripRule = {
            id: tripRuleRow.id as string,
            tripId: tripRuleRow.trip_id as string,
            ruleId: tripRuleRow.rule_id as string,
            createdAt: tripRuleRow.created_at as string,
            updatedAt: tripRuleRow.updated_at as string,
            version: tripRuleRow.version as number,
            isDeleted: false,
          };

          await this.applyServerChange(
            'trip_rule',
            `${tripRule.tripId}_${tripRule.ruleId}`,
            tripRule,
            async (serverTripRule) => {
              // Use the callback to handle trip-rule association
              if (this.options.callbacks?.onTripRuleUpsert) {
                this.options.callbacks.onTripRuleUpsert(
                  serverTripRule as TripRule
                );
              }
              syncedCount++;
            }
          );
        }
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
          author: fromJson<RulePackAuthor>(packRow.author),
          metadata: fromJson<RulePackMetadata>(packRow.metadata),
          stats: fromJson<RulePackStats>(packRow.stats),
          rules: [], // Rules will be populated after default rules are synced
          primaryCategoryId: packRow.primary_category_id as string,
          icon: packRow.icon as string,
          color: packRow.color as string,
        };

        await this.applyServerChange(
          'rule_pack',
          pack.id,
          pack,
          async (serverPack) => {
            // First save the rule pack with empty rules array
            await RulePacksStorage.saveRulePack(serverPack as RulePack);
            this.options.callbacks?.onRulePackUpsert?.(serverPack as RulePack);
            syncedCount++;
          }
        );
      }
    }

    console.log(
      `[SyncService] ✅ Pull completed - ${syncedCount} records synced ${
        isInitialSync ? '(initial sync)' : ''
      }`
    );

    // Populate rule pack rules after all data is synced
    await this.populateRulePackRules();
  }

  // @ts-expect-error - TODO: figure out where this was meant to be used
  private async handleConflict(localChange: Change): Promise<void> {
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

    await ConflictsStorage.saveConflict(conflict);
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
      case 'trip_rule':
        // Note: TripRulesStorage has been eliminated - trip rules are now managed per-trip
        console.log(
          `[SyncService] Skipping trip rule conflict resolution - now managed per-trip`
        );
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
    // Check for pending local changes for this entity
    const pendingChanges = await this.getPendingChanges();
    const localChange = pendingChanges.find(
      (change) =>
        change.entityType === entityType && change.entityId === entityId
    );

    if (localChange && !localChange.synced) {
      // We have a local change - perform deep comparison to check for actual conflicts
      const diffResult = await this.performDeepConflictAnalysis(
        localChange.data,
        serverData,
        entityType
      );

      if (diffResult.hasConflicts) {
        // We have actual conflicts that need resolution
        const conflict: SyncConflict = {
          id: generateConflictId(),
          entityType,
          entityId,
          localVersion: localChange.data,
          serverVersion: serverData,
          conflictType: 'update_conflict',
          timestamp: Date.now(),
          // Store the deep diff result for enhanced conflict resolution
          conflictDetails: {
            conflicts: diffResult.conflicts,
            mergedObject: diffResult.mergedObject,
          },
        };

        await ConflictsStorage.saveConflict(conflict);
        console.log(
          `[SyncService] Detected ${diffResult.conflicts.length} field conflicts for ${entityType}:${entityId}, stored as ${conflict.id}`
        );
      } else {
        // No actual conflicts - we can safely merge and apply
        console.log(
          `[SyncService] No conflicts detected for ${entityType}:${entityId}, applying smart merge`
        );

        // Apply the merged object
        await applyCallback(diffResult.mergedObject);

        // Mark the local change as synced since we've successfully merged
        await this.markChangeAsSynced(localChange.id);
      }
    } else {
      // No local changes, apply the server change directly
      await applyCallback(serverData);
      console.log(
        `[SyncService] Applied server change for ${entityType}:${entityId}`
      );
    }
  }

  /**
   * Performs deep conflict analysis between local and server data
   */
  private async performDeepConflictAnalysis(
    localData: unknown,
    serverData: unknown,
    entityType: string
  ): Promise<DeepDiffResult> {
    // Get default ignore paths plus entity-specific ignore paths
    const ignorePaths = [
      ...getDefaultIgnorePaths(),
      ...this.getEntitySpecificIgnorePaths(entityType),
    ];

    // Ensure we're working with objects
    const localObj = (localData as Record<string, unknown>) || {};
    const serverObj = (serverData as Record<string, unknown>) || {};

    return deepDiff(localObj, serverObj, ignorePaths);
  }

  /**
   * Gets entity-specific paths to ignore during conflict detection
   */
  private getEntitySpecificIgnorePaths(entityType: string): string[] {
    switch (entityType) {
      case 'trip':
        return [
          'lastSyncedAt',
          'createdAt', // Creation time shouldn't conflict
        ];
      case 'person':
      case 'item':
        return [
          'createdAt',
          'tripId', // Relationship fields shouldn't conflict
        ];
      case 'rule_override':
      case 'default_item_rule':
      case 'rule_pack':
      case 'trip_rule':
        return ['createdAt'];
      default:
        return [];
    }
  }

  /**
   * Update the options of an existing sync service instance
   */
  updateOptions(newOptions: Partial<SyncOptions>): void {
    const oldDemoMode = this.options.demoMode;
    this.options = { ...this.options, ...newOptions };

    console.log(
      `🔧 [SYNC SERVICE] Options updated - demo mode: ${oldDemoMode} → ${this.options.demoMode}`
    );
  }

  /**
   * Populate rule pack rules by querying for default item rules that belong to each pack
   */
  private async populateRulePackRules(): Promise<void> {
    try {
      console.log('[SyncService] Populating rule pack rules...');

      // Get all rule packs from storage
      const allRulePacks = await RulePacksStorage.getAllRulePacks();

      for (const pack of allRulePacks) {
        // Get all default item rules that belong to this pack
        const packRules =
          await DefaultItemRulesStorage.getDefaultItemRulesByPackId(pack.id);

        // Update the pack with its rules
        const updatedPack: RulePack = {
          ...pack,
          rules: packRules,
        };

        // Save the updated pack back to storage
        await RulePacksStorage.saveRulePack(updatedPack);
      }

      console.log(
        `[SyncService] Populated rules for ${allRulePacks.length} rule packs`
      );
    } catch (error) {
      console.error('[SyncService] Failed to populate rule pack rules:', error);
    }
  }
}

// Global sync service instance
let syncServiceInstance: SyncService | null = null;

/**
 * Reset the global sync service instance
 */
export function resetSyncService(): void {
  if (syncServiceInstance) {
    syncServiceInstance.stop();
    syncServiceInstance = null;
  }
}

/**
 * Get the global sync service instance
 */
export function getSyncService(options?: SyncOptions): SyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new SyncService(options);
  } else if (options) {
    // Update options on existing instance
    syncServiceInstance.updateOptions(options);
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

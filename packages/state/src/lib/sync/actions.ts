import { createAsyncThunk } from '@reduxjs/toolkit';
import type { SyncActions } from './types.js';
import type {
  SyncState,
  SyncConflict,
  Trip,
  Person,
  TripItem,
  Change,
  DefaultItemRule,
  TripRule,
  UserPerson,
  UserPreferences,
} from '@packing-list/model';
import { supabase, isSupabaseAvailable } from '@packing-list/supabase';
import type { Json, Tables } from '@packing-list/supabase';
import {
  TripStorage,
  PersonStorage,
  ItemStorage,
  DefaultItemRulesStorage,
  TripRuleStorage,
  UserPersonStorage,
  UserPreferencesStorage,
} from '@packing-list/offline-storage';
import { isLocalUser } from './utils.js';
import { generateDetailedConflicts } from '@packing-list/shared-utils';

/**
 * Batching system for collecting and pushing changes in bulk
 */
interface BatchedChange {
  change: Change;
  resolve: () => void;
  reject: (error: Error) => void;
}

interface BatchManager {
  trip: BatchedChange[];
  person: BatchedChange[];
  item: BatchedChange[];
  default_item_rule: BatchedChange[];
  trip_rule: BatchedChange[];
  rule_pack: BatchedChange[];
  user_person: BatchedChange[];
  user_preferences: BatchedChange[]; // Special case - only one per user, but keeping for consistency
}

// Global batch manager
const batchManager: BatchManager = {
  trip: [],
  person: [],
  item: [],
  default_item_rule: [],
  trip_rule: [],
  rule_pack: [],
  user_person: [],
  user_preferences: [],
};

// Global timeout for processing all batches
let globalBatchTimeout: NodeJS.Timeout | null = null;

// Debounce delay in milliseconds
const BATCH_DEBOUNCE_MS = 1000;

// Processing order to respect foreign key dependencies
// 1. user_preferences (singleton, no dependencies)
// 2. user_person (user-level data)
// 3. trips (parent table)
// 4. people, items (depend on trips)
// 5. default_item_rule (needed before trip_rule)
// 6. trip_rule (depends on trips and default_item_rule)
// 7. rule_pack (local only, processed last)
const PROCESSING_ORDER: (keyof BatchManager)[] = [
  'user_preferences',
  'user_person',
  'trip',
  'person',
  'item',
  'default_item_rule',
  'trip_rule',
  'rule_pack',
];

/**
 * Process all pending batches in dependency order
 */
async function processAllBatches(): Promise<void> {
  console.log('📦 [SYNC] Processing all batches in dependency order');

  // Clear the global timeout
  if (globalBatchTimeout) {
    clearTimeout(globalBatchTimeout);
    globalBatchTimeout = null;
  }

  // Process each entity type in dependency order
  for (const entityType of PROCESSING_ORDER) {
    const batch = batchManager[entityType];
    if (batch.length === 0) continue;

    console.log(
      `📦 [SYNC] Processing batch of ${batch.length} ${entityType} changes`
    );

    // Clear the batch for this entity type
    batchManager[entityType] = [];

    try {
      // Group changes by operation type
      const createChanges = batch.filter(
        (b) => b.change.operation === 'create'
      );
      const updateChanges = batch.filter(
        (b) => b.change.operation === 'update'
      );
      const deleteChanges = batch.filter(
        (b) => b.change.operation === 'delete'
      );

      // Process each operation type sequentially for this entity
      if (createChanges.length > 0) {
        await processBatchOperation(entityType, 'create', createChanges);
      }
      if (updateChanges.length > 0) {
        await processBatchOperation(entityType, 'update', updateChanges);
      }
      if (deleteChanges.length > 0) {
        await processBatchOperation(entityType, 'delete', deleteChanges);
      }

      // Resolve all promises for this entity type
      batch.forEach((b) => b.resolve());

      console.log(
        `✅ [SYNC] Successfully processed batch of ${batch.length} ${entityType} changes`
      );
    } catch (error) {
      console.error(
        `❌ [SYNC] Failed to process batch of ${entityType} changes:`,
        error
      );

      // Reject all promises for this entity type
      const errorObj =
        error instanceof Error
          ? error
          : new Error(`Batch processing failed for ${entityType}`);
      batch.forEach((b) => b.reject(errorObj));
    }
  }

  console.log('✅ [SYNC] All batches processed in correct order');
}

/**
 * Process a batch of changes for a specific operation type
 */
async function processBatchOperation(
  entityType: keyof BatchManager,
  operation: 'create' | 'update' | 'delete',
  batch: BatchedChange[]
): Promise<void> {
  switch (entityType) {
    case 'trip':
      await pushTripChangesBatch(
        batch.map((b) => b.change),
        operation
      );
      break;
    case 'person':
      await pushPersonChangesBatch(
        batch.map((b) => b.change),
        operation
      );
      break;
    case 'item':
      await pushItemChangesBatch(
        batch.map((b) => b.change),
        operation
      );
      break;
    case 'default_item_rule':
      await pushDefaultItemRuleChangesBatch(
        batch.map((b) => b.change),
        operation
      );
      break;
    case 'trip_rule':
      await pushTripRuleChangesBatch(
        batch.map((b) => b.change),
        operation
      );
      break;
    case 'rule_pack':
      // Rule packs are not synced to server - they're local only
      console.log(
        `🔄 [SYNC] Skipping rule pack batch sync (local only): ${batch.length} changes`
      );
      break;
    case 'user_person':
      await pushUserPersonChangesBatch(
        batch.map((b) => b.change),
        operation
      );
      break;
    case 'user_preferences':
      await pushUserPreferencesChangesBatch(
        batch.map((b) => b.change),
        operation
      );
      break;
    default:
      console.warn(`🔄 [SYNC] Unknown entity type for batch: ${entityType}`);
  }
}

/**
 * Check if a conflict is timestamp-only (no meaningful data differences)
 * If so, return the server version with updated timestamp, otherwise return null
 */
function resolveTimestampOnlyConflict<T extends Record<string, unknown>>(
  local: T,
  server: T
): T | null {
  // Fields to exclude from comparison (timestamps, versions, etc.)
  const excludeFields = [
    'updatedAt',
    'updated_at',
    'createdAt',
    'created_at',
    'lastModified',
    'last_modified',
    'timestamp',
    'version',
  ];

  // Create copies without excluded fields for comparison
  const localFiltered = { ...local };
  const serverFiltered = { ...server };

  // Remove excluded fields from both objects
  excludeFields.forEach((field) => {
    delete localFiltered[field];
    delete serverFiltered[field];
  });

  if (
    'isDeleted' in serverFiltered &&
    !serverFiltered.isDeleted &&
    (!('isDeleted' in localFiltered) || !localFiltered.isDeleted)
  ) {
    delete serverFiltered.isDeleted;
    delete localFiltered.isDeleted;
  }

  const conflictDetails = generateDetailedConflicts(
    localFiltered,
    serverFiltered
  );

  // If the objects are identical without excluded fields, it's a timestamp-only conflict
  if (conflictDetails.length === 0) {
    console.log(
      '✅ [SYNC] Timestamp-only conflict detected - auto-resolving with server timestamp',
      {
        localUpdatedAt: local.updatedAt,
        serverUpdatedAt: server.updatedAt,
        entityType: 'id' in local && local.id ? 'entity' : 'unknown',
        entityId: 'id' in local ? local.id : undefined,
      }
    );
    // Return the server data (which has the newer timestamp)
    return server;
  }

  console.log(
    '❌ [SYNC] Real data conflict detected - requires manual resolution',
    {
      entityId: 'id' in local ? local.id : undefined,
      localUpdatedAt: local.updatedAt,
      serverUpdatedAt: server.updatedAt,
      localFiltered,
      serverFiltered,
    },
    conflictDetails
  );

  // Add conflict details to the returned conflict object if available
  if ('conflictDetails' in (server as Record<string, unknown>)) {
    (server as Record<string, unknown>).conflictDetails = {
      conflicts: conflictDetails,
    };
  }

  return null;
}

// Main sync thunk that orchestrates all pulls
export const syncFromServer = createAsyncThunk(
  'sync/syncFromServer',
  async (params: { userId: string; since?: string }, { dispatch }) => {
    console.log('🔄 [SYNC] Starting comprehensive sync from server...');

    if (!isSupabaseAvailable() || isLocalUser(params.userId)) {
      console.log('🔄 [SYNC] Skipping sync - offline mode or local user');
      return;
    }

    try {
      // Update sync status
      dispatch(setSyncSyncingStatus(true));

      // Pull all data in a single comprehensive query
      // Using unwrap() provides proper typing and automatically throws on rejection
      const {
        trips,
        people,
        items,
        rules,
        tripRules,
        userPeople,
        userPreferences,
      } = await dispatch(pullAllDataFromServer(params)).unwrap();

      // Update last sync timestamp
      dispatch(updateLastSyncTimestamp(Date.now()));

      console.log('✅ [SYNC] Comprehensive sync completed successfully');

      return {
        trips,
        people,
        items,
        rules,
        tripRules,
        userPeople,
        userPreferences,
      };
    } catch (error) {
      console.error('❌ [SYNC] Comprehensive sync failed:', error);
      dispatch(
        setSyncError(error instanceof Error ? error.message : 'Sync failed')
      );
      throw error;
    } finally {
      dispatch(setSyncSyncingStatus(false));
    }
  }
);

// Comprehensive pull function that gets all data in one query
export const pullAllDataFromServer = createAsyncThunk(
  'sync/pullAllData',
  async (
    params: { userId: string; since?: string },
    { dispatch, rejectWithValue }
  ) => {
    console.log('🔄 [SYNC] Pulling all data from server in single query...');

    if (!isSupabaseAvailable() || isLocalUser(params.userId)) {
      console.log('🔄 [SYNC] Skipping pull - offline mode or local user');
      return {
        trips: [],
        people: [],
        items: [],
        rules: [],
        tripRules: [],
        userPeople: [],
        userPreferences: null,
        conflicts: [],
      };
    }

    const since = params.since || new Date(0).toISOString();

    // Pull user preferences first
    const { data: userPreferencesData, error: userPreferencesError } =
      await supabase
        .from('user_profiles')
        .select('preferences, updated_at')
        .eq('id', params.userId)
        .single();

    if (userPreferencesError && userPreferencesError.code !== 'PGRST116') {
      console.error(
        '❌ [SYNC] Error pulling user preferences:',
        userPreferencesError
      );
      return rejectWithValue(userPreferencesError);
    }

    // Pull user profiles (people templates)
    const { data: userPeopleData, error: userPeopleError } = await supabase
      .from('user_people')
      .select('*')
      .eq('user_id', params.userId)
      .gt('updated_at', since)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: true });

    if (userPeopleError) {
      console.error('❌ [SYNC] Error pulling user profiles:', userPeopleError);
      return rejectWithValue(userPeopleError);
    }

    // Single comprehensive query using PostgREST joins for trip data
    const { data: tripsWithRelations, error } = await supabase
      .from('trips')
      .select(
        `
        *,
        trip_people(*),
        trip_items(*),
        trip_default_item_rules(
          *,
          default_item_rules(*)
        )
      `
      )
      .eq('user_id', params.userId)
      .gt('updated_at', since)
      .eq('is_deleted', false)
      .eq('trip_people.is_deleted', false)
      .eq('trip_items.is_deleted', false)
      .eq('trip_default_item_rules.is_deleted', false)
      .eq('trip_default_item_rules.default_item_rules.is_deleted', false)
      .order('updated_at', { ascending: true });

    if (error) {
      console.error('❌ [SYNC] Error pulling comprehensive data:', error);
      return rejectWithValue(error);
    }

    console.log(
      `✅ [SYNC] Pulled ${
        tripsWithRelations?.length || 0
      } trips with relations and ${
        userPeopleData?.length || 0
      } user profiles from server`
    );

    // Process the comprehensive data
    const conflicts: SyncConflict[] = [];
    const upsertedTrips: Trip[] = [];
    const upsertedPeople: Person[] = [];
    const upsertedItems: TripItem[] = [];
    const upsertedRules: DefaultItemRule[] = [];
    const upsertedTripRules: TripRule[] = [];
    const upsertedUserPeople: UserPerson[] = [];
    let upsertedUserPreferences: UserPreferences | null = null;

    // Process user profiles first
    for (const serverUserPerson of userPeopleData || []) {
      const userPersonData: UserPerson = {
        id: serverUserPerson.id,
        userId: serverUserPerson.user_id,
        name: serverUserPerson.name,
        age: serverUserPerson.age || undefined,
        gender: (serverUserPerson.gender as UserPerson['gender']) || undefined,
        settings:
          (serverUserPerson.settings as UserPerson['settings']) || undefined,
        isUserProfile: serverUserPerson.is_user_profile ?? true,
        createdAt: serverUserPerson.created_at || new Date().toISOString(),
        updatedAt: serverUserPerson.updated_at || new Date().toISOString(),
        version: serverUserPerson.version || 1,
        isDeleted: serverUserPerson.is_deleted || false,
      };

      // Check for user person conflicts by ID (not userId)
      const localUserPerson = await UserPersonStorage.getUserPersonById(
        serverUserPerson.id
      );

      if (
        localUserPerson &&
        localUserPerson.updatedAt !== userPersonData.updatedAt
      ) {
        const resolvedUserPerson = resolveTimestampOnlyConflict(
          localUserPerson,
          userPersonData
        );
        if (resolvedUserPerson) {
          await UserPersonStorage.saveUserPerson(resolvedUserPerson);
          upsertedUserPeople.push(resolvedUserPerson);

          const { createEntityCallbacks } = await import(
            '../sync/sync-integration.js'
          );
          const entityCallbacks = createEntityCallbacks(dispatch);
          if (entityCallbacks.onUserPersonUpsert) {
            entityCallbacks.onUserPersonUpsert(resolvedUserPerson);
          }
        } else {
          conflicts.push({
            id: `user-person-${serverUserPerson.id}-${Date.now()}`,
            entityType: 'user_person',
            entityId: serverUserPerson.id,
            localVersion: localUserPerson,
            serverVersion: userPersonData,
            conflictType: 'update_conflict',
            timestamp: Date.now(),
          });
        }
      } else {
        await UserPersonStorage.saveUserPerson(userPersonData);
        upsertedUserPeople.push(userPersonData);

        const { createEntityCallbacks } = await import(
          '../sync/sync-integration.js'
        );
        const entityCallbacks = createEntityCallbacks(dispatch);
        if (entityCallbacks.onUserPersonUpsert) {
          entityCallbacks.onUserPersonUpsert(userPersonData);
        }
      }
    }

    // Process user preferences (singleton per user)
    if (userPreferencesData?.preferences) {
      const serverPreferences =
        userPreferencesData.preferences as UserPreferences;

      console.log(
        '✅ [SYNC] Processing user preferences from server:',
        serverPreferences
      );

      // Check for user preferences conflicts
      const localPreferences = await UserPreferencesStorage.getPreferences();

      if (localPreferences) {
        // For user preferences, we use a simple last-write-wins strategy
        // since they're singleton and typically small changes like lastSelectedTripId
        console.log(
          '🔄 [SYNC] Server preferences override local (last-write-wins)'
        );
        await UserPreferencesStorage.savePreferences(serverPreferences);
        upsertedUserPreferences = serverPreferences;

        // Dispatch to Redux state
        dispatch({ type: 'SYNC_USER_PREFERENCES', payload: serverPreferences });
      } else {
        // No local preferences, save server version
        console.log('🔄 [SYNC] No local preferences, saving server version');
        await UserPreferencesStorage.savePreferences(serverPreferences);
        upsertedUserPreferences = serverPreferences;

        // Dispatch to Redux state
        dispatch({ type: 'SYNC_USER_PREFERENCES', payload: serverPreferences });
      }
    } else {
      console.log('📋 [SYNC] No user preferences found on server');
    }

    // Create maps to deduplicate rules that might appear in multiple trips
    const processedRules = new Map<string, DefaultItemRule>();

    for (const serverTripData of tripsWithRelations || []) {
      // Process trip
      const tripData: Trip = {
        id: serverTripData.id,
        userId: serverTripData.user_id,
        title: serverTripData.title,
        description: serverTripData.description || '',
        days: (serverTripData.days as Trip['days']) || [],
        tripEvents: (serverTripData.trip_events as Trip['tripEvents']) || [],
        createdAt: serverTripData.created_at || new Date().toISOString(),
        updatedAt: serverTripData.updated_at || new Date().toISOString(),
        settings: (serverTripData.settings as Trip['settings']) || {
          defaultTimeZone: 'UTC',
          packingViewMode: 'by-day',
        },
        version: serverTripData.version || 1,
        isDeleted: serverTripData.is_deleted || false,
        defaultItemRules: [],
      };

      // Check for trip conflicts
      const localTrip = await TripStorage.getTrip(serverTripData.id);
      if (localTrip && localTrip.updatedAt !== tripData.updatedAt) {
        const resolvedTrip = resolveTimestampOnlyConflict(localTrip, tripData);
        if (resolvedTrip) {
          await TripStorage.saveTrip(resolvedTrip);
          upsertedTrips.push(resolvedTrip);

          const { createEntityCallbacks } = await import(
            '../sync/sync-integration.js'
          );
          const entityCallbacks = createEntityCallbacks(dispatch);
          entityCallbacks.onTripUpsert(resolvedTrip);
        } else {
          conflicts.push({
            id: `trip-${serverTripData.id}-${Date.now()}`,
            entityType: 'trip',
            entityId: serverTripData.id,
            localVersion: localTrip,
            serverVersion: tripData,
            conflictType: 'update_conflict',
            timestamp: Date.now(),
          });
        }
      } else {
        await TripStorage.saveTrip(tripData);
        upsertedTrips.push(tripData);

        const { createEntityCallbacks } = await import(
          '../sync/sync-integration.js'
        );
        const entityCallbacks = createEntityCallbacks(dispatch);
        entityCallbacks.onTripUpsert(tripData);
      }

      // Process people for this trip
      if (serverTripData.trip_people) {
        for (const serverPerson of serverTripData.trip_people) {
          const personData: Person = {
            id: serverPerson.id,
            tripId: serverPerson.trip_id,
            name: serverPerson.name,
            age: serverPerson.age || undefined,
            gender: (serverPerson.gender as Person['gender']) || undefined,
            settings:
              (serverPerson.settings as Person['settings']) || undefined,
            userPersonId: serverPerson.user_person_id || undefined, // Sprint 2: Support userPersonId
            createdAt: serverPerson.created_at || new Date().toISOString(),
            updatedAt: serverPerson.updated_at || new Date().toISOString(),
            version: serverPerson.version || 1,
            isDeleted: serverPerson.is_deleted || false,
          };

          // Check for person conflicts
          const existingPeople = await PersonStorage.getTripPeople(
            serverPerson.trip_id
          );
          const localPerson = existingPeople.find(
            (p: Person) => p.id === serverPerson.id
          );

          if (localPerson && localPerson.updatedAt !== personData.updatedAt) {
            const resolvedPerson = resolveTimestampOnlyConflict(
              localPerson,
              personData
            );
            if (resolvedPerson) {
              await PersonStorage.savePerson(resolvedPerson);
              upsertedPeople.push(resolvedPerson);

              const { createEntityCallbacks } = await import(
                '../sync/sync-integration.js'
              );
              const entityCallbacks = createEntityCallbacks(dispatch);
              entityCallbacks.onPersonUpsert(resolvedPerson);
            } else {
              conflicts.push({
                id: `person-${serverPerson.id}-${Date.now()}`,
                entityType: 'person',
                entityId: serverPerson.id,
                localVersion: localPerson,
                serverVersion: personData,
                conflictType: 'update_conflict',
                timestamp: Date.now(),
              });
            }
          } else {
            await PersonStorage.savePerson(personData);
            upsertedPeople.push(personData);

            const { createEntityCallbacks } = await import(
              '../sync/sync-integration.js'
            );
            const entityCallbacks = createEntityCallbacks(dispatch);
            entityCallbacks.onPersonUpsert(personData);
          }
        }
      }

      // Process items for this trip
      if (serverTripData.trip_items) {
        for (const serverItem of serverTripData.trip_items) {
          const itemData: TripItem = {
            id: serverItem.id,
            tripId: serverItem.trip_id,
            name: serverItem.name,
            category: serverItem.category || undefined,
            quantity: serverItem.quantity || 1,
            notes: serverItem.notes || undefined,
            personId:
              serverItem.person_id !== null ? serverItem.person_id : undefined,
            dayIndex:
              serverItem.day_index !== null &&
              serverItem.day_index !== undefined
                ? serverItem.day_index
                : undefined,
            ruleId: serverItem.rule_id || undefined,
            ruleHash: serverItem.rule_hash || undefined,
            packed: serverItem.packed || false,
            createdAt: serverItem.created_at || new Date().toISOString(),
            updatedAt: serverItem.updated_at || new Date().toISOString(),
            version: serverItem.version || 1,
            isDeleted: serverItem.is_deleted || false,
          };

          // Check for item conflicts
          const existingItems = await ItemStorage.getTripItems(
            serverItem.trip_id
          );
          const localItem = existingItems.find(
            (i: TripItem) => i.id === serverItem.id
          );

          if (localItem && localItem.updatedAt !== itemData.updatedAt) {
            const resolvedItem = resolveTimestampOnlyConflict(
              localItem,
              itemData
            );
            if (resolvedItem) {
              await ItemStorage.saveItem(resolvedItem);
              upsertedItems.push(resolvedItem);

              const { createEntityCallbacks } = await import(
                '../sync/sync-integration.js'
              );
              const entityCallbacks = createEntityCallbacks(dispatch);
              entityCallbacks.onItemUpsert(resolvedItem);
            } else {
              conflicts.push({
                id: `item-${serverItem.id}-${Date.now()}`,
                entityType: 'item',
                entityId: serverItem.id,
                localVersion: localItem,
                serverVersion: itemData,
                conflictType: 'update_conflict',
                timestamp: Date.now(),
              });
            }
          } else {
            await ItemStorage.saveItem(itemData);
            upsertedItems.push(itemData);

            const { createEntityCallbacks } = await import(
              '../sync/sync-integration.js'
            );
            const entityCallbacks = createEntityCallbacks(dispatch);
            entityCallbacks.onItemUpsert(itemData);
          }
        }
      }

      // Process trip rules and default item rules
      if (serverTripData.trip_default_item_rules) {
        for (const serverTripRule of serverTripData.trip_default_item_rules) {
          // Process trip rule association
          const tripRuleData: TripRule = {
            id: `${serverTripRule.trip_id}-${serverTripRule.rule_id}`,
            tripId: serverTripRule.trip_id,
            ruleId: serverTripRule.rule_id,
            createdAt: serverTripRule.created_at || new Date().toISOString(),
            updatedAt: serverTripRule.updated_at || new Date().toISOString(),
            version: serverTripRule.version || 1,
            isDeleted: serverTripRule.is_deleted || false,
          };

          // Check for trip rule conflicts
          const existingRules = await TripRuleStorage.getTripRules(
            serverTripRule.trip_id
          );
          const localTripRule = existingRules.find(
            (r) => r.ruleId === serverTripRule.rule_id
          );

          if (
            localTripRule &&
            localTripRule.updatedAt !== tripRuleData.updatedAt
          ) {
            const resolvedTripRule = resolveTimestampOnlyConflict(
              localTripRule,
              tripRuleData
            );
            if (resolvedTripRule) {
              await TripRuleStorage.saveTripRule(resolvedTripRule);
              upsertedTripRules.push(resolvedTripRule);

              const { createEntityCallbacks } = await import(
                '../sync/sync-integration.js'
              );
              const entityCallbacks = createEntityCallbacks(dispatch);
              entityCallbacks.onTripRuleUpsert(resolvedTripRule);
            } else {
              conflicts.push({
                id: `trip-rule-${serverTripRule.trip_id}-${
                  serverTripRule.rule_id
                }-${Date.now()}`,
                entityType: 'trip_rule',
                entityId: `${serverTripRule.trip_id}-${serverTripRule.rule_id}`,
                localVersion: localTripRule,
                serverVersion: tripRuleData,
                conflictType: 'update_conflict',
                timestamp: Date.now(),
              });
            }
          } else {
            await TripRuleStorage.saveTripRule(tripRuleData);
            upsertedTripRules.push(tripRuleData);

            const { createEntityCallbacks } = await import(
              '../sync/sync-integration.js'
            );
            const entityCallbacks = createEntityCallbacks(dispatch);
            entityCallbacks.onTripRuleUpsert(tripRuleData);
          }

          // Process the actual default item rule (deduplicated)
          if (
            serverTripRule.default_item_rules &&
            !processedRules.has(serverTripRule.default_item_rules.id)
          ) {
            const serverRule = serverTripRule.default_item_rules;
            const ruleData: DefaultItemRule & {
              updatedAt?: string;
              createdAt?: string;
              version?: number;
              isDeleted?: boolean;
            } = {
              id: serverRule.id,
              originalRuleId: serverRule.original_rule_id || serverRule.id,
              name: serverRule.name,
              calculation:
                serverRule.calculation as DefaultItemRule['calculation'],
              conditions:
                (serverRule.conditions as DefaultItemRule['conditions']) ||
                undefined,
              notes: serverRule.notes || undefined,
              categoryId: serverRule.category_id || undefined,
              subcategoryId: serverRule.subcategory_id || undefined,
              packIds:
                (serverRule.pack_ids as DefaultItemRule['packIds']) ||
                undefined,
              updatedAt: serverRule.updated_at || new Date().toISOString(),
              createdAt: serverRule.created_at || new Date().toISOString(),
              version: serverRule.version || 1,
              isDeleted: serverRule.is_deleted || false,
            };

            // Check for rule conflicts
            const localRule = await DefaultItemRulesStorage.getDefaultItemRule(
              serverRule.id
            );

            if (
              localRule &&
              (localRule as DefaultItemRule & { updatedAt?: string })
                .updatedAt !== ruleData.updatedAt
            ) {
              const resolvedRule = resolveTimestampOnlyConflict(
                localRule,
                ruleData
              );
              if (resolvedRule) {
                await DefaultItemRulesStorage.saveDefaultItemRule(resolvedRule);
                processedRules.set(serverRule.id, resolvedRule);
                upsertedRules.push(resolvedRule);

                const { createEntityCallbacks } = await import(
                  '../sync/sync-integration.js'
                );
                const entityCallbacks = createEntityCallbacks(dispatch);
                entityCallbacks.onDefaultItemRuleUpsert({
                  rule: resolvedRule,
                  tripId: serverTripRule.trip_id,
                });
              } else {
                conflicts.push({
                  id: `rule-${serverRule.id}-${Date.now()}`,
                  entityType: 'default_item_rule',
                  entityId: serverRule.id,
                  localVersion: localRule,
                  serverVersion: ruleData,
                  conflictType: 'update_conflict',
                  timestamp: Date.now(),
                });
              }
            } else {
              await DefaultItemRulesStorage.saveDefaultItemRule(ruleData);
              processedRules.set(serverRule.id, ruleData);
              upsertedRules.push(ruleData);

              const { createEntityCallbacks } = await import(
                '../sync/sync-integration.js'
              );
              const entityCallbacks = createEntityCallbacks(dispatch);
              entityCallbacks.onDefaultItemRuleUpsert({
                rule: ruleData,
                tripId: serverTripRule.trip_id,
              });
            }
          }
        }
      }
    }

    // Store conflicts if any
    if (conflicts.length > 0) {
      dispatch(setSyncConflicts(conflicts));
    }

    console.log(
      `✅ [SYNC] Processed comprehensive data: ${upsertedTrips.length} trips, ${
        upsertedPeople.length
      } people, ${upsertedItems.length} items, ${upsertedRules.length} rules, ${
        upsertedTripRules.length
      } trip rules, ${upsertedUserPeople.length} user people, ${
        upsertedUserPreferences ? 'user preferences' : 'no user preferences'
      }`
    );

    return {
      trips: upsertedTrips,
      people: upsertedPeople,
      items: upsertedItems,
      rules: upsertedRules,
      tripRules: upsertedTripRules,
      userPeople: upsertedUserPeople,
      userPreferences: upsertedUserPreferences,
      conflicts,
    };
  }
);

// Push operations (called from middleware) - now with batching
export const pushChangeToServer = async (change: Change): Promise<void> => {
  if (!isSupabaseAvailable() || isLocalUser(change.userId)) {
    console.log('🔄 [SYNC] Skipping push - offline mode or local user');
    return;
  }

  // Check if we have an authenticated session before attempting to push
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (!user || authError) {
    console.log('🔄 [SYNC] Skipping server push - no authenticated session:', {
      hasUser: !!user,
      authError: authError?.message,
    });
    return;
  }

  console.log(
    `🔄 [SYNC] Batching change: ${change.operation} ${change.entityType}:${change.entityId}`
  );

  return new Promise<void>((resolve, reject) => {
    const entityType = change.entityType as keyof BatchManager;

    // Add change to batch
    batchManager[entityType].push({
      change,
      resolve,
      reject,
    });

    // Clear existing global timeout
    if (globalBatchTimeout) {
      clearTimeout(globalBatchTimeout);
    }

    // Set new global timeout to process all batches in order
    globalBatchTimeout = setTimeout(() => {
      processAllBatches().catch((error: unknown) => {
        console.error(`❌ [SYNC] Global batch processing failed:`, error);
      });
    }, BATCH_DEBOUNCE_MS);
  });
};

// Batch push functions for bulk operations
async function pushTripChangesBatch(
  changes: Change[],
  operation: 'create' | 'update' | 'delete'
): Promise<void> {
  if (changes.length === 0) return;

  console.log(`📦 [SYNC] Pushing ${changes.length} trip ${operation} changes`);

  if (operation === 'delete') {
    const entityIds = changes.map((c) => c.entityId);
    const { error } = await supabase
      .from('trips')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .in('id', entityIds);

    if (error) {
      throw new Error(`Failed to batch delete trips: ${error.message}`);
    }
  } else {
    const tripData = changes.map((change) => {
      const trip = change.data as Trip;
      return {
        id: trip.id,
        user_id: trip.userId,
        title: trip.title,
        description: trip.description,
        days: trip.days as Json,
        trip_events: trip.tripEvents as Json,
        settings: trip.settings as Json,
        version: trip.version,
        is_deleted: trip.isDeleted || false,
        created_at: trip.createdAt,
        updated_at: trip.updatedAt,
      };
    });

    const { error } = await supabase.from('trips').upsert(tripData);

    if (error) {
      throw new Error(`Failed to batch upsert trips: ${error.message}`);
    }
  }
}

async function pushPersonChangesBatch(
  changes: Change[],
  operation: 'create' | 'update' | 'delete'
): Promise<void> {
  if (changes.length === 0) return;

  console.log(
    `📦 [SYNC] Pushing ${changes.length} person ${operation} changes`
  );

  if (operation === 'delete') {
    const entityIds = changes.map((c) => c.entityId);
    const { error } = await supabase
      .from('trip_people')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .in('id', entityIds);

    if (error) {
      throw new Error(`Failed to batch delete people: ${error.message}`);
    }
  } else {
    const peopleData = changes.map((change) => {
      const person = change.data as Person;
      return {
        id: person.id,
        trip_id: person.tripId,
        name: person.name,
        age: person.age,
        gender: person.gender,
        settings: person.settings as Json,
        user_person_id: person.userPersonId || null, // Sprint 2: Include userPersonId
        version: person.version,
        is_deleted: person.isDeleted || false,
        created_at: person.createdAt,
        updated_at: person.updatedAt,
      };
    });

    const { error } = await supabase.from('trip_people').upsert(peopleData);

    if (error) {
      throw new Error(`Failed to batch upsert people: ${error.message}`);
    }
  }
}

async function pushItemChangesBatch(
  changes: Change[],
  operation: 'create' | 'update' | 'delete'
): Promise<void> {
  if (changes.length === 0) return;

  console.log(`📦 [SYNC] Pushing ${changes.length} item ${operation} changes`);

  if (operation === 'delete') {
    const entityIds = changes.map((c) => c.entityId);
    const { error } = await supabase
      .from('trip_items')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .in('id', entityIds);

    if (error) {
      throw new Error(`Failed to batch delete items: ${error.message}`);
    }
  } else {
    const itemsData = changes.map((change) => {
      const item = change.data as TripItem;
      const tripId = item.tripId || change.tripId;
      if (!tripId) {
        throw new Error(`No tripId available for item ${item.id}`);
      }

      return {
        id: item.id,
        trip_id: tripId,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        notes: item.notes,
        person_id: item.personId !== undefined ? item.personId : null,
        day_index: item.dayIndex !== undefined ? item.dayIndex : null,
        rule_id: item.ruleId,
        rule_hash: item.ruleHash,
        packed: item.packed,
        version: item.version,
        is_deleted: item.isDeleted || false,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      };
    });

    const { error } = await supabase.from('trip_items').upsert(itemsData);

    if (error) {
      throw new Error(`Failed to batch upsert items: ${error.message}`);
    }
  }
}

async function pushDefaultItemRuleChangesBatch(
  changes: Change[],
  operation: 'create' | 'update' | 'delete'
): Promise<void> {
  if (changes.length === 0) return;

  console.log(
    `📦 [SYNC] Pushing ${changes.length} default item rule ${operation} changes`
  );

  if (operation === 'delete') {
    const entityIds = changes.map((c) => c.entityId);
    const { error } = await supabase
      .from('default_item_rules')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .in('id', entityIds);

    if (error) {
      throw new Error(
        `Failed to batch delete default item rules: ${error.message}`
      );
    }
  } else {
    const rulesData = changes.map((change) => {
      const rule = change.data as DefaultItemRule;
      return {
        id: rule.id,
        rule_id: rule.id,
        original_rule_id: rule.originalRuleId,
        name: rule.name,
        calculation: rule.calculation as Json,
        conditions: rule.conditions as Json,
        notes: rule.notes,
        category_id: rule.categoryId,
        subcategory_id: rule.subcategoryId,
        pack_ids: rule.packIds as Json,
        user_id: change.userId,
        version: 1,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    const { error } = await supabase
      .from('default_item_rules')
      .upsert(rulesData);

    if (error) {
      throw new Error(
        `Failed to batch upsert default item rules: ${error.message}`
      );
    }
  }
}

async function pushTripRuleChangesBatch(
  changes: Change[],
  operation: 'create' | 'update' | 'delete'
): Promise<void> {
  if (changes.length === 0) return;

  console.log(
    `📦 [SYNC] Pushing ${changes.length} trip rule ${operation} changes`
  );

  if (operation === 'delete') {
    const deletePromises = changes.map((change) => {
      const tripRule = change.data as TripRule;
      return supabase
        .from('trip_default_item_rules')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('trip_id', tripRule.tripId)
        .eq('rule_id', tripRule.ruleId);
    });

    const results = await Promise.all(deletePromises);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      throw new Error(
        `Failed to batch delete trip rules: ${errors
          .map((e) => e.error?.message)
          .join(', ')}`
      );
    }
  } else {
    const tripRulesData = changes.map((change) => {
      const tripRule = change.data as TripRule;
      return {
        trip_id: tripRule.tripId,
        rule_id: tripRule.ruleId,
        user_id: change.userId,
        version: tripRule.version,
        is_deleted: tripRule.isDeleted || false,
        created_at: tripRule.createdAt,
        updated_at: tripRule.updatedAt,
      };
    });

    const { error } = await supabase
      .from('trip_default_item_rules')
      .upsert(tripRulesData);

    if (error) {
      throw new Error(`Failed to batch upsert trip rules: ${error.message}`);
    }
  }
}

async function pushUserPersonChangesBatch(
  changes: Change[],
  operation: 'create' | 'update' | 'delete'
): Promise<void> {
  console.log(
    `🔄 [SYNC] Processing ${changes.length} user person ${operation} operations`
  );

  for (const change of changes) {
    const userPerson = change.data as UserPerson;

    const [upsertChanges, deleteChanges] = changes.reduce(
      ([up, del], change) => {
        if (change.entityType === 'user_person') {
          if (change.operation === 'create' || change.operation === 'update') {
            up.push({
              name: userPerson.name,
              user_id: userPerson.userId,
              age: userPerson.age ?? null,
              gender: userPerson.gender ?? null,
              settings: userPerson.settings as Json,
              is_user_profile: userPerson.isUserProfile,
              version: userPerson.version,
              created_at: userPerson.createdAt,
              updated_at: userPerson.updatedAt,
              id: userPerson.id,
              is_deleted: userPerson.isDeleted ?? false,
              auto_add_to_new_trips: userPerson.autoAddToNewTrips ?? false,
            });
          } else if (change.operation === 'delete') {
            del.push(change);
          }
        }
        return [up, del];
      },
      [[], []] as [Tables<'user_people'>[], { id: string }[]]
    );

    try {
      if (operation === 'create' || operation === 'update') {
        // Note: Using existing user_profiles table as the backend storage
        const { error } = await supabase
          .from('user_people')
          .upsert(upsertChanges);

        if (error) {
          console.error(
            `❌ [SYNC] Error ${operation}ing user person ${userPerson.id}:`,
            error
          );
          throw error;
        }
      } else if (operation === 'delete') {
        const { error } = await supabase
          .from('user_people')
          .delete()
          .in(
            'id',
            deleteChanges.map((c) => c.id)
          );

        if (error) {
          console.error(
            `❌ [SYNC] Error deleting user person ${userPerson.id}:`,
            error
          );
          throw error;
        }
      }

      console.log(
        `✅ [SYNC] Successfully ${operation}d user person: ${userPerson.name}`
      );
    } catch (error) {
      console.error(
        `❌ [SYNC] Failed to ${operation} user person ${userPerson.id}:`,
        error
      );
      throw error;
    }
  }
}

async function pushUserPreferencesChangesBatch(
  changes: Change[],
  operation: 'create' | 'update' | 'delete'
): Promise<void> {
  if (changes.length === 0) return;

  console.log(
    `🔄 [SYNC] Processing ${changes.length} user preferences ${operation} operations`
  );

  // User preferences are singleton - there should only be one per user
  for (const change of changes) {
    const userPreferences = change.data as UserPreferences;

    try {
      if (operation === 'create' || operation === 'update') {
        const { error } = await supabase.from('user_profiles').upsert(
          {
            id: change.userId,
            preferences: userPreferences as Json,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'id',
          }
        );

        if (error) {
          console.error(
            `❌ [SYNC] Error ${operation}ing user preferences for ${change.userId}:`,
            error
          );
          throw error;
        }

        console.log(
          `✅ [SYNC] Successfully ${operation}d user preferences for user: ${change.userId}`
        );
      } else if (operation === 'delete') {
        // For user preferences deletion, we set preferences to null rather than deleting the profile
        const { error } = await supabase
          .from('user_profiles')
          .update({
            preferences: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', change.userId);

        if (error) {
          console.error(
            `❌ [SYNC] Error deleting user preferences for ${change.userId}:`,
            error
          );
          throw error;
        }

        console.log(
          `✅ [SYNC] Successfully cleared user preferences for user: ${change.userId}`
        );
      }
    } catch (error) {
      console.error(
        `❌ [SYNC] Failed to ${operation} user preferences for ${change.userId}:`,
        error
      );
      throw error;
    }
  }
}

// Basic sync state actions
export const setSyncState = (payload: Partial<SyncState>): SyncActions => ({
  type: 'SET_SYNC_STATE',
  payload,
});

export const setSyncInitialized = (payload: boolean): SyncActions => ({
  type: 'SET_SYNC_INITIALIZED',
  payload,
});

export const addSyncConflict = (payload: SyncConflict): SyncActions => ({
  type: 'ADD_SYNC_CONFLICT',
  payload,
});

export const removeSyncConflict = (payload: string): SyncActions => ({
  type: 'REMOVE_SYNC_CONFLICT',
  payload,
});

export const clearSyncConflicts = (): SyncActions => ({
  type: 'CLEAR_SYNC_CONFLICTS',
});

export const setSyncConflicts = (payload: SyncConflict[]): SyncActions => ({
  type: 'SET_SYNC_CONFLICTS',
  payload,
});

export const setSyncOnlineStatus = (payload: boolean): SyncActions => ({
  type: 'SET_SYNC_ONLINE_STATUS',
  payload,
});

export const setSyncSyncingStatus = (payload: boolean): SyncActions => ({
  type: 'SET_SYNC_SYNCING_STATUS',
  payload,
});

export const updateLastSyncTimestamp = (payload: number): SyncActions => ({
  type: 'UPDATE_LAST_SYNC_TIMESTAMP',
  payload,
});

export const setSyncPendingChanges = (
  payload: SyncState['pendingChanges']
): SyncActions => ({
  type: 'SET_SYNC_PENDING_CHANGES',
  payload,
});

export const setSyncError = (payload: string | null): SyncActions => ({
  type: 'SET_SYNC_ERROR',
  payload,
});

export const resetSyncState = (): SyncActions => ({
  type: 'RESET_SYNC_STATE',
});

// Entity merge actions
export const mergeSyncedTrip = (payload: Trip): SyncActions => ({
  type: 'MERGE_SYNCED_TRIP',
  payload,
});

export const mergeSyncedPerson = (payload: Person): SyncActions => ({
  type: 'MERGE_SYNCED_PERSON',
  payload,
});

export const mergeSyncedItem = (payload: TripItem): SyncActions => ({
  type: 'MERGE_SYNCED_ITEM',
  payload,
});

export const mergeSyncedUserPerson = (payload: UserPerson): SyncActions => ({
  type: 'MERGE_SYNCED_USER_PERSON',
  payload,
});

// Change tracking action
export const trackSyncChange = (
  payload: Omit<Change, 'id' | 'timestamp' | 'synced'>
): SyncActions => ({
  type: 'TRACK_SYNC_CHANGE',
  payload,
});

/**
 * Properly resolve a sync conflict by applying the chosen data to both Redux and IndexedDB
 */
export const resolveConflict = createAsyncThunk(
  'sync/resolveConflict',
  async (
    params: {
      conflictId: string;
      strategy: 'local' | 'server' | 'manual';
      manualData?: unknown;
      conflict: SyncConflict;
    },
    { dispatch }
  ) => {
    const { conflictId, strategy, manualData, conflict } = params;

    console.log(
      `🔧 [RESOLVE_CONFLICT] Resolving conflict ${conflictId} with strategy: ${strategy}`
    );

    try {
      let dataToApply: unknown;

      // Determine what data to apply based on strategy
      switch (strategy) {
        case 'local':
          // Keep local version
          dataToApply = conflict.localVersion;
          break;
        case 'server':
          // Apply server version
          dataToApply = conflict.serverVersion;
          break;
        case 'manual':
          // Apply manually merged data
          dataToApply = manualData || conflict.serverVersion;
          break;
        default:
          throw new Error(`Unknown resolution strategy: ${strategy}`);
      }

      console.log(
        `🔧 [RESOLVE_CONFLICT] Applying ${strategy} data for ${conflict.entityType}:${conflict.entityId}`
      );

      // Apply data based on entity type using proper Redux actions that trigger sync tracking
      switch (conflict.entityType) {
        case 'trip': {
          const tripData = dataToApply as Trip;

          // Save to IndexedDB first
          await TripStorage.saveTrip(tripData);

          // For server/manual strategies, use merge action (data from server)
          // For local strategy, we don't need to update Redux since it's already there
          if (strategy !== 'local') {
            dispatch(mergeSyncedTrip(tripData));
          }

          console.log(
            `✅ [RESOLVE_CONFLICT] Applied trip data to IndexedDB${
              strategy !== 'local' ? ' and Redux' : ''
            }`
          );
          break;
        }

        case 'person': {
          const personData = dataToApply as Person;

          // Save to IndexedDB first
          await PersonStorage.savePerson(personData);

          // For all strategies, we need to update Redux properly
          // Use UPDATE_PERSON action which will trigger sync tracking
          dispatch({
            type: 'UPDATE_PERSON',
            payload: personData,
          });

          console.log(
            `✅ [RESOLVE_CONFLICT] Applied person data to IndexedDB and Redux`
          );
          break;
        }

        case 'item': {
          const itemData = dataToApply as TripItem;

          // Save to IndexedDB first
          await ItemStorage.saveItem(itemData);

          // For server/manual strategies, use merge action
          // For local strategy, we don't need to update Redux since it's already there
          if (strategy !== 'local') {
            dispatch(mergeSyncedItem(itemData));
          }

          console.log(
            `✅ [RESOLVE_CONFLICT] Applied item data to IndexedDB${
              strategy !== 'local' ? ' and Redux' : ''
            }`
          );
          break;
        }

        case 'default_item_rule': {
          const ruleData = dataToApply as DefaultItemRule;

          // Save to IndexedDB
          await DefaultItemRulesStorage.saveDefaultItemRule(ruleData);

          // Rules don't have a direct Redux action, they're handled by recalculation
          console.log(`✅ [RESOLVE_CONFLICT] Applied rule data to IndexedDB`);
          break;
        }

        case 'trip_rule': {
          const tripRuleData = dataToApply as TripRule;

          // Save to IndexedDB
          await TripRuleStorage.saveTripRule(tripRuleData);

          // Trip rules don't have a direct Redux action, they're handled by recalculation
          console.log(
            `✅ [RESOLVE_CONFLICT] Applied trip rule data to IndexedDB`
          );
          break;
        }

        case 'user_person': {
          const userPersonData = dataToApply as UserPerson;

          // Save to IndexedDB first
          await UserPersonStorage.saveUserPerson(userPersonData);

          // Use the proper Redux action for user people
          // This will trigger sync tracking and update the UI
          dispatch({
            type: 'UPDATE_USER_PERSON',
            payload: {
              id: userPersonData.id,
              name: userPersonData.name,
              age: userPersonData.age,
              gender: userPersonData.gender,
              settings: userPersonData.settings,
              isUserProfile: userPersonData.isUserProfile,
            },
          });

          console.log(
            `✅ [RESOLVE_CONFLICT] Applied user person data to IndexedDB and Redux`
          );
          break;
        }

        case 'user_preferences': {
          const userPreferencesData = dataToApply as UserPreferences;

          // Save to IndexedDB
          await UserPreferencesStorage.savePreferences(userPreferencesData);

          // Use the proper Redux action for user preferences
          dispatch({
            type: 'SYNC_USER_PREFERENCES',
            payload: userPreferencesData,
          });

          console.log(
            `✅ [RESOLVE_CONFLICT] Applied user preferences data to IndexedDB and Redux`
          );
          break;
        }

        default:
          console.warn(
            `🔧 [RESOLVE_CONFLICT] Unknown entity type: ${conflict.entityType}`
          );
      }

      // Remove the conflict from Redux state
      dispatch(removeSyncConflict(conflictId));

      console.log(
        `✅ [RESOLVE_CONFLICT] Successfully resolved conflict ${conflictId} using ${strategy} strategy`
      );

      return { conflictId, strategy, applied: true };
    } catch (error) {
      console.error(
        `❌ [RESOLVE_CONFLICT] Failed to resolve conflict ${conflictId}:`,
        error
      );
      throw error;
    }
  }
);

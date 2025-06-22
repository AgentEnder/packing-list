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
} from '@packing-list/model';
import { supabase, isSupabaseAvailable } from '@packing-list/supabase';
import type { Json } from '@packing-list/supabase';
import {
  TripStorage,
  PersonStorage,
  ItemStorage,
  DefaultItemRulesStorage,
  TripRuleStorage,
} from '@packing-list/offline-storage';
import { isLocalUser } from './utils.js';

// Async thunks for pulling data from server
export const pullTripsFromServer = createAsyncThunk(
  'sync/pullTrips',
  async (params: { userId: string; since?: string }, { dispatch }) => {
    console.log('🔄 [SYNC] Pulling trips from server...');

    if (!isSupabaseAvailable() || isLocalUser(params.userId)) {
      console.log('🔄 [SYNC] Skipping trip pull - offline mode or local user');
      return { trips: [], conflicts: [] };
    }

    const since = params.since || new Date(0).toISOString();
    const { data: trips, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', params.userId)
      .gt('updated_at', since)
      .order('updated_at', { ascending: true });

    if (error) {
      console.error('❌ [SYNC] Error pulling trips:', error);
      throw new Error(`Failed to pull trips: ${error.message}`);
    }

    console.log(`✅ [SYNC] Pulled ${trips?.length || 0} trips from server`);

    // Process each trip for conflicts and upserts
    const conflicts: SyncConflict[] = [];
    const upsertedTrips: Trip[] = [];

    for (const serverTrip of trips || []) {
      const tripData: Trip = {
        id: serverTrip.id,
        userId: serverTrip.user_id,
        title: serverTrip.title,
        description: serverTrip.description || '',
        days: (serverTrip.days as Trip['days']) || [],
        tripEvents: (serverTrip.trip_events as Trip['tripEvents']) || [],
        createdAt: serverTrip.created_at || new Date().toISOString(),
        updatedAt: serverTrip.updated_at || new Date().toISOString(),
        settings: (serverTrip.settings as Trip['settings']) || {
          defaultTimeZone: 'UTC',
          packingViewMode: 'by-day',
        },
        version: serverTrip.version || 1,
        isDeleted: serverTrip.is_deleted || false,
        defaultItemRules: [],
      };

      // Check for conflicts
      const localTrip = await TripStorage.getTrip(serverTrip.id);

      if (localTrip && localTrip.updatedAt !== tripData.updatedAt) {
        // Conflict detected
        const conflict: SyncConflict = {
          id: `trip-${serverTrip.id}-${Date.now()}`,
          entityType: 'trip',
          entityId: serverTrip.id,
          localVersion: localTrip,
          serverVersion: tripData,
          conflictType: 'update_conflict',
          timestamp: Date.now(),
        };
        conflicts.push(conflict);
        console.log(`⚠️ [SYNC] Trip conflict detected: ${serverTrip.id}`);
      } else {
        // No conflict, apply server data
        await TripStorage.saveTrip(tripData);
        upsertedTrips.push(tripData);

        // Dispatch upsert action
        dispatch({
          type: 'UPSERT_SYNCED_TRIP',
          payload: tripData,
        });
      }
    }

    // Store conflicts
    if (conflicts.length > 0) {
      dispatch(setSyncConflicts(conflicts));
    }

    return { trips: upsertedTrips, conflicts };
  }
);

export const pullPeopleFromServer = createAsyncThunk(
  'sync/pullPeople',
  async (
    params: { tripIds: string[]; since?: string; userId: string },
    { dispatch }
  ) => {
    console.log(
      `🔄 [SYNC] Pulling people from server for ${params.tripIds.length} trips...`
    );

    if (!isSupabaseAvailable() || isLocalUser(params.userId)) {
      console.log(
        '🔄 [SYNC] Skipping people pull - offline mode or local user'
      );
      return { people: [], conflicts: [] };
    }

    if (params.tripIds.length === 0) {
      console.log('🔄 [SYNC] No trips to pull people for');
      return { people: [], conflicts: [] };
    }

    const since = params.since || new Date(0).toISOString();
    const { data: people, error } = await supabase
      .from('trip_people')
      .select('*')
      .in('trip_id', params.tripIds)
      .gt('updated_at', since)
      .order('updated_at', { ascending: true });

    if (error) {
      console.error('❌ [SYNC] Error pulling people:', error);
      throw new Error(`Failed to pull people: ${error.message}`);
    }

    console.log(`✅ [SYNC] Pulled ${people?.length || 0} people from server`);

    const conflicts: SyncConflict[] = [];
    const upsertedPeople: Person[] = [];

    for (const serverPerson of people || []) {
      const personData: Person = {
        id: serverPerson.id,
        tripId: serverPerson.trip_id,
        name: serverPerson.name,
        age: serverPerson.age || undefined,
        gender: (serverPerson.gender as Person['gender']) || undefined,
        settings: (serverPerson.settings as Person['settings']) || undefined,
        createdAt: serverPerson.created_at || new Date().toISOString(),
        updatedAt: serverPerson.updated_at || new Date().toISOString(),
        version: serverPerson.version || 1,
        isDeleted: serverPerson.is_deleted || false,
      };

      // Check for conflicts - skip for now since PersonStorage doesn't have getPerson method
      // TODO: Add individual person lookup method to PersonStorage
      console.log(
        `🔄 [SYNC] Processing person ${serverPerson.id} (conflict detection skipped)`
      );

      // Apply server data
      await PersonStorage.savePerson(personData);
      upsertedPeople.push(personData);

      // Dispatch upsert action
      dispatch({
        type: 'UPSERT_SYNCED_PERSON',
        payload: personData,
      });
    }

    return { people: upsertedPeople, conflicts };
  }
);

export const pullItemsFromServer = createAsyncThunk(
  'sync/pullItems',
  async (
    params: { tripIds: string[]; since?: string; userId: string },
    { dispatch }
  ) => {
    console.log(
      `🔄 [SYNC] Pulling items from server for ${params.tripIds.length} trips...`
    );

    if (!isSupabaseAvailable() || isLocalUser(params.userId)) {
      console.log('🔄 [SYNC] Skipping items pull - offline mode or local user');
      return { items: [], conflicts: [] };
    }

    if (params.tripIds.length === 0) {
      console.log('🔄 [SYNC] No trips to pull items for');
      return { items: [], conflicts: [] };
    }

    const since = params.since || new Date(0).toISOString();
    const { data: items, error } = await supabase
      .from('trip_items')
      .select('*')
      .in('trip_id', params.tripIds)
      .gt('updated_at', since)
      .order('updated_at', { ascending: true });

    if (error) {
      console.error('❌ [SYNC] Error pulling items:', error);
      throw new Error(`Failed to pull items: ${error.message}`);
    }

    console.log(`✅ [SYNC] Pulled ${items?.length || 0} items from server`);

    const conflicts: SyncConflict[] = [];
    const upsertedItems: TripItem[] = [];

    for (const serverItem of items || []) {
      const itemData: TripItem = {
        id: serverItem.id,
        tripId: serverItem.trip_id,
        name: serverItem.name,
        category: serverItem.category || undefined,
        quantity: serverItem.quantity || 1,
        notes: serverItem.notes || undefined,
        personId: serverItem.person_id || undefined,
        dayIndex: serverItem.day_index || undefined,
        ruleId: serverItem.rule_id || undefined,
        ruleHash: serverItem.rule_hash || undefined,
        packed: serverItem.packed || false,
        createdAt: serverItem.created_at || new Date().toISOString(),
        updatedAt: serverItem.updated_at || new Date().toISOString(),
        version: serverItem.version || 1,
        isDeleted: serverItem.is_deleted || false,
      };

      // Check for conflicts - skip for now since ItemStorage doesn't have getItem method
      // TODO: Add individual item lookup method to ItemStorage
      console.log(
        `🔄 [SYNC] Processing item ${serverItem.id} (conflict detection skipped)`
      );

      // Apply server data
      await ItemStorage.saveItem(itemData);
      upsertedItems.push(itemData);

      // Dispatch upsert action
      dispatch({
        type: 'UPSERT_SYNCED_ITEM',
        payload: itemData,
      });
    }

    return { items: upsertedItems, conflicts };
  }
);

export const pullDefaultItemRulesFromServer = createAsyncThunk(
  'sync/pullDefaultItemRules',
  async (
    params: { tripIds: string[]; since?: string; userId: string },
    { dispatch }
  ) => {
    console.log(
      `🔄 [SYNC] Pulling default item rules from server for ${params.tripIds.length} trips...`
    );

    if (!isSupabaseAvailable() || isLocalUser(params.userId)) {
      console.log('🔄 [SYNC] Skipping rules pull - offline mode or local user');
      return { rules: [], conflicts: [] };
    }

    if (params.tripIds.length === 0) {
      console.log('🔄 [SYNC] No trips to pull default item rules for');
      return { rules: [], conflicts: [] };
    }

    const since = params.since || new Date(0).toISOString();

    // Get rules that are associated with the trips via trip_default_item_rules
    const { data: tripRuleAssociations, error: tripRulesError } = await supabase
      .from('trip_default_item_rules')
      .select('rule_id')
      .in('trip_id', params.tripIds)
      .gt('updated_at', since);

    if (tripRulesError) {
      console.error(
        '❌ [SYNC] Error pulling trip rule associations:',
        tripRulesError
      );
      throw new Error(
        `Failed to pull trip rule associations: ${tripRulesError.message}`
      );
    }

    const ruleIds = [
      ...new Set(tripRuleAssociations?.map((tr) => tr.rule_id) || []),
    ];

    if (ruleIds.length === 0) {
      console.log('🔄 [SYNC] No rule associations found for trips');
      return { rules: [], conflicts: [] };
    }

    // Now get the actual rules
    const { data: rules, error } = await supabase
      .from('default_item_rules')
      .select('*')
      .in('id', ruleIds)
      .gt('updated_at', since)
      .order('updated_at', { ascending: true });

    if (error) {
      console.error('❌ [SYNC] Error pulling default item rules:', error);
      throw new Error(`Failed to pull default item rules: ${error.message}`);
    }

    console.log(
      `✅ [SYNC] Pulled ${rules?.length || 0} default item rules from server`
    );

    const conflicts: SyncConflict[] = [];
    const upsertedRules: DefaultItemRule[] = [];

    for (const serverRule of rules || []) {
      const ruleData: DefaultItemRule = {
        id: serverRule.id,
        originalRuleId: serverRule.original_rule_id || serverRule.id,
        name: serverRule.name,
        calculation:
          (serverRule.calculation as DefaultItemRule['calculation']) || {
            type: 'fixed',
            value: 1,
          },
        conditions:
          (serverRule.conditions as DefaultItemRule['conditions']) || undefined,
        notes: serverRule.notes || undefined,
        categoryId: serverRule.category_id || undefined,
        subcategoryId: serverRule.subcategory_id || undefined,
        packIds:
          (serverRule.pack_ids as DefaultItemRule['packIds']) || undefined,
      };

      // Check for conflicts using available method
      const localRule = await DefaultItemRulesStorage.getDefaultItemRule(
        serverRule.id
      );

      if (localRule && localRule.calculation !== ruleData.calculation) {
        // Conflict detected (simplified conflict detection)
        const conflict: SyncConflict = {
          id: `rule-${serverRule.id}-${Date.now()}`,
          entityType: 'default_item_rule',
          entityId: serverRule.id,
          localVersion: localRule,
          serverVersion: ruleData,
          conflictType: 'update_conflict',
          timestamp: Date.now(),
        };
        conflicts.push(conflict);
        console.log(
          `⚠️ [SYNC] Default item rule conflict detected: ${serverRule.id}`
        );
      } else {
        // No conflict, apply server data
        await DefaultItemRulesStorage.saveDefaultItemRule(ruleData);
        upsertedRules.push(ruleData);

        // Dispatch upsert action
        dispatch({
          type: 'UPSERT_SYNCED_DEFAULT_ITEM_RULE',
          payload: ruleData,
        });
      }
    }

    // Store conflicts
    if (conflicts.length > 0) {
      dispatch(setSyncConflicts(conflicts));
    }

    return { rules: upsertedRules, conflicts };
  }
);

export const pullTripRulesFromServer = createAsyncThunk(
  'sync/pullTripRules',
  async (
    params: { tripIds: string[]; since?: string; userId: string },
    { dispatch }
  ) => {
    console.log(
      `🔄 [SYNC] Pulling trip rules from server for ${params.tripIds.length} trips...`
    );

    if (!isSupabaseAvailable() || isLocalUser(params.userId)) {
      console.log(
        '🔄 [SYNC] Skipping trip rules pull - offline mode or local user'
      );
      return { tripRules: [], conflicts: [] };
    }

    if (params.tripIds.length === 0) {
      console.log('🔄 [SYNC] No trips to pull trip rules for');
      return { tripRules: [], conflicts: [] };
    }

    const since = params.since || new Date(0).toISOString();
    const { data: tripRules, error } = await supabase
      .from('trip_default_item_rules')
      .select('*')
      .in('trip_id', params.tripIds)
      .gt('updated_at', since)
      .order('updated_at', { ascending: true });

    if (error) {
      console.error('❌ [SYNC] Error pulling trip rules:', error);
      throw new Error(`Failed to pull trip rules: ${error.message}`);
    }

    console.log(
      `✅ [SYNC] Pulled ${tripRules?.length || 0} trip rules from server`
    );

    const conflicts: SyncConflict[] = [];
    const upsertedTripRules: TripRule[] = [];

    for (const serverTripRule of tripRules || []) {
      const tripRuleData: TripRule = {
        id: `${serverTripRule.trip_id}:${serverTripRule.rule_id}`,
        tripId: serverTripRule.trip_id,
        ruleId: serverTripRule.rule_id,
        createdAt: serverTripRule.created_at || new Date().toISOString(),
        updatedAt: serverTripRule.updated_at || new Date().toISOString(),
        version: serverTripRule.version || 1,
        isDeleted: serverTripRule.is_deleted || false,
      };

      // Check for conflicts using available method
      const existingRules = await TripRuleStorage.getTripRules(
        serverTripRule.trip_id
      );
      const localTripRule = existingRules.find(
        (r) => r.ruleId === serverTripRule.rule_id
      );

      if (localTripRule && localTripRule.updatedAt !== tripRuleData.updatedAt) {
        // Conflict detected
        const conflict: SyncConflict = {
          id: `trip-rule-${serverTripRule.trip_id}-${
            serverTripRule.rule_id
          }-${Date.now()}`,
          entityType: 'trip_rule',
          entityId: `${serverTripRule.trip_id}:${serverTripRule.rule_id}`,
          localVersion: localTripRule,
          serverVersion: tripRuleData,
          conflictType: 'update_conflict',
          timestamp: Date.now(),
        };
        conflicts.push(conflict);
        console.log(
          `⚠️ [SYNC] Trip rule conflict detected: ${serverTripRule.trip_id}:${serverTripRule.rule_id}`
        );
      } else {
        // No conflict, apply server data
        await TripRuleStorage.saveTripRule(tripRuleData);
        upsertedTripRules.push(tripRuleData);

        // Dispatch upsert action
        dispatch({
          type: 'UPSERT_SYNCED_TRIP_RULE',
          payload: tripRuleData,
        });
      }
    }

    // Store conflicts
    if (conflicts.length > 0) {
      dispatch(setSyncConflicts(conflicts));
    }

    return { tripRules: upsertedTripRules, conflicts };
  }
);

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

      // First pull trips to get the trip IDs
      const tripsResult = await dispatch(pullTripsFromServer(params));
      const trips = (tripsResult.payload as { trips: Trip[] })?.trips || [];
      const tripIds = trips.map((trip) => trip.id);

      // Then pull people and items for those specific trips, along with rules
      const [peopleResult, itemsResult, rulesResult, tripRulesResult] =
        await Promise.all([
          dispatch(pullPeopleFromServer({ ...params, tripIds })),
          dispatch(pullItemsFromServer({ ...params, tripIds })),
          dispatch(pullDefaultItemRulesFromServer({ ...params, tripIds })),
          dispatch(pullTripRulesFromServer({ ...params, tripIds })),
        ]);

      // Update last sync timestamp
      dispatch(updateLastSyncTimestamp(Date.now()));

      console.log('✅ [SYNC] Comprehensive sync completed successfully');

      return {
        trips,
        people: (peopleResult.payload as { people: Person[] })?.people || [],
        items: (itemsResult.payload as { items: TripItem[] })?.items || [],
        rules:
          (rulesResult.payload as { rules: DefaultItemRule[] })?.rules || [],
        tripRules:
          (tripRulesResult.payload as { tripRules: TripRule[] })?.tripRules ||
          [],
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

// Push operations (called from middleware)
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
    `🔄 [SYNC] Pushing change: ${change.operation} ${change.entityType}:${change.entityId}`
  );

  try {
    switch (change.entityType) {
      case 'trip':
        await pushTripChange(change);
        break;
      case 'person':
        await pushPersonChange(change);
        break;
      case 'item':
        await pushItemChange(change);
        break;
      case 'default_item_rule':
        await pushDefaultItemRuleChange(change);
        break;
      case 'trip_rule':
        await pushTripRuleChange(change);
        break;
      case 'rule_pack':
        // Rule packs are not synced to server - they're local only
        console.log(
          `🔄 [SYNC] Skipping rule pack sync (local only): ${change.entityId}`
        );
        break;
      default:
        console.warn(`🔄 [SYNC] Unknown entity type: ${change.entityType}`);
    }

    console.log(
      `✅ [SYNC] Successfully pushed change: ${change.entityType}:${change.entityId}`
    );
  } catch (error) {
    console.error(
      `❌ [SYNC] Failed to push change: ${change.entityType}:${change.entityId}`,
      error
    );
    throw error;
  }
};

// Individual push functions
async function pushTripChange(change: Change): Promise<void> {
  const tripData = change.data as Trip;

  if (change.operation === 'delete') {
    await supabase
      .from('trips')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', change.entityId);
  } else {
    await supabase.from('trips').upsert({
      id: tripData.id,
      user_id: tripData.userId,
      title: tripData.title,
      description: tripData.description,
      days: tripData.days as Json,
      trip_events: tripData.tripEvents as Json,
      settings: tripData.settings as Json,
      version: tripData.version,
      is_deleted: tripData.isDeleted || false,
      created_at: tripData.createdAt,
      updated_at: tripData.updatedAt,
    });
  }
}

async function pushPersonChange(change: Change): Promise<void> {
  const personData = change.data as Person;

  if (change.operation === 'delete') {
    const { error } = await supabase
      .from('trip_people')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', change.entityId);

    if (error) {
      console.error('❌ [SYNC] Error deleting person:', error);
      throw new Error(`Failed to delete person: ${error.message}`);
    }
  } else {
    const { error } = await supabase.from('trip_people').upsert({
      id: personData.id,
      trip_id: personData.tripId,
      name: personData.name,
      age: personData.age,
      gender: personData.gender,
      settings: personData.settings as Json,
      version: personData.version,
      is_deleted: personData.isDeleted || false,
      created_at: personData.createdAt,
      updated_at: personData.updatedAt,
    });

    if (error) {
      console.error('❌ [SYNC] Error upserting person:', error);
      console.error('❌ [SYNC] Person data:', personData);

      // Check if this is an RLS policy violation
      if (
        error.message.includes('policy') ||
        error.message.includes('permission')
      ) {
        // Try to verify trip ownership
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('user_id')
          .eq('id', personData.tripId)
          .single();

        console.error('❌ [SYNC] Trip ownership check:', {
          tripData,
          tripError,
          tripOwner: tripData?.user_id,
        });
      }

      throw new Error(`Failed to upsert person: ${error.message}`);
    }
  }

  console.log('✅ [SYNC] Person change pushed successfully:', personData.id);
}

async function pushItemChange(change: Change): Promise<void> {
  const itemData = change.data as TripItem;

  if (change.operation === 'delete') {
    const { error } = await supabase
      .from('trip_items')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', change.entityId);

    if (error) {
      console.error('❌ [SYNC] Error deleting item:', error);
      throw new Error(`Failed to delete item: ${error.message}`);
    }
  } else {
    // Handle packing status changes (minimal data) vs full item updates
    const isPackingStatusChange = '_packingStatusOnly' in itemData;

    if (isPackingStatusChange) {
      // For packing status changes, only update the packed field
      const { error } = await supabase
        .from('trip_items')
        .update({
          packed: itemData.packed,
          updated_at: itemData.updatedAt || new Date().toISOString(),
        })
        .eq('id', change.entityId);

      if (error) {
        console.error('❌ [SYNC] Error updating item packing status:', error);
        console.error('❌ [SYNC] Item data:', itemData);
        console.error('❌ [SYNC] Change tripId:', change.tripId);

        // Check if this is an RLS policy violation
        if (
          (error.message.includes('policy') ||
            error.message.includes('permission')) &&
          change.tripId
        ) {
          // Try to verify trip ownership using change.tripId
          const { data: tripData, error: tripError } = await supabase
            .from('trips')
            .select('user_id')
            .eq('id', change.tripId)
            .single();

          console.error('❌ [SYNC] Trip ownership check:', {
            tripData,
            tripError,
            tripOwner: tripData?.user_id,
          });
        }

        throw new Error(
          `Failed to update item packing status: ${error.message}`
        );
      }
    } else {
      // Full item upsert - ensure we have a tripId
      const tripId = itemData.tripId || change.tripId;
      if (!tripId) {
        throw new Error('No tripId available for item upsert');
      }

      const { error } = await supabase.from('trip_items').upsert({
        id: itemData.id,
        trip_id: tripId,
        name: itemData.name,
        category: itemData.category,
        quantity: itemData.quantity,
        notes: itemData.notes,
        person_id: itemData.personId,
        day_index: itemData.dayIndex,
        rule_id: itemData.ruleId,
        rule_hash: itemData.ruleHash,
        packed: itemData.packed,
        version: itemData.version,
        is_deleted: itemData.isDeleted || false,
        created_at: itemData.createdAt,
        updated_at: itemData.updatedAt,
      });

      if (error) {
        console.error('❌ [SYNC] Error upserting item:', error);
        console.error('❌ [SYNC] Item data:', itemData);

        // Check if this is an RLS policy violation
        if (
          error.message.includes('policy') ||
          error.message.includes('permission')
        ) {
          // Try to verify trip ownership
          const { data: tripData, error: tripError } = await supabase
            .from('trips')
            .select('user_id')
            .eq('id', tripId)
            .single();

          console.error('❌ [SYNC] Trip ownership check:', {
            tripData,
            tripError,
            tripOwner: tripData?.user_id,
          });
        }

        throw new Error(`Failed to upsert item: ${error.message}`);
      }
    }
  }

  console.log('✅ [SYNC] Item change pushed successfully:', change.entityId);
}

async function pushDefaultItemRuleChange(change: Change): Promise<void> {
  const ruleData = change.data as DefaultItemRule;

  if (change.operation === 'delete') {
    await supabase
      .from('default_item_rules')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', change.entityId);
  } else {
    await supabase.from('default_item_rules').upsert({
      rule_id: ruleData.id,
      original_rule_id: ruleData.originalRuleId,
      name: ruleData.name,
      calculation: ruleData.calculation as Json,
      conditions: ruleData.conditions as Json,
      notes: ruleData.notes,
      category_id: ruleData.categoryId,
      subcategory_id: ruleData.subcategoryId,
      pack_ids: ruleData.packIds as Json,
      user_id: change.userId,
      version: 1,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}

async function pushTripRuleChange(change: Change): Promise<void> {
  const tripRuleData = change.data as TripRule;

  if (change.operation === 'delete') {
    await supabase
      .from('trip_default_item_rules')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('trip_id', tripRuleData.tripId)
      .eq('rule_id', tripRuleData.ruleId);
  } else {
    await supabase.from('trip_default_item_rules').upsert({
      trip_id: tripRuleData.tripId,
      rule_id: tripRuleData.ruleId,
      user_id: change.userId,
      version: tripRuleData.version,
      is_deleted: tripRuleData.isDeleted || false,
      created_at: tripRuleData.createdAt,
      updated_at: tripRuleData.updatedAt,
    });
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

// Change tracking action
export const trackSyncChange = (
  payload: Omit<Change, 'id' | 'timestamp' | 'synced'>
): SyncActions => ({
  type: 'TRACK_SYNC_CHANGE',
  payload,
});

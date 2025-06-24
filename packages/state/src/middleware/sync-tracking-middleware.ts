import type { Middleware } from '@reduxjs/toolkit';
import { UnknownAction } from '@reduxjs/toolkit';
import { uuid, deepEqual } from '@packing-list/shared-utils';
import type { Trip, Person, Change } from '@packing-list/model';
import { StoreType } from '../store.js';
import {
  syncFromServer,
  pushChangeToServer,
  setSyncOnlineStatus,
} from '../lib/sync/actions.js';
import {
  TripStorage,
  PersonStorage,
  ItemStorage,
  DefaultItemRulesStorage,
  RulePacksStorage,
  TripRuleStorage,
  getDatabase,
} from '@packing-list/offline-storage';
import type { AllActions } from '../actions.js';
import { isLocalUser } from '../lib/sync/utils.js';
import { processSyncedEntities } from '../lib/sync/sync-integration.js';

/**
 * Track ongoing sync operations to prevent duplicate sync calls
 */
let isSyncInProgress = false;
let pendingSyncUserId: string | null = null;

/**
 * Reload trip data from IndexedDB and populate Redux state
 */
async function reloadFromIndexedDB(
  dispatch: (action: AllActions) => void,
  userId: string
): Promise<void> {
  console.log(
    `🔄 [SYNC_MIDDLEWARE] Starting IndexedDB reload for user: ${userId}`
  );

  try {
    const { loadOfflineState } = await import('../offline-hydration.js');
    const offlineState = await loadOfflineState(userId);

    console.log(
      `✅ [SYNC_MIDDLEWARE] Successfully loaded offline state for ${
        Object.keys(offlineState.trips.byId).length
      } trips`
    );

    dispatch({
      type: 'HYDRATE_OFFLINE',
      payload: offlineState,
    });

    console.log(
      `🔄 [SYNC_MIDDLEWARE] Successfully hydrated Redux state from IndexedDB`
    );
  } catch (error) {
    console.error(
      '❌ [SYNC_MIDDLEWARE] Failed to reload from IndexedDB:',
      error
    );
  }
}

/**
 * Start sync service and perform initial sync with debouncing
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function startSyncService(dispatch: any, userId: string): Promise<void> {
  if (isLocalUser(userId)) {
    console.log('🔄 [SYNC_MIDDLEWARE] Skipping sync for local user');
    return;
  }

  // Check if sync is already in progress
  if (isSyncInProgress) {
    console.log(
      `🔄 [SYNC_MIDDLEWARE] Sync already in progress for user ${pendingSyncUserId}, skipping duplicate sync for ${userId}`
    );
    return;
  }

  // Check if this is the same user as a pending sync
  if (pendingSyncUserId === userId) {
    console.log(
      `🔄 [SYNC_MIDDLEWARE] Sync already pending for user ${userId}, skipping duplicate`
    );
    return;
  }

  try {
    console.log('🔄 [SYNC_MIDDLEWARE] Starting sync service...');

    // Mark sync as in progress
    isSyncInProgress = true;
    pendingSyncUserId = userId;

    // Set online status
    dispatch(setSyncOnlineStatus(true));

    // Get last sync timestamp
    const db = await getDatabase();
    const lastSyncTimestamp = await db.get('syncMetadata', 'lastSyncTimestamp');
    const since = lastSyncTimestamp
      ? new Date(lastSyncTimestamp).toISOString()
      : undefined;

    try {
      // Perform comprehensive sync
      await dispatch(syncFromServer({ userId, since }));
    } catch {
      console.error('❌ [SYNC_MIDDLEWARE] Failed to perform sync');
    }

    console.log('✅ [SYNC_MIDDLEWARE] Sync service started successfully');
  } catch (error) {
    console.error('❌ [SYNC_MIDDLEWARE] Failed to start sync service:', error);
  } finally {
    // Reset sync tracking
    isSyncInProgress = false;
    pendingSyncUserId = null;
  }
}

/**
 * Track and push a change to the server
 */
async function trackAndPushChange(
  change: Omit<Change, 'id' | 'timestamp' | 'synced'>,
  userId: string
): Promise<void> {
  const changeId = uuid();
  const changeWithId: Change = {
    ...change,
    id: changeId,
    timestamp: Date.now(),
    synced: false,
  } as Change;

  console.log(
    `🔄 [SYNC_MIDDLEWARE] Tracking change: ${change.operation} ${change.entityType}:${change.entityId} for user: ${userId}`
  );

  try {
    // Store change in IndexedDB for persistence - ALL users need this for offline functionality
    const db = await getDatabase();
    try {
      await db.add('syncChanges', changeWithId);
      console.log(
        `💾 [SYNC_MIDDLEWARE] Stored change in IndexedDB: ${change.entityType}:${change.entityId}`
      );
    } catch {
      console.warn('🔄 [SYNC_MIDDLEWARE] Changes table not available yet');
    }

    // Only push to server for non-local users
    if (isLocalUser(userId)) {
      console.log(
        `🔄 [SYNC_MIDDLEWARE] Skipping server push for local user: ${userId}`
      );
      // Mark as synced since local users don't need server sync
      try {
        await db.put('syncChanges', { ...changeWithId, synced: true });
      } catch (e) {
        console.warn('🔄 [SYNC_MIDDLEWARE] Could not mark change as synced', e);
      }
      return;
    }

    // Push to server for remote users
    await pushChangeToServer(changeWithId);

    // Mark as synced
    try {
      await db.put('syncChanges', { ...changeWithId, synced: true });
    } catch (e) {
      console.warn('🔄 [SYNC_MIDDLEWARE] Could not mark change as synced', e);
    }

    console.log(
      `✅ [SYNC_MIDDLEWARE] Successfully pushed change: ${change.entityType}:${change.entityId}`
    );
  } catch (error) {
    console.error(
      `❌ [SYNC_MIDDLEWARE] Failed to handle change: ${change.entityType}:${change.entityId}`,
      error
    );
    // Change remains unsynced in IndexedDB for retry later (remote users only)
  }
}

/**
 * Redux middleware that automatically tracks sync changes and handles sync operations.
 */
export const syncTrackingMiddleware: Middleware<object, StoreType> =
  (store) => (next) => (action) => {
    const prevState = store.getState();
    const result = next(action);
    const nextState = store.getState();

    // Handle auth changes and sign-in to reload from IndexedDB and start sync
    const userChanged = prevState.auth.user?.id !== nextState.auth.user?.id;
    const userId = nextState.auth.user?.id;

    if (userChanged && userId) {
      console.log(
        `🔄 [SYNC_MIDDLEWARE] Detected auth change (${
          (action as UnknownAction).type
        }), scheduling IndexedDB reload and sync service start`
      );

      // Add a small delay to let auth state settle and prevent rapid-fire sync calls
      setTimeout(() => {
        // Load from IndexedDB first - ALL users need this for offline persistence
        reloadFromIndexedDB(
          store.dispatch as (action: AllActions) => void,
          userId
        )
          .then(async () => {
            // Only start sync service for non-local users
            if (!isLocalUser(userId)) {
              await startSyncService(store.dispatch, userId);
            } else {
              console.log(
                `🔄 [SYNC_MIDDLEWARE] Skipping sync service for local user: ${userId}`
              );
            }
          })
          .catch((error) => {
            console.error(
              '❌ [SYNC_MIDDLEWARE] IndexedDB reload failed:',
              error
            );
          });
      }, 100); // 100ms delay to let auth state settle
      return result;
    }

    // Handle sync completion to process pending items
    if ((action as UnknownAction).type === 'sync/syncFromServer/fulfilled') {
      console.log(
        '🔄 [SYNC_MIDDLEWARE] Sync completed, processing pending items'
      );
      try {
        processSyncedEntities(store.dispatch as (action: AllActions) => void);
      } catch (error) {
        console.error(
          '❌ [SYNC_MIDDLEWARE] Failed to process pending items:',
          error
        );
      } finally {
        // Reset sync tracking on completion (success or failure)
        isSyncInProgress = false;
        pendingSyncUserId = null;
        console.log(
          '🔄 [SYNC_MIDDLEWARE] Sync tracking reset - ready for next sync'
        );
      }
      return result;
    }

    // Handle sync failure to reset tracking
    if ((action as UnknownAction).type === 'sync/syncFromServer/rejected') {
      console.log('❌ [SYNC_MIDDLEWARE] Sync failed, resetting sync tracking');
      isSyncInProgress = false;
      pendingSyncUserId = null;
      return result;
    }

    // Skip tracking for certain actions
    const skipActions = [
      'UPSERT',
      'SELECT_TRIP',
      'HYDRATE_OFFLINE',
      'sync/',
      'PROCESS_SYNCED_TRIP_ITEMS',
    ];

    // Special handling for conflict resolution - allow it to pass through to IndexedDB
    if ((action as UnknownAction).type === 'sync/resolveConflict/fulfilled') {
      console.log(
        '🔄 [SYNC_MIDDLEWARE] Allowing conflict resolution to complete'
      );
    } else if (
      skipActions.some((skip) => (action as UnknownAction).type.includes(skip))
    ) {
      return result;
    }

    // Check if we should track changes
    const tripId = nextState.trips.selectedTripId;

    if (!userId) {
      return result;
    }

    if (!tripId || userId === 'local-user') {
      return result;
    }

    try {
      // Handle optimized packing status changes
      if ((action as { type: string }).type === 'TOGGLE_ITEM_PACKED') {
        handlePackingStatusChange(
          prevState,
          nextState,
          tripId,
          userId,
          action as { type: string; payload: { itemId: string } }
        );
      } else {
        // Track all other changes using deep diffs - with action context
        trackAllChanges(
          prevState,
          nextState,
          tripId,
          userId,
          action as { type: string }
        );
      }
    } catch (error) {
      console.error('🚨 [SYNC_MIDDLEWARE] Error tracking changes:', error);
    }

    return result;
  };

/**
 * Handle optimized packing status changes
 */
function handlePackingStatusChange(
  prevState: StoreType,
  nextState: StoreType,
  tripId: string,
  userId: string,
  action: { type: string; payload: { itemId: string } }
): void {
  const { itemId } = action.payload;

  const prevItems =
    prevState.trips.byId[tripId]?.calculated.packingListItems || [];
  const nextItems =
    nextState.trips.byId[tripId]?.calculated.packingListItems || [];

  const prevItem = prevItems.find((item) => item.id === itemId);
  const nextItem = nextItems.find((item) => item.id === itemId);

  if (!prevItem || !nextItem) {
    console.warn(
      `🚨 [SYNC_MIDDLEWARE] Could not find item ${itemId} for packing status change`
    );
    return;
  }

  if (prevItem.isPacked !== nextItem.isPacked) {
    console.log(
      `🔄 [SYNC_MIDDLEWARE] Packing status changed for item ${itemId}: ${prevItem.isPacked} -> ${nextItem.isPacked}`
    );

    // Update item in storage with new packing status
    updateItemInStorage(itemId, tripId, nextItem, nextItem.isPacked);

    // Track the packing status change with full item data
    const change: Omit<Change, 'id' | 'timestamp' | 'synced'> = {
      entityType: 'item',
      entityId: itemId,
      operation: 'update',
      userId,
      tripId,
      version: 1,
      data: {
        id: itemId,
        tripId,
        name: nextItem.name,
        category: nextItem.categoryId, // Map categoryId to category for TripItem
        quantity: nextItem.quantity,
        notes: nextItem.notes,
        personId: nextItem.personId,
        dayIndex: nextItem.dayIndex,
        ruleId: nextItem.ruleId,
        ruleHash: nextItem.ruleHash,
        packed: nextItem.isPacked,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        isDeleted: false,
        _packingStatusOnly: true,
        _previousStatus: prevItem.isPacked,
      },
    };

    trackAndPushChange(change, userId);
  }
}

/**
 * Update item in IndexedDB storage with optimized packing status
 */
function updateItemInStorage(
  itemId: string,
  tripId: string,
  nextItem: {
    name: string;
    categoryId?: string;
    quantity: number;
    notes?: string;
    personId?: string | null;
    dayIndex?: number;
    ruleId?: string;
    ruleHash?: string;
  },
  newStatus: boolean
): void {
  ItemStorage.saveItem({
    id: itemId,
    tripId,
    name: nextItem.name,
    category: nextItem.categoryId, // Map categoryId to category for TripItem
    quantity: nextItem.quantity,
    notes: nextItem.notes,
    personId: nextItem.personId,
    dayIndex: nextItem.dayIndex,
    ruleId: nextItem.ruleId,
    ruleHash: nextItem.ruleHash,
    packed: newStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    isDeleted: false,
  }).catch((error) => {
    console.error(
      `🚨 [SYNC_MIDDLEWARE] Failed to update item ${itemId} in storage:`,
      error
    );
  });
}

/**
 * Track all changes using deep diffs
 */
function trackAllChanges(
  prevState: StoreType,
  nextState: StoreType,
  tripId: string,
  userId: string,
  action?: { type: string }
): void {
  // Track changes in different entity types
  trackTripChanges(prevState, nextState, tripId, userId);
  trackPersonChanges(prevState, nextState, tripId, userId);
  trackRuleChanges(prevState, nextState, tripId, userId);

  // Only track trip rule changes for actual rule operations to prevent false deletions
  // Skip trip rule tracking for recalculation and sync operations
  const tripRuleActions = [
    'TOGGLE_RULE_PACK',
    'CREATE_DEFAULT_ITEM_RULE',
    'UPDATE_DEFAULT_ITEM_RULE',
    'DELETE_DEFAULT_ITEM_RULE',
    'APPLY_RULE_PACK',
    'REMOVE_RULE_PACK',
  ];
  if (action && tripRuleActions.includes(action.type)) {
    trackTripRuleChanges(prevState, nextState, tripId, userId);
  }

  // Only track rule pack changes for actual rule pack operations
  // Skip rule pack tracking for TOGGLE_RULE_PACK to prevent false deletions
  const rulePackActions = [
    'CREATE_RULE_PACK',
    'UPDATE_RULE_PACK',
    'DELETE_RULE_PACK',
  ];
  if (action && rulePackActions.includes(action.type)) {
    trackRulePackChanges(prevState, nextState, tripId, userId);
  }
}

/**
 * Track changes to trip data
 */
function trackTripChanges(
  prevState: StoreType,
  nextState: StoreType,
  tripId: string,
  userId: string
): void {
  const prevTrip = prevState.trips.byId[tripId];
  const nextTrip = nextState.trips.byId[tripId];

  if (!prevTrip && nextTrip) {
    // Trip created
    console.log(`🔄 [SYNC_MIDDLEWARE] Trip created: ${tripId}`);

    const tripData: Trip = {
      id: tripId,
      userId,
      title: nextTrip.trip.title,
      description: nextTrip.trip.description,
      days: nextTrip.trip.days,
      tripEvents: nextTrip.trip.tripEvents,
      settings: nextTrip.trip.settings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      isDeleted: false,
      defaultItemRules: [],
    };

    // Save to storage
    TripStorage.saveTrip(tripData).catch((error) => {
      console.error(
        `🚨 [SYNC_MIDDLEWARE] Failed to save trip ${tripId}:`,
        error
      );
    });

    // Track change
    const change: Omit<Change, 'id' | 'timestamp' | 'synced'> = {
      entityType: 'trip',
      entityId: tripId,
      operation: 'create',
      userId,
      version: 1,
      data: tripData,
    };

    trackAndPushChange(change, userId);
  } else if (prevTrip && nextTrip && !deepEqual(prevTrip.trip, nextTrip.trip)) {
    // Trip updated
    console.log(`🔄 [SYNC_MIDDLEWARE] Trip updated: ${tripId}`);

    const tripData: Trip = {
      id: tripId,
      userId,
      title: nextTrip.trip.title,
      description: nextTrip.trip.description,
      days: nextTrip.trip.days,
      tripEvents: nextTrip.trip.tripEvents,
      settings: nextTrip.trip.settings,
      createdAt: prevTrip.trip.createdAt,
      updatedAt: new Date().toISOString(),
      version: (prevTrip.trip.version || 1) + 1,
      isDeleted: false,
      defaultItemRules: [],
    };

    // Save to storage
    TripStorage.saveTrip(tripData).catch((error) => {
      console.error(
        `🚨 [SYNC_MIDDLEWARE] Failed to save trip ${tripId}:`,
        error
      );
    });

    // Track change
    const change: Omit<Change, 'id' | 'timestamp' | 'synced'> = {
      entityType: 'trip',
      entityId: tripId,
      operation: 'update',
      userId,
      version: tripData.version,
      data: tripData,
    };

    trackAndPushChange(change, userId);
  }
}

/**
 * Track changes to people
 */
function trackPersonChanges(
  prevState: StoreType,
  nextState: StoreType,
  tripId: string,
  userId: string
): void {
  const prevPeople = prevState.trips.byId[tripId]?.people || [];
  const nextPeople = nextState.trips.byId[tripId]?.people || [];

  // Check for new people
  for (const nextPerson of nextPeople) {
    const prevPerson = prevPeople.find((p) => p.id === nextPerson.id);

    if (!prevPerson) {
      // Person created
      console.log(`🔄 [SYNC_MIDDLEWARE] Person created: ${nextPerson.id}`);

      const personData: Person = {
        ...nextPerson,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        isDeleted: false,
      };

      // Save to storage
      PersonStorage.savePerson(personData).catch((error) => {
        console.error(
          `🚨 [SYNC_MIDDLEWARE] Failed to save person ${nextPerson.id}:`,
          error
        );
      });

      // Track change
      const change: Omit<Change, 'id' | 'timestamp' | 'synced'> = {
        entityType: 'person',
        entityId: nextPerson.id,
        operation: 'create',
        userId,
        tripId,
        version: 1,
        data: personData,
      };

      trackAndPushChange(change, userId);
    } else if (!deepEqual(prevPerson, nextPerson)) {
      // Person updated
      console.log(`🔄 [SYNC_MIDDLEWARE] Person updated: ${nextPerson.id}`);

      const personData: Person = {
        ...nextPerson,
        updatedAt: new Date().toISOString(),
        version: (prevPerson.version || 1) + 1,
      };

      // Save to storage
      PersonStorage.savePerson(personData).catch((error) => {
        console.error(
          `🚨 [SYNC_MIDDLEWARE] Failed to save person ${nextPerson.id}:`,
          error
        );
      });

      // Track change
      const change: Omit<Change, 'id' | 'timestamp' | 'synced'> = {
        entityType: 'person',
        entityId: nextPerson.id,
        operation: 'update',
        userId,
        tripId,
        version: personData.version,
        data: personData,
      };

      trackAndPushChange(change, userId);
    }
  }

  // Check for deleted people
  for (const prevPerson of prevPeople) {
    const nextPerson = nextPeople.find((p) => p.id === prevPerson.id);

    if (!nextPerson) {
      // Person deleted
      console.log(`🔄 [SYNC_MIDDLEWARE] Person deleted: ${prevPerson.id}`);

      // Mark as deleted in storage
      PersonStorage.deletePerson(prevPerson.id).catch((error) => {
        console.error(
          `🚨 [SYNC_MIDDLEWARE] Failed to delete person ${prevPerson.id}:`,
          error
        );
      });

      // Track change
      const change: Omit<Change, 'id' | 'timestamp' | 'synced'> = {
        entityType: 'person',
        entityId: prevPerson.id,
        operation: 'delete',
        userId,
        tripId,
        version: (prevPerson.version || 1) + 1,
        data: {
          ...prevPerson,
          isDeleted: true,
          updatedAt: new Date().toISOString(),
        },
      };

      trackAndPushChange(change, userId);
    }
  }
}

/**
 * Track changes to rules
 */
function trackRuleChanges(
  prevState: StoreType,
  nextState: StoreType,
  tripId: string,
  userId: string
): void {
  // Track default item rules - these are stored at the trip level
  const prevRules = prevState.trips.byId[tripId]?.trip?.defaultItemRules || [];
  const nextRules = nextState.trips.byId[tripId]?.trip?.defaultItemRules || [];

  // Check for new or updated rules
  for (const nextRule of nextRules) {
    const prevRule = prevRules.find(
      (r: { id: string }) => r.id === nextRule.id
    );

    if (!prevRule) {
      // Rule created
      console.log(
        `🔄 [SYNC_MIDDLEWARE] Default item rule created: ${nextRule.id}`
      );

      // Save to storage
      DefaultItemRulesStorage.saveDefaultItemRule(nextRule).catch((error) => {
        console.error(
          `🚨 [SYNC_MIDDLEWARE] Failed to save rule ${nextRule.id}:`,
          error
        );
      });

      // Track change
      const change: Omit<Change, 'id' | 'timestamp' | 'synced'> = {
        entityType: 'default_item_rule',
        entityId: nextRule.id,
        operation: 'create',
        userId,
        tripId,
        version: 1,
        data: nextRule,
      };

      trackAndPushChange(change, userId);
    } else if (!deepEqual(prevRule, nextRule)) {
      // Rule updated
      console.log(
        `🔄 [SYNC_MIDDLEWARE] Default item rule updated: ${nextRule.id}`
      );

      // Save to storage
      DefaultItemRulesStorage.saveDefaultItemRule(nextRule).catch((error) => {
        console.error(
          `🚨 [SYNC_MIDDLEWARE] Failed to save rule ${nextRule.id}:`,
          error
        );
      });

      // Track change
      const change: Omit<Change, 'id' | 'timestamp' | 'synced'> = {
        entityType: 'default_item_rule',
        entityId: nextRule.id,
        operation: 'update',
        userId,
        tripId,
        version: 1,
        data: nextRule,
      };

      trackAndPushChange(change, userId);
    }
  }

  // Check for deleted rules
  for (const prevRule of prevRules) {
    const nextRule = nextRules.find(
      (r: { id: string }) => r.id === prevRule.id
    );

    if (!nextRule) {
      // Rule deleted
      console.log(
        `🔄 [SYNC_MIDDLEWARE] Default item rule deleted: ${prevRule.id}`
      );

      // Mark as deleted in storage
      DefaultItemRulesStorage.deleteDefaultItemRule(prevRule.id).catch(
        (error) => {
          console.error(
            `🚨 [SYNC_MIDDLEWARE] Failed to delete rule ${prevRule.id}:`,
            error
          );
        }
      );

      // Track change
      const change: Omit<Change, 'id' | 'timestamp' | 'synced'> = {
        entityType: 'default_item_rule',
        entityId: prevRule.id,
        operation: 'delete',
        userId,
        tripId,
        version: 1,
        data: { ...prevRule, isDeleted: true },
      };

      trackAndPushChange(change, userId);
    }
  }
}

/**
 * Track changes to trip rules (trip-rule associations)
 */
function trackTripRuleChanges(
  prevState: StoreType,
  nextState: StoreType,
  tripId: string,
  userId: string
): void {
  const prevRules = prevState.trips.byId[tripId]?.trip?.defaultItemRules || [];
  const nextRules = nextState.trips.byId[tripId]?.trip?.defaultItemRules || [];

  // Check for new rules (need to create trip-rule associations)
  for (const nextRule of nextRules) {
    const prevRule = prevRules.find((r) => r.id === nextRule.id);

    if (!prevRule) {
      // New rule added to trip - create trip-rule association
      console.log(
        `🔄 [SYNC_MIDDLEWARE] Trip rule association created: trip ${tripId} -> rule ${nextRule.id}`
      );

      const now = new Date().toISOString();
      const tripRuleData = {
        id: `${tripId}-${nextRule.id}`,
        tripId,
        ruleId: nextRule.id,
        createdAt: now,
        updatedAt: now,
        version: 1,
        isDeleted: false,
      };

      // Save to storage
      TripRuleStorage.saveTripRule(tripRuleData).catch((error) => {
        console.error(
          `🚨 [SYNC_MIDDLEWARE] Failed to save trip rule ${tripId}-${nextRule.id}:`,
          error
        );
      });

      // Track change
      const change: Omit<Change, 'id' | 'timestamp' | 'synced'> = {
        entityType: 'trip_rule',
        entityId: `${tripId}-${nextRule.id}`,
        operation: 'create',
        userId,
        tripId,
        version: 1,
        data: tripRuleData,
      };

      trackAndPushChange(change, userId);
    }
  }

  // Check for deleted rules (need to remove trip-rule associations)
  // Only process deletions if we have a meaningful comparison (both arrays have content or intentional empty state)
  if (prevRules.length > 0 && nextRules.length >= 0) {
    for (const prevRule of prevRules) {
      const nextRule = nextRules.find((r) => r.id === prevRule.id);

      if (!nextRule) {
        // Rule removed from trip - delete trip-rule association
        console.log(
          `🔄 [SYNC_MIDDLEWARE] Trip rule association deleted: trip ${tripId} -> rule ${prevRule.id}`
        );

        // Mark as deleted in storage
        TripRuleStorage.deleteTripRule(tripId, prevRule.id).catch((error) => {
          console.error(
            `🚨 [SYNC_MIDDLEWARE] Failed to delete trip rule ${tripId}-${prevRule.id}:`,
            error
          );
        });

        // Track change
        const change: Omit<Change, 'id' | 'timestamp' | 'synced'> = {
          entityType: 'trip_rule',
          entityId: `${tripId}-${prevRule.id}`,
          operation: 'delete',
          userId,
          tripId,
          version: 1,
          data: {
            id: `${tripId}-${prevRule.id}`,
            tripId,
            ruleId: prevRule.id,
            isDeleted: true,
            updatedAt: new Date().toISOString(),
          },
        };

        trackAndPushChange(change, userId);
      }
    }
  } else if (prevRules.length > 0 && nextRules.length === 0) {
    // If we went from having rules to no rules, this might be a state reset
    // Log this but don't automatically delete - require explicit action
    console.warn(
      `⚠️ [SYNC_MIDDLEWARE] Trip rules went from ${prevRules.length} to 0 - possible state reset, not tracking deletions`
    );
  }
}

/**
 * Track changes to rule packs
 */
function trackRulePackChanges(
  prevState: StoreType,
  nextState: StoreType,
  tripId: string,
  userId: string
): void {
  const prevPacks = prevState.rulePacks || [];
  const nextPacks = nextState.rulePacks || [];

  console.log(
    `🔄 [SYNC_MIDDLEWARE] Tracking rule pack changes: ${prevPacks.length} -> ${nextPacks.length}`
  );

  // Check for new or updated packs
  for (const nextPack of nextPacks) {
    const prevPack = prevPacks.find((p) => p.id === nextPack.id);

    if (!prevPack) {
      // Pack created
      console.log(`🔄 [SYNC_MIDDLEWARE] Rule pack created: ${nextPack.id}`);

      // Save to storage
      RulePacksStorage.saveRulePack(nextPack).catch((error) => {
        console.error(
          `🚨 [SYNC_MIDDLEWARE] Failed to save rule pack ${nextPack.id}:`,
          error
        );
      });

      // Track change
      const change: Omit<Change, 'id' | 'timestamp' | 'synced'> = {
        entityType: 'rule_pack',
        entityId: nextPack.id,
        operation: 'create',
        userId,
        version: 1,
        data: nextPack,
      };

      trackAndPushChange(change, userId);
    } else if (!deepEqual(prevPack, nextPack)) {
      // Pack updated
      console.log(`🔄 [SYNC_MIDDLEWARE] Rule pack updated: ${nextPack.id}`);

      // Save to storage
      RulePacksStorage.saveRulePack(nextPack).catch((error) => {
        console.error(
          `🚨 [SYNC_MIDDLEWARE] Failed to save rule pack ${nextPack.id}:`,
          error
        );
      });

      // Track change
      const change: Omit<Change, 'id' | 'timestamp' | 'synced'> = {
        entityType: 'rule_pack',
        entityId: nextPack.id,
        operation: 'update',
        userId,
        version: 1,
        data: nextPack,
      };

      trackAndPushChange(change, userId);
    }
  }

  // Check for deleted packs - be more careful here
  for (const prevPack of prevPacks) {
    const nextPack = nextPacks.find((p) => p.id === prevPack.id);

    if (!nextPack) {
      // Pack deleted - add additional safety checks
      console.log(
        `🔄 [SYNC_MIDDLEWARE] Rule pack potentially deleted: ${prevPack.id}`
      );

      // Double-check that this is a real deletion and not a false positive
      // by verifying the pack is actually supposed to be deleted
      if (prevPack && !prevPack.metadata?.isBuiltIn) {
        console.log(
          `🔄 [SYNC_MIDDLEWARE] Confirming rule pack deletion: ${prevPack.id}`
        );

        // Mark as deleted in storage
        RulePacksStorage.deleteRulePack(prevPack.id).catch((error) => {
          console.error(
            `🚨 [SYNC_MIDDLEWARE] Failed to delete rule pack ${prevPack.id}:`,
            error
          );
        });

        // Track change
        const change: Omit<Change, 'id' | 'timestamp' | 'synced'> = {
          entityType: 'rule_pack',
          entityId: prevPack.id,
          operation: 'delete',
          userId,
          version: 1,
          data: { ...prevPack, isDeleted: true },
        };

        trackAndPushChange(change, userId);
      } else {
        console.log(
          `🔄 [SYNC_MIDDLEWARE] Skipping deletion of built-in rule pack: ${prevPack.id}`
        );
      }
    }
  }
}

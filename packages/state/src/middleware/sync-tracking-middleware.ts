import { Middleware, UnknownAction } from '@reduxjs/toolkit';
import { getChangeTracker, ChangeTracker } from '@packing-list/sync';
import type { StoreType } from '../store.js';
import type {
  Trip,
  Person,
  TripItem,
  DefaultItemRule,
  RulePack,
  TripRule,
} from '@packing-list/model';
import {
  TripStorage,
  PersonStorage,
  ItemStorage,
  DefaultItemRulesStorage,
  RulePacksStorage,
  TripRuleStorage,
} from '@packing-list/offline-storage';

/**
 * Deep equality check for objects
 */
function deepEqual(obj1: unknown, obj2: unknown): boolean {
  if (obj1 === obj2) return true;

  if (obj1 == null || obj2 == null) return obj1 === obj2;

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;

  const keys1 = Object.keys(obj1 as Record<string, unknown>);
  const keys2 = Object.keys(obj2 as Record<string, unknown>);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (
      !deepEqual(
        (obj1 as Record<string, unknown>)[key],
        (obj2 as Record<string, unknown>)[key]
      )
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Redux middleware that automatically tracks sync changes using deep diffs.
 * This approach is more robust than action-based tracking as it detects actual state changes.
 */
export const syncTrackingMiddleware: Middleware<object, StoreType> =
  (store) => (next) => (action) => {
    // Get the state before the action
    const prevState = store.getState();

    // Execute the action
    const result = next(action);

    if (
      (action as UnknownAction).type.includes('upsert') ||
      (action as UnknownAction).type === 'SELECT_TRIP' ||
      (action as UnknownAction).type === 'HYDRATE_OFFLINE'
    ) {
      console.log('Skipping action', (action as UnknownAction).type);
      return result;
    }

    // Get the state after the action
    const nextState = store.getState();

    // Log all actions for debugging
    console.log(
      `🔄 [SYNC_MIDDLEWARE] Analyzing diffs for action: ${
        (action as { type: string }).type
      }`
    );

    // Check if we should skip tracking
    const userId = nextState.auth.user?.id;
    const tripId = nextState.trips.selectedTripId;

    if (!userId || !tripId || userId === 'local-user') {
      console.log(
        `⏭️ [SYNC_MIDDLEWARE] Skipping change tracking for action ${
          (action as { type: string }).type
        }: no trip selected or local user`
      );
      return result;
    }

    try {
      // Get change tracker
      const changeTracker = getChangeTracker();
      const now = new Date().toISOString();

      // Handle specific actions that need optimized tracking
      if ((action as { type: string }).type === 'TOGGLE_ITEM_PACKED') {
        trackPackingStatusChange(
          prevState,
          nextState,
          tripId,
          userId,
          changeTracker,
          action as { type: string; payload: { itemId: string } }
        );
      } else {
        // Track different types of changes using deep diffs
        trackTripChanges(
          prevState,
          nextState,
          tripId,
          userId,
          now,
          changeTracker
        );
        trackPersonChanges(
          prevState,
          nextState,
          tripId,
          userId,
          now,
          changeTracker
        );
        trackRuleChanges(
          prevState,
          nextState,
          tripId,
          userId,
          now,
          changeTracker
        );
        trackRulePackChanges(
          prevState,
          nextState,
          tripId,
          userId,
          now,
          changeTracker
        );
      }
    } catch (error) {
      console.error('🚨 [SYNC_MIDDLEWARE] Error tracking changes:', error);
    }

    return result;
  };

/**
 * Track optimized packing status changes for TOGGLE_ITEM_PACKED actions
 */
function trackPackingStatusChange(
  prevState: StoreType,
  nextState: StoreType,
  tripId: string,
  userId: string,
  changeTracker: ChangeTracker,
  action: { type: string; payload: { itemId: string } }
): void {
  const { itemId } = action.payload;

  const prevItems =
    prevState.trips.byId[tripId]?.calculated.packingListItems || [];
  const nextItems =
    nextState.trips.byId[tripId]?.calculated.packingListItems || [];

  const prevItem = prevItems.find((item) => item.id === itemId);
  const nextItem = nextItems.find((item) => item.id === itemId);

  if (!nextItem) {
    console.warn(
      `⚠️ [SYNC_MIDDLEWARE] Item not found for packing toggle: ${itemId}`
    );
    return;
  }

  const previousStatus = prevItem?.isPacked || false;
  const newStatus = nextItem.isPacked;

  console.log(
    `📦 [SYNC_MIDDLEWARE] Packing status changed: ${itemId} (${previousStatus} → ${newStatus})`
  );

  // Use optimized packing status tracking
  changeTracker
    .trackPackingStatusChange(itemId, newStatus, userId, tripId, {
      previousStatus,
      timestamp: Date.now(),
    })
    .catch((error) => {
      console.error(
        '❌ [SYNC_MIDDLEWARE] Failed to track packing status change:',
        error
      );
    });
  const tripItem: TripItem = {
    id: itemId,
    tripId,
    name: nextItem.name,
    category: nextItem.categoryId,
    quantity: nextItem.quantity,
    packed: newStatus,
    notes: nextItem.notes,
    personId: nextItem.personId,
    dayIndex: nextItem.dayIndex,
    createdAt: nextItem.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: nextItem.version || 1,
    isDeleted: false,
  };
  ItemStorage.saveItem(tripItem).catch(console.error);
}

/**
 * Track changes to trip data
 */
function trackTripChanges(
  prevState: StoreType,
  nextState: StoreType,
  tripId: string,
  userId: string,
  now: string,
  changeTracker: ChangeTracker
): void {
  const prevTripData = prevState.trips.byId[tripId];
  const nextTripData = nextState.trips.byId[tripId];

  const prevTrip = prevTripData?.trip;
  const nextTrip = nextTripData?.trip;

  if (!nextTrip) return;

  // Check if this is truly a new trip by checking if there was any trip data before
  const isActuallyNewTrip = !prevTripData;

  if (isActuallyNewTrip) {
    // New trip created - convert to full Trip type
    console.log(`🧳 [SYNC_MIDDLEWARE] New trip detected: ${tripId}`);
    const modernTrip: Trip = {
      id: nextTrip.id,
      userId,
      title: nextTrip.title || 'New Trip', // Use existing title if available
      description: nextTrip.description,
      days: nextTrip.days,
      tripEvents: nextTrip.tripEvents || [],
      createdAt: nextTrip.createdAt || now,
      updatedAt: now,
      lastSyncedAt: nextTrip.lastSyncedAt,
      settings: nextTrip.settings || {
        defaultTimeZone: 'UTC',
        packingViewMode: 'by-day',
      },
      version: nextTrip.version || 1,
      isDeleted: false,
      defaultItemRules: nextTrip.defaultItemRules || [],
    };

    changeTracker.trackTripChange('create', modernTrip, userId);
    TripStorage.saveTrip(modernTrip).catch(console.error);
    return;
  }

  // Only track trip updates if the trip object itself has changed
  // (not when only trip data like rules or people change)
  if (prevTrip && !deepEqual(prevTrip, nextTrip)) {
    console.log(`🧳 [SYNC_MIDDLEWARE] Trip updated: ${tripId}`);
    const trip: Trip = {
      id: nextTrip.id,
      userId,
      title: nextTrip.title || prevTrip.title || 'Updated Trip',
      description:
        nextTrip.description !== undefined
          ? nextTrip.description
          : prevTrip.description,
      days: nextTrip.days,
      tripEvents: nextTrip.tripEvents || [],
      createdAt: prevTrip.createdAt || nextTrip.createdAt || now,
      updatedAt: now,
      lastSyncedAt: nextTrip.lastSyncedAt,
      settings: nextTrip.settings ||
        prevTrip.settings || {
          defaultTimeZone: 'UTC',
          packingViewMode: 'by-day',
        },
      version: (prevTrip.version || 0) + 1,
      isDeleted: false,
      defaultItemRules: nextTrip.defaultItemRules || [],
    };

    changeTracker.trackTripChange('update', trip, userId);
    TripStorage.saveTrip(trip).catch(console.error);
  }
}

/**
 * Track changes to people data
 */
function trackPersonChanges(
  prevState: StoreType,
  nextState: StoreType,
  tripId: string,
  userId: string,
  now: string,
  changeTracker: ChangeTracker
): void {
  const prevPeople = prevState.trips.byId[tripId]?.people || [];
  const nextPeople = nextState.trips.byId[tripId]?.people || [];

  // Check for new people
  for (const nextPerson of nextPeople) {
    const prevPerson = prevPeople.find((p) => p.id === nextPerson.id);

    if (!prevPerson) {
      console.log(`👤 [SYNC_MIDDLEWARE] New person detected: ${nextPerson.id}`);
      const person: Person = {
        id: nextPerson.id,
        tripId,
        name: nextPerson.name,
        age: nextPerson.age,
        gender: nextPerson.gender as
          | 'male'
          | 'female'
          | 'other'
          | 'prefer-not-to-say'
          | undefined,
        settings: {},
        createdAt: now,
        updatedAt: now,
        version: 1,
        isDeleted: false,
      };

      changeTracker.trackPersonChange('create', person, userId, tripId);
      PersonStorage.savePerson(person).catch(console.error);
    } else if (!deepEqual(prevPerson, nextPerson)) {
      console.log(`👤 [SYNC_MIDDLEWARE] Person updated: ${nextPerson.id}`);
      const person: Person = {
        id: nextPerson.id,
        tripId,
        name: nextPerson.name,
        age: nextPerson.age,
        gender: nextPerson.gender as
          | 'male'
          | 'female'
          | 'other'
          | 'prefer-not-to-say'
          | undefined,
        settings: {},
        createdAt: prevPerson.createdAt || now,
        updatedAt: now,
        version: (prevPerson.version || 0) + 1,
        isDeleted: false,
      };

      changeTracker.trackPersonChange('update', person, userId, tripId);
      PersonStorage.savePerson(person).catch(console.error);
    }
  }

  // Check for removed people
  for (const prevPerson of prevPeople) {
    const stillExists = nextPeople.find((p) => p.id === prevPerson.id);

    if (!stillExists) {
      console.log(`👤 [SYNC_MIDDLEWARE] Person removed: ${prevPerson.id}`);
      const modernPerson: Person = {
        id: prevPerson.id,
        tripId,
        name: prevPerson.name,
        age: prevPerson.age,
        gender: prevPerson.gender as
          | 'male'
          | 'female'
          | 'other'
          | 'prefer-not-to-say'
          | undefined,
        settings: {},
        createdAt: prevPerson.createdAt || now,
        updatedAt: now,
        version: (prevPerson.version || 0) + 1,
        isDeleted: true,
      };

      changeTracker.trackPersonChange('delete', modernPerson, userId, tripId);
      PersonStorage.deletePerson(prevPerson.id).catch(console.error);
    }
  }
}

/**
 * Track changes to default item rules
 */
function trackRuleChanges(
  prevState: StoreType,
  nextState: StoreType,
  tripId: string,
  userId: string,
  now: string,
  changeTracker: ChangeTracker
): void {
  const prevRules = prevState.trips.byId[tripId]?.trip?.defaultItemRules || [];
  const nextRules = nextState.trips.byId[tripId]?.trip?.defaultItemRules || [];

  // Check for new rules
  for (const rule of nextRules) {
    const prevRule = prevRules.find((r) => r.id === rule.id);

    if (!prevRule) {
      console.log(`📋 [SYNC_MIDDLEWARE] New rule detected: ${rule.id}`);
      changeTracker.trackDefaultItemRuleChange('create', rule, userId, tripId);
      DefaultItemRulesStorage.saveDefaultItemRule(rule).catch(console.error);
      const tripRule: TripRule = {
        id: `${tripId}-${rule.id}`,
        tripId,
        ruleId: rule.id,
        createdAt: now,
        updatedAt: now,
        version: 1,
        isDeleted: false,
      };
      TripRuleStorage.saveTripRule(tripRule).catch(console.error);
    } else if (!deepEqual(prevRule, rule)) {
      console.log(`📋 [SYNC_MIDDLEWARE] Rule updated: ${rule.id}`);
      changeTracker.trackDefaultItemRuleChange('update', rule, userId, tripId);
      DefaultItemRulesStorage.saveDefaultItemRule(rule).catch(console.error);
    }
  }

  // Check for removed rules
  for (const prevRule of prevRules) {
    const stillExists = nextRules.find((r) => r.id === prevRule.id);

    if (!stillExists) {
      console.log(`📋 [SYNC_MIDDLEWARE] Rule removed: ${prevRule.id}`);
      changeTracker.trackDefaultItemRuleChange(
        'delete',
        prevRule,
        userId,
        tripId
      );
      DefaultItemRulesStorage.deleteDefaultItemRule(prevRule.id).catch(
        console.error
      );
      TripRuleStorage.deleteTripRule(tripId, prevRule.id).catch(console.error);
    }
  }
}

/**
 * Track changes to rule packs
 */
function trackRulePackChanges(
  prevState: StoreType,
  nextState: StoreType,
  tripId: string,
  userId: string,
  now: string,
  changeTracker: ChangeTracker
): void {
  const prevPacks = prevState.rulePacks || [];
  const nextPacks = nextState.rulePacks || [];

  // Check for new packs
  for (const pack of nextPacks) {
    const prevPack = prevPacks.find((p) => p.id === pack.id);

    if (!prevPack) {
      console.log(`📦 [SYNC_MIDDLEWARE] New rule pack detected: ${pack.id}`);
      changeTracker.trackRulePackChange('create', pack, userId);
      RulePacksStorage.saveRulePack(pack).catch(console.error);
    } else if (!deepEqual(prevPack, pack)) {
      console.log(`📦 [SYNC_MIDDLEWARE] Rule pack updated: ${pack.id}`);
      changeTracker.trackRulePackChange('update', pack, userId);
      RulePacksStorage.saveRulePack(pack).catch(console.error);
    }
  }

  // Check for removed packs
  for (const prevPack of prevPacks) {
    const stillExists = nextPacks.find((p) => p.id === prevPack.id);

    if (!stillExists) {
      console.log(`📦 [SYNC_MIDDLEWARE] Rule pack removed: ${prevPack.id}`);
      changeTracker.trackRulePackChange('delete', prevPack, userId);
      RulePacksStorage.deleteRulePack(prevPack.id).catch(console.error);
    }
  }
}

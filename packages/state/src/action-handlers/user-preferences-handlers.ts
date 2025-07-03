import type { StoreType } from '../store.js';
import type { UserPreferences } from '@packing-list/model';

// Action types
export interface LoadUserPreferencesAction {
  type: 'LOAD_USER_PREFERENCES';
  payload: UserPreferences;
}

export interface UpdateUserPreferencesAction {
  type: 'UPDATE_USER_PREFERENCES';
  payload: Partial<UserPreferences>;
}

export interface UpdateLastSelectedTripIdAction {
  type: 'UPDATE_LAST_SELECTED_TRIP_ID';
  payload: { tripId: string | null };
}

export interface SyncUserPreferencesAction {
  type: 'SYNC_USER_PREFERENCES';
  payload: UserPreferences;
}

// Action creators
export const loadUserPreferences = (
  preferences: UserPreferences
): LoadUserPreferencesAction => ({
  type: 'LOAD_USER_PREFERENCES',
  payload: preferences,
});

export const updateUserPreferences = (
  preferences: Partial<UserPreferences>
): UpdateUserPreferencesAction => ({
  type: 'UPDATE_USER_PREFERENCES',
  payload: preferences,
});

export const updateLastSelectedTripId = (
  tripId: string | null
): UpdateLastSelectedTripIdAction => ({
  type: 'UPDATE_LAST_SELECTED_TRIP_ID',
  payload: { tripId },
});

export const syncUserPreferences = (
  preferences: UserPreferences
): SyncUserPreferencesAction => ({
  type: 'SYNC_USER_PREFERENCES',
  payload: preferences,
});

// Action handlers
export function loadUserPreferencesHandler(
  state: StoreType,
  action: LoadUserPreferencesAction
): StoreType {
  console.log(
    '📖 [LOAD_USER_PREFERENCES] Loading preferences:',
    action.payload
  );

  return {
    ...state,
    userPreferences: action.payload,
  };
}

export function updateUserPreferencesHandler(
  state: StoreType,
  action: UpdateUserPreferencesAction
): StoreType {
  console.log(
    '✏️ [UPDATE_USER_PREFERENCES] Updating preferences:',
    action.payload
  );

  const currentPreferences = state.userPreferences || {
    defaultTimeZone: 'UTC',
    theme: 'system',
    defaultTripDuration: 7,
    autoSyncEnabled: true,
    serviceWorkerEnabled: false,
    lastSelectedTripId: null,
  };

  const updatedPreferences: UserPreferences = {
    ...currentPreferences,
    ...action.payload,
  };

  // Note: IndexedDB persistence is handled by sync middleware

  return {
    ...state,
    userPreferences: updatedPreferences,
  };
}

export function updateLastSelectedTripIdHandler(
  state: StoreType,
  action: UpdateLastSelectedTripIdAction
): StoreType {
  const { tripId } = action.payload;
  console.log(
    '🎯 [UPDATE_LAST_SELECTED_TRIP_ID] Updating lastSelectedTripId:',
    tripId
  );

  const currentPreferences = state.userPreferences || {
    defaultTimeZone: 'UTC',
    theme: 'system',
    defaultTripDuration: 7,
    autoSyncEnabled: true,
    serviceWorkerEnabled: false,
    lastSelectedTripId: null,
  };

  const updatedPreferences: UserPreferences = {
    ...currentPreferences,
    lastSelectedTripId: tripId,
  };

  // Note: IndexedDB persistence is handled by sync middleware

  return {
    ...state,
    userPreferences: updatedPreferences,
  };
}

export function syncUserPreferencesHandler(
  state: StoreType,
  action: SyncUserPreferencesAction
): StoreType {
  console.log(
    '🔄 [SYNC_USER_PREFERENCES] Syncing preferences from server:',
    action.payload
  );

  // Don't persist to IndexedDB here - this is incoming sync data
  // IndexedDB should only be updated from local actions to avoid conflicts

  return {
    ...state,
    userPreferences: action.payload,
  };
}

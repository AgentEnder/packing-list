export type { StoreType } from './store.js';
export { createStore } from './store.js';
export { useAppDispatch, useAppSelector } from './hooks.js';

export * from './selectors.js';
export * from './store.js';
export * from './actions.js';
export * from './hooks.js';
export * from './selectors/packing-list.js';

export * from './store.js';
export * from './data.js';
export * from './default-rule-packs.js';
export * from './offline-hydration.js';

// Sync integration exports
export { createEntityCallbacks } from './lib/sync/sync-integration.js';

// Consolidated sync functionality
export * from './lib/sync/index.js';

// User people management exports (Sprint 3)
export {
  setUserPeople,
  upsertUserPerson,
  removeUserPerson,
  clearUserPeople,
  setLoading as setPeopleLoading,
  setError as setPeopleError,
  clearError as clearPeopleError,
  resetPeopleState,
  markAsTriedToLoad,
  createUserPerson,
  selectUserPeople,
  selectUserProfile,
  selectUserTemplates,
  selectUserPeopleLoading,
  selectUserPeopleError,
  selectHasUserProfile,
  selectUserPeopleState,
  selectUserPersonById,
  type UserPeopleState,
} from './user-people-slice.js';

// Re-export auth-state for convenience
export * from '@packing-list/auth-state';

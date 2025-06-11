// Core types
export type {
  SyncStateSlice,
  SyncActions,
  SyncStateUpdateCallback,
  TrackChangeCallback,
  EntityCallbacks,
  EntityExistence,
} from './lib/types.js';

// Reducers
export {
  initialSyncState,
  syncStateReducer,
  createEntityMergeReducer,
  createChangeTrackingReducer,
} from './lib/reducers.js';

// Action creators
export * from './lib/actions.js';

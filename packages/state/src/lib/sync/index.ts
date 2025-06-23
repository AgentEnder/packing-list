// Export sync service and utilities
export {
  SyncService,
  ChangeTracker,
  ConflictResolver,
  getSyncService,
  getChangeTracker,
  getConflictResolver,
  resetSyncService,
  initializeSyncService,
  enableSyncMode,
  disableSyncMode,
  isChangeTrackingDisabled,
} from './sync-service.js';

// Export types
export type {
  SyncOptions,
  SyncStateSlice,
  SyncActions,
  EntityCallbacks,
  EntityExistence,
  TrackChangeCallback,
  SyncStateUpdateCallback,
} from './types.js';

// Export actions
export * from './actions.js';

// Export reducers
export {
  syncStateReducer,
  initialSyncState,
  createEntityMergeReducer,
  createChangeTrackingReducer,
} from './reducers.js';

// Export handlers
export * from './sync-handlers.js';

// Export integration utilities
export * from './sync-integration.js';

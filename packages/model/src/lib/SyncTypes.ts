export type Change = {
  id: string;
  entityType: 'trip' | 'person' | 'item' | 'rule_override';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: unknown;
  timestamp: number;
  userId: string;
  tripId?: string;
  version: number;
  synced: boolean;
};

export type SyncConflict = {
  id: string;
  entityType: string;
  entityId: string;
  localVersion: unknown;
  serverVersion: unknown;
  conflictType: 'update_conflict' | 'delete_conflict';
  timestamp: number;
};

export type SyncState = {
  lastSyncTimestamp: number;
  pendingChanges: Change[];
  isOnline: boolean;
  isSyncing: boolean;
  conflicts: SyncConflict[];
};

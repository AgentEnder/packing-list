import { DefaultItemRule } from './DefaultItemRule.js';
import { Person } from './Person.js';
import { RuleOverride } from './RuleOverride.js';
import { RulePack } from './RulePack.js';
import { Trip } from './Trip.js';
import { TripItem } from './TripItem.js';
import { TripRule } from './TripRule.js';

// Base change interface
export interface BaseChange {
  id: string;
  operation: 'create' | 'update' | 'delete';
  timestamp: number;
  userId: string;
  version: number;
  synced: boolean;
}

// Specific change types with discriminated unions
export type TripChange = BaseChange & {
  entityType: 'trip';
  entityId: string;
  data: Partial<Trip> & { id: string }; // id is always required for identification
  tripId?: string;
};

export type PersonChange = BaseChange & {
  entityType: 'person';
  entityId: string;
  data: Partial<Person> & { id?: string }; // id might be generated on create
  tripId: string; // Always required for people
};

export type ItemChange = BaseChange & {
  entityType: 'item';
  entityId: string;
  data: Partial<TripItem> & { id?: string }; // id might be generated on create
  tripId: string; // Always required for items
};

export type RuleOverrideChange = BaseChange & {
  entityType: 'rule_override';
  entityId: string;
  data: Partial<RuleOverride> & { ruleId: string }; // ruleId always required for identification
  tripId: string; // Always required for rule overrides
};

export type DefaultItemRuleChange = BaseChange & {
  entityType: 'default_item_rule';
  entityId: string;
  data: Partial<DefaultItemRule> & { id: string }; // id always required for identification
  tripId?: string;
};

export type RulePackChange = BaseChange & {
  entityType: 'rule_pack';
  entityId: string;
  data: Partial<RulePack> & { id: string }; // id always required for identification
  tripId?: string;
};

export type TripRuleChange = BaseChange & {
  entityType: 'trip_rule';
  entityId: string;
  data: Partial<TripRule> & { ruleId: string };
  tripId: string;
};

// Special change types for packing operations
export type PackingStatusChange = BaseChange & {
  entityType: 'item';
  entityId: string;
  data: {
    id: string;
    packed: boolean;
    updatedAt?: string;
    _packingStatusOnly: true;
    _previousStatus?: boolean;
    _bulkOperation?: boolean;
  };
  tripId: string;
};

export type BulkPackingChange = BaseChange & {
  entityType: 'item';
  entityId: string; // This will be a composite key for bulk operations
  data: {
    bulkPackingUpdate: true;
    changes: Array<{
      itemId: string;
      packed: boolean;
      previousStatus?: boolean;
    }>;
    updatedAt?: string;
  };
  tripId: string;
};

// Union type for all changes
export type Change =
  | TripChange
  | PersonChange
  | ItemChange
  | RuleOverrideChange
  | DefaultItemRuleChange
  | RulePackChange
  | TripRuleChange
  | PackingStatusChange
  | BulkPackingChange;

// Legacy type for backward compatibility (to be removed gradually)
export type LegacyChange = {
  id: string;
  entityType:
    | 'trip'
    | 'person'
    | 'item'
    | 'rule_override'
    | 'default_item_rule'
    | 'rule_pack'
    | 'trip_rule';
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
  lastSyncTimestamp: number | null;
  pendingChanges: Change[];
  isOnline: boolean;
  isSyncing: boolean;
  conflicts: SyncConflict[];
};

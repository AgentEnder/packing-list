import type {
  Change,
  TripChange,
  PersonChange,
  ItemChange,
  RuleOverrideChange,
  DefaultItemRuleChange,
  RulePackChange,
  PackingStatusChange,
  BulkPackingChange,
} from '@packing-list/model';

// Base factory options for all changes
interface BaseChangeOptions {
  operation?: 'create' | 'update' | 'delete';
  entityId?: string;
  userId?: string;
  version?: number;
  tripId?: string;
}

// Trip change factory
interface TripChangeOptions extends BaseChangeOptions {
  title?: string;
  description?: string;
  days?: Array<{ date: string; activities: string[] }>;
  tripEvents?: Array<{ type: string; time: string }>;
  settings?: Record<string, unknown>;
}

export function createTripChange(options: TripChangeOptions = {}): TripChange {
  const {
    operation = 'create',
    entityId = `trip-${Date.now()}`,
    userId = 'test-user',
    version = 1,
    tripId,
    title = 'Test Trip',
    description = 'A test trip',
    days = [],
    tripEvents = [],
    settings = {},
  } = options;

  return {
    entityType: 'trip',
    operation,
    entityId,
    userId,
    version,
    tripId,
    data: {
      id: entityId,
      ...(operation !== 'delete' && {
        title,
        description,
        days,
        tripEvents,
        settings,
      }),
    },
  } as TripChange;
}

// Person change factory
interface PersonChangeOptions extends BaseChangeOptions {
  tripId?: string;
  name?: string;
  age?: number;
  gender?: string;
  settings?: Record<string, unknown>;
}

export function createPersonChange(
  options: PersonChangeOptions = {}
): PersonChange {
  const {
    operation = 'create',
    entityId = `person-${Date.now()}`,
    userId = 'test-user',
    version = 1,
    tripId = 'test-trip',
    name = 'Test Person',
    age = 30,
    gender = 'other',
    settings = {},
  } = options;

  return {
    entityType: 'person',
    operation,
    entityId,
    userId,
    version,
    tripId,
    data: {
      id: entityId,
      ...(operation !== 'delete' && {
        name,
        age,
        gender,
        settings,
      }),
    },
  } as PersonChange;
}

// Item change factory
interface ItemChangeOptions extends BaseChangeOptions {
  tripId?: string;
  name?: string;
  category?: string;
  quantity?: number;
  packed?: boolean;
  notes?: string;
  personId?: string;
  dayIndex?: number;
}

export function createItemChange(options: ItemChangeOptions = {}): ItemChange {
  const {
    operation = 'create',
    entityId = `item-${Date.now()}`,
    userId = 'test-user',
    version = 1,
    tripId = 'test-trip',
    name = 'Test Item',
    category = 'general',
    quantity = 1,
    packed = false,
    notes = '',
    personId = 'test-person',
    dayIndex = 0,
  } = options;

  return {
    entityType: 'item',
    operation,
    entityId,
    userId,
    version,
    tripId,
    data: {
      id: entityId,
      ...(operation !== 'delete' && {
        name,
        category,
        quantity,
        packed,
        notes,
        personId,
        dayIndex,
      }),
    },
  } as ItemChange;
}

// Packing status change factory
interface PackingStatusChangeOptions extends BaseChangeOptions {
  tripId?: string;
  packed?: boolean;
  updatedAt?: string;
  previousStatus?: boolean;
  bulkOperation?: boolean;
}

export function createPackingStatusChange(
  options: PackingStatusChangeOptions = {}
): PackingStatusChange {
  const {
    operation = 'update',
    entityId = `item-${Date.now()}`,
    userId = 'test-user',
    version = 1,
    tripId = 'test-trip',
    packed = true,
    updatedAt = new Date().toISOString(),
    previousStatus = false,
    bulkOperation = false,
  } = options;

  return {
    entityType: 'item',
    operation,
    entityId,
    userId,
    version,
    tripId,
    data: {
      id: entityId,
      packed,
      updatedAt,
      _packingStatusOnly: true,
      _previousStatus: previousStatus,
      _bulkOperation: bulkOperation,
    },
  } as PackingStatusChange;
}

// Bulk packing change factory
interface BulkPackingChangeOptions extends BaseChangeOptions {
  tripId?: string;
  changes?: Array<{
    itemId: string;
    packed: boolean;
    previousStatus?: boolean;
  }>;
  updatedAt?: string;
}

export function createBulkPackingChange(
  options: BulkPackingChangeOptions = {}
): BulkPackingChange {
  const {
    operation = 'update',
    entityId = `bulk-${Date.now()}`,
    userId = 'test-user',
    version = 1,
    tripId = 'test-trip',
    changes = [
      { itemId: 'item-1', packed: true },
      { itemId: 'item-2', packed: false },
    ],
    updatedAt = new Date().toISOString(),
  } = options;

  return {
    entityType: 'item',
    operation,
    entityId,
    userId,
    version,
    tripId,
    data: {
      bulkPackingUpdate: true,
      changes,
      updatedAt,
    },
  } as BulkPackingChange;
}

// Rule override change factory
interface RuleOverrideChangeOptions extends BaseChangeOptions {
  tripId?: string;
  ruleId?: string;
  overrideData?: Record<string, unknown>;
}

export function createRuleOverrideChange(
  options: RuleOverrideChangeOptions = {}
): RuleOverrideChange {
  const {
    operation = 'create',
    entityId = `override-${Date.now()}`,
    userId = 'test-user',
    version = 1,
    tripId = 'test-trip',
    ruleId = 'test-rule',
    overrideData = { enabled: false },
  } = options;

  return {
    entityType: 'rule_override',
    operation,
    entityId,
    userId,
    version,
    tripId,
    data: {
      ruleId,
      ...(operation !== 'delete' && overrideData),
    },
  } as RuleOverrideChange;
}

// Default item rule change factory
interface DefaultItemRuleChangeOptions extends BaseChangeOptions {
  name?: string;
  calculation?: Record<string, unknown>;
  conditions?: Array<unknown>;
  categoryId?: string;
  subcategoryId?: string;
  packIds?: string[];
}

export function createDefaultItemRuleChange(
  options: DefaultItemRuleChangeOptions = {}
): DefaultItemRuleChange {
  const {
    operation = 'create',
    entityId = `rule-${Date.now()}`,
    userId = 'test-user',
    version = 1,
    name = 'Test Rule',
    calculation = { type: 'fixed', value: 1 },
    conditions = [],
    categoryId = 'test-category',
    subcategoryId = 'test-subcategory',
    packIds = [],
  } = options;

  return {
    entityType: 'default_item_rule',
    operation,
    entityId,
    userId,
    version,
    data: {
      id: entityId,
      ...(operation !== 'delete' && {
        name,
        calculation,
        conditions,
        categoryId,
        subcategoryId,
        packIds,
      }),
    },
  } as DefaultItemRuleChange;
}

// Rule pack change factory
interface RulePackChangeOptions extends BaseChangeOptions {
  name?: string;
  description?: string;
  author?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  stats?: Record<string, unknown>;
  primaryCategoryId?: string;
  icon?: string;
  color?: string;
}

export function createRulePackChange(
  options: RulePackChangeOptions = {}
): RulePackChange {
  const {
    operation = 'create',
    entityId = `pack-${Date.now()}`,
    userId = 'test-user',
    version = 1,
    name = 'Test Pack',
    description = 'A test rule pack',
    author = { name: 'Test Author', email: 'test@example.com' },
    metadata = { version: '1.0.0' },
    stats = { rules: 0, downloads: 0 },
    primaryCategoryId = 'test-category',
    icon = 'test-icon',
    color = '#000000',
  } = options;

  return {
    entityType: 'rule_pack',
    operation,
    entityId,
    userId,
    version,
    data: {
      id: entityId,
      ...(operation !== 'delete' && {
        name,
        description,
        author,
        metadata,
        stats,
        primaryCategoryId,
        icon,
        color,
      }),
    },
  } as RulePackChange;
}

// Convenience functions for common patterns
export function createLocalUserChange(
  options: Partial<BaseChangeOptions> = {}
): Change {
  return createTripChange({
    ...options,
    userId: 'local-user',
  });
}

export function createLocalSharedUserChange(
  options: Partial<BaseChangeOptions> = {}
): Change {
  return createTripChange({
    ...options,
    userId: 'local-shared-user',
  });
}

export function createLocalPrefixUserChange(
  options: Partial<BaseChangeOptions> = {}
): Change {
  return createTripChange({
    ...options,
    userId: 'local-guest-123',
  });
}

// Helper function to create multiple changes at once
export function createMultipleChanges(
  count: number,
  factory: (index: number) => Change
): Change[] {
  return Array.from({ length: count }, (_, index) => factory(index));
}

// Helper function to create a change with minimal data (useful for updates)
export function createMinimalTripChange(
  operation: 'update' | 'delete' = 'update'
): TripChange {
  return createTripChange({
    operation,
    title: operation === 'update' ? 'Updated Title' : undefined,
  });
}

export function createMinimalPersonChange(
  operation: 'update' | 'delete' = 'update'
): PersonChange {
  return createPersonChange({
    operation,
    name: operation === 'update' ? 'Updated Name' : undefined,
  });
}

export function createMinimalItemChange(
  operation: 'update' | 'delete' = 'update'
): ItemChange {
  return createItemChange({
    operation,
    name: operation === 'update' ? 'Updated Item' : undefined,
  });
}

// Mock data generators for specific test scenarios
export const MockData = {
  tripWithFullData: {
    id: 'trip-full',
    title: 'Summer Vacation',
    description: 'A fun summer trip',
    days: [{ date: '2024-07-01', activities: ['beach'] }],
    tripEvents: [{ type: 'departure', time: '10:00' }],
    settings: { notifications: true },
  },

  personWithFullData: {
    id: 'person-full',
    name: 'John Doe',
    age: 30,
    gender: 'male',
    settings: { dietary: ['vegetarian'] },
  },

  itemWithFullData: {
    id: 'item-full',
    name: 'T-shirt',
    category: 'clothing',
    quantity: 3,
    packed: false,
    notes: 'Cotton shirts',
    personId: 'person-456',
    dayIndex: 1,
  },
};

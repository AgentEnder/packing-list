# Sync Library Test Utilities

This directory contains test utilities for the sync library, designed to reduce code duplication and improve test maintainability.

## Test Utilities (`test-utils.ts`)

The test utilities provide factory functions for creating change objects used throughout the sync service tests.

### Factory Functions

All factory functions follow the same pattern:

- Accept an optional options object
- Provide sensible defaults for all fields
- Return properly typed change objects

#### Basic Usage

```typescript
import {
  createTripChange,
  createPersonChange,
  createItemChange,
} from './test-utils.js';

// Create a simple trip change with defaults
const tripChange = createTripChange();

// Create a trip change with specific properties
const customTripChange = createTripChange({
  operation: 'update',
  entityId: 'my-trip-123',
  userId: 'user-456',
  title: 'My Custom Trip',
  description: 'A great vacation',
});

// Create changes for different entity types
const personChange = createPersonChange({
  name: 'John Doe',
  age: 30,
  tripId: 'trip-123',
});

const itemChange = createItemChange({
  name: 'Passport',
  category: 'documents',
  packed: false,
});
```

#### Available Factory Functions

- `createTripChange(options)` - Creates TripChange objects
- `createPersonChange(options)` - Creates PersonChange objects
- `createItemChange(options)` - Creates ItemChange objects
- `createPackingStatusChange(options)` - Creates PackingStatusChange objects
- `createBulkPackingChange(options)` - Creates BulkPackingChange objects
- `createRuleOverrideChange(options)` - Creates RuleOverrideChange objects
- `createDefaultItemRuleChange(options)` - Creates DefaultItemRuleChange objects
- `createRulePackChange(options)` - Creates RulePackChange objects

#### Convenience Functions

```typescript
// Create changes for local users (won't be synced)
const localChange = createLocalUserChange({ operation: 'create' });
const sharedLocalChange = createLocalSharedUserChange({ operation: 'update' });
const prefixLocalChange = createLocalPrefixUserChange({ operation: 'delete' });

// Create minimal changes (useful for updates/deletes)
const minimalUpdate = createMinimalTripChange('update');
const minimalDelete = createMinimalPersonChange('delete');

// Create multiple changes at once
const changes = createMultipleChanges(5, (index) =>
  createTripChange({ entityId: `trip-${index}` })
);
```

#### Mock Data

Pre-defined mock data is available for complex test scenarios:

```typescript
import { MockData } from './test-utils.js';

const fullTripData = MockData.tripWithFullData;
const fullPersonData = MockData.personWithFullData;
const fullItemData = MockData.itemWithFullData;
```

## Refactoring Existing Tests

To refactor existing tests, replace manual change object creation:

### Before

```typescript
const change = {
  entityType: 'trip',
  operation: 'create',
  entityId: 'trip-123',
  userId: 'user-456',
  version: 1,
  data: {
    id: 'trip-123',
    title: 'Summer Vacation',
    description: 'A fun summer trip',
    days: [],
    tripEvents: [],
    settings: {},
  },
};
```

### After

```typescript
const change = createTripChange({
  entityId: 'trip-123',
  userId: 'user-456',
  title: 'Summer Vacation',
  description: 'A fun summer trip',
});
```

## Benefits

1. **Reduced Code Duplication** - No more copying and pasting change objects
2. **Type Safety** - Proper TypeScript types prevent errors
3. **Maintainability** - Changes to the change structure only need updates in one place
4. **Readability** - Tests focus on what's being tested, not object structure
5. **Consistency** - All tests use the same patterns and defaults

## Files Refactored

- ✅ `local-user-filtering.test.ts` - Fully refactored
- ✅ `push-operations.test.ts` - Partially refactored (trip and person tests)
- ⏳ `type-guards.test.ts` - TODO: Refactor remaining tests
- ⏳ `data-conversion.test.ts` - TODO: Refactor remaining tests

## Next Steps

The remaining test files can be refactored using the same patterns shown above. Focus on:

1. Importing the relevant factory functions
2. Replacing manual object creation with factory calls
3. Removing unused properties that have sensible defaults
4. Using convenience functions for common patterns

# Enhanced Nested Object Sync

This document describes the enhanced sync capabilities for handling nested objects in the packing list application.

## Overview

The sync system has been enhanced to provide intelligent handling of nested objects, particularly for complex entities like `Trip` objects that contain nested arrays and sub-objects.

## Key Improvements

### 1. Deep Conflict Detection

Previously, any change to a complex object would result in the entire object being marked as conflicted. Now, the system performs deep analysis to identify only the specific fields that have actually changed.

**Example:**

```typescript
// Before: Entire trip object would be conflicted
// After: Only specific conflicting fields are identified

const localTrip = {
  id: 'trip-1',
  title: 'European Adventure',
  days: [
    { date: '2024-01-01', location: 'Paris', packed: false },
    { date: '2024-01-02', location: 'London', packed: false },
  ],
};

const serverTrip = {
  id: 'trip-1',
  title: 'European Adventure',
  days: [
    { date: '2024-01-01', location: 'Paris', packed: false },
    { date: '2024-01-02', location: 'London', packed: true }, // Only this changed
  ],
};

// Result: Only 'days.1.packed' is flagged as conflicted
```

### 2. System Field Ignoring

The system automatically ignores conflicts in system-managed fields that shouldn't cause user-facing conflicts:

- `timestamp`, `updatedAt`, `updated_at`
- `lastModified`, `last_modified`
- `lastSyncedAt`, `last_synced_at`
- `version` (handled separately)
- `createdAt`, `created_at` (for some entities)

### 3. Smart Merging

When conflicts are detected, the system can automatically merge non-conflicting parts:

```typescript
// If only one field conflicts, the rest can be auto-merged
const mergedObject = smartMerge(localData, serverData, 'prefer-server');
```

### 4. Enhanced UI Display

The conflict resolution UI now shows:

- Specific field paths for nested conflicts (e.g., `days.1.items.0.packed`)
- Nested indicators for complex object conflicts
- More precise conflict counts
- Path-based conflict navigation

## Implementation Details

### Core Components

1. **`deep-diff-utils.ts`**: Core utilities for deep object comparison

   - `deepDiff()`: Performs intelligent conflict detection
   - `smartMerge()`: Handles automatic merging of non-conflicting fields
   - `deepEqual()`: Deep equality checking
   - `getDefaultIgnorePaths()`: System field exclusion

2. **Enhanced `sync.ts`**: Updated sync service

   - `performDeepConflictAnalysis()`: Analyzes potential conflicts
   - `getEntitySpecificIgnorePaths()`: Entity-specific field exclusions
   - Smart conflict creation and auto-merging

3. **Enhanced UI Components**:
   - `ConflictDiffView`: Shows nested conflict details
   - `ConflictResolutionModal`: Handles nested conflict resolution

### Usage Examples

#### Basic Deep Diff

```typescript
import { deepDiff } from './deep-diff-utils.js';

const result = deepDiff(localObject, serverObject, ignorePaths);

if (result.hasConflicts) {
  console.log(`Found ${result.conflicts.length} conflicts`);
  result.conflicts.forEach((conflict) => {
    console.log(`Conflict at ${conflict.path}: ${conflict.type}`);
  });
}
```

#### Smart Merging

```typescript
import { smartMerge } from './deep-diff-utils.js';

// Automatically resolve non-conflicting fields
const merged = smartMerge(localData, serverData, 'prefer-server');
```

#### Custom Ignore Paths

```typescript
const customIgnorePaths = [
  ...getDefaultIgnorePaths(),
  'metadata.lastViewed',
  'statistics',
];

const result = deepDiff(localData, serverData, customIgnorePaths);
```

## Benefits

1. **Reduced Conflicts**: Only actual conflicts are presented to users
2. **Better UX**: Users see specific field-level conflicts instead of entire object conflicts
3. **Automatic Resolution**: Non-conflicting changes are merged automatically
4. **Precise Information**: Exact paths show where conflicts occur in nested structures
5. **Performance**: Fewer unnecessary conflict resolution dialogs

## Migration

The enhanced sync system is backward-compatible. Existing conflict resolution workflows will continue to work, but will benefit from the improved precision automatically.

## Testing

Comprehensive test coverage includes:

- Deep diff detection in nested arrays
- System field ignoring
- Smart merging strategies
- Trip-specific scenarios (days, items, settings)
- Edge cases (null values, type mismatches, missing fields)

## Future Enhancements

Potential future improvements could include:

- Field-level merge strategies for specific data types
- Conflict resolution hints based on data semantics
- Conflict prevention through better change tracking
- Visual diff highlighting in the UI

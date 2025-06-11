# Sync Flow End-to-End Testing

This document describes the comprehensive end-to-end testing suite for the sync functionality in the packing list application.

## Overview

The sync testing infrastructure provides utilities and tests to verify that data synchronization works correctly across various scenarios:

- **Server-to-Client Sync**: Data created on the server appears in the local app
- **Client-to-Server Sync**: Data created offline syncs to the server when online
- **Partial Sync**: Only new/changed data is synchronized
- **Sync Loop Prevention**: Synced data doesn't create new sync changes
- **Network Interruption Handling**: Robust sync across network state changes
- **Race Condition Handling**: Multiple rapid changes sync correctly
- **IndexedDB Recovery**: Recovery from local storage corruption
- **Sync State Management**: Correct sync state throughout app lifecycle
- **Conflict Resolution**: Intelligent handling of data conflicts
- **Performance Optimization**: Efficient sync operations under load
- **Error Recovery**: Graceful handling of sync failures

## Test Files

### Core Test Files

#### `sync-flow.spec.ts`

Original comprehensive sync test suite with fundamental scenarios:

- Basic server-to-client sync
- Offline-to-online sync
- Partial sync handling
- Sync loop prevention
- Network interruption handling
- Race condition management
- IndexedDB corruption recovery
- Sync state lifecycle management

#### `sync-flow-extended.spec.ts` ✨ NEW

Extended test suite covering advanced scenarios based on sync documentation:

**Conflict Resolution Tests**

- Local preference conflict resolution
- Server preference conflict resolution
- Multiple conflicts handling
- Conflict detection and analysis

**Optimized Packing Sync Tests**

- Individual packing status sync efficiency
- Bulk packing operations
- Performance optimization verification

**Performance and Reliability Tests**

- Rapid sequential changes without data loss
- Sync error recovery mechanisms
- Performance under load testing

**Advanced Sync State Management**

- Comprehensive state tracking throughout app lifecycle
- Sync state persistence across page reloads

**Edge Cases and Error Handling**

- Corrupted local data recovery
- Partial sync failure handling
- Infinite sync loop prevention

#### `sync-integration-demo.spec.ts` ✨ NEW

Demonstration tests showing best practices for using the refactored page objects:

- End-to-end trip creation and sync workflow
- Offline trip management with sync recovery
- Multi-device sync simulation
- Packing sync optimization demo
- Comprehensive error handling demo
- Sync performance monitoring

### Test Files Structure

```
e2e/frontend-e2e/src/
├── sync-flow.spec.ts              # Core sync scenarios
├── sync-flow-extended.spec.ts     # Advanced sync scenarios
├── sync-integration-demo.spec.ts  # Page object integration demos
├── sync-test-utils.ts             # Sync testing utilities
└── page-objects/
    ├── SyncPage.ts                # Refactored sync-specific page object
    ├── TripsListPage.ts           # Trip listing functionality
    ├── TripCreationPage.ts        # Trip creation workflow
    └── PackingListPage.ts         # Packing list interactions
```

## Refactored Page Objects Architecture

### SyncPage Improvements ✨

The `SyncPage` has been refactored to **reuse existing page objects** rather than duplicating functionality:

```typescript
export class SyncPage {
  public syncUtils: SyncTestUtils;
  public tripsListPage: TripsListPage; // ✨ Reuses existing page object
  public tripCreationPage: TripCreationPage; // ✨ Reuses existing page object
  public packingListPage: PackingListPage; // ✨ Reuses existing page object

  // Sync-specific methods only
  async waitForSyncInitialization(): Promise<void>;
  async waitForSyncComplete(): Promise<void>;
  async triggerManualSync(): Promise<void>;
  async isShowingOnlineStatus(): Promise<boolean>;
  async getPendingChangesCount(): Promise<number>;
  async getConflictsCount(): Promise<number>;

  // Enhanced methods using existing page objects
  async createTripThroughUI(title: string, description = ''): Promise<string>;
  async packItemThroughUI(itemName: string): Promise<void>;
  async navigateToTrip(tripId: string): Promise<void>;

  // Advanced sync scenario helpers
  async simulateConflictScenario(
    userId: string
  ): Promise<{ conflictId: string; tripId: string }>;
  async resolveConflictWithLocalStrategy(conflictId: string): Promise<void>;
  async getSyncMetrics(): Promise<SyncMetrics>;
}
```

### Benefits of Refactored Architecture

1. **Reduced Code Duplication**: SyncPage no longer reimplements trip creation, navigation, etc.
2. **Better Maintainability**: Changes to UI interactions only need to be made in one place
3. **Improved Test Reliability**: Uses the same page objects that other tests rely on
4. **Enhanced Reusability**: Other test files can easily compose page objects together
5. **Clear Separation of Concerns**: SyncPage focuses only on sync-specific functionality

## Key Testing Scenarios

### 1. Basic Sync Flows

#### Server-to-Client Sync

```typescript
// Add data to Supabase directly
await syncUtils.addTripToSupabase({ ... });

// Clear local storage
await syncUtils.clearIndexedDB();

// Trigger sync and verify data appears locally
await page.reload();
await syncPage.waitForSyncComplete();
```

#### Offline-to-Online Sync

```typescript
// Go offline
await syncUtils.goOffline();

// Create data while offline using page objects
await syncPage.createTripThroughUI('Offline Trip');

// Verify pending changes exist
const pending = await syncUtils.getPendingSyncChanges();

// Go online and verify sync completes
await syncUtils.goOnline();
await syncPage.waitForSyncComplete();
```

### 2. Conflict Resolution ✨ NEW

#### Conflict Detection and Resolution

```typescript
// Create conflict scenario
const { conflictId, tripId } = await syncPage.simulateConflictScenario(userId);

// Verify conflict was detected
const conflictsCount = await syncPage.getConflictsCount();
expect(conflictsCount).toBeGreaterThan(0);

// Resolve using local preference
await syncPage.resolveConflictWithLocalStrategy(conflictId);

// Verify resolution
const remainingConflicts = await syncPage.getConflictsCount();
expect(remainingConflicts).toBe(0);
```

### 3. Optimized Packing Sync ✨ NEW

#### Individual Packing Status Sync

```typescript
// Pack items using existing page objects
await syncPage.packItemThroughUI('Test Item 1');
await syncPage.packItemThroughUI('Test Item 2');

// Verify efficient sync tracking
const metrics = await syncPage.getSyncMetrics();
expect(metrics.pendingChanges).toBeGreaterThan(0);

await syncPage.waitForSyncComplete();
expect(metrics.pendingChanges).toBe(0);
```

#### Bulk Packing Operations

```typescript
// Simulate bulk packing
await syncPage.page.evaluate(() => {
  const store = (window as any).__REDUX_STORE__;
  const changes = [];
  for (let i = 1; i <= 10; i++) {
    changes.push({
      itemId: `bulk-item-${i}`,
      isPacked: true,
      previousStatus: false,
    });
  }

  store?.dispatch?.({
    type: 'BULK_PACK_ITEMS',
    payload: { changes },
  });
});
```

### 4. Performance Testing ✨ NEW

#### Load Testing

```typescript
// Create multiple trips rapidly
const tripPromises: Promise<string>[] = [];
for (let i = 1; i <= 5; i++) {
  tripPromises.push(
    syncPage.createTripThroughUI(`Rapid Trip ${i}`, `Description ${i}`)
  );
}

const tripIds = await Promise.all(tripPromises);
await syncPage.waitForSyncComplete();

// Verify performance metrics
const metrics = await syncPage.getSyncMetrics();
expect(metrics.pendingChanges).toBe(0);
```

#### Performance Monitoring

```typescript
const startTime = Date.now();

// Perform sync operations
await performSyncOperations();

const totalTime = Date.now() - startTime;
expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds

const metrics = await syncPage.getSyncMetrics();
console.log('📊 Sync metrics:', metrics);
```

### 5. Error Recovery ✨ NEW

#### Network Interruption Recovery

```typescript
// Create data
await syncPage.createTripThroughUI(
  'Error Recovery Trip',
  'Test error handling'
);

// Simulate network error
await syncPage.syncUtils.goOffline();
await syncPage.triggerManualSync();

// Verify offline handling
const offlineMetrics = await syncPage.getSyncMetrics();
expect(offlineMetrics.pendingChanges).toBeGreaterThan(0);

// Restore and verify recovery
await syncPage.syncUtils.goOnline();
await syncPage.waitForSyncComplete();

const recoveredMetrics = await syncPage.getSyncMetrics();
expect(recoveredMetrics.pendingChanges).toBe(0);
```

## Utilities API

### SyncTestUtils

#### IndexedDB Operations

- `clearIndexedDB()`: Delete all local databases
- `getTripsFromIndexedDB()`: Get all local trips
- `addTripToIndexedDB(trip)`: Add trip directly to IndexedDB
- `getPendingSyncChanges()`: Get unsynced changes
- `getSyncMetadata()`: Get last sync timestamp
- `setSyncMetadata(timestamp)`: Set sync timestamp

#### Supabase Operations

- `clearSupabaseTrips(userId?)`: Delete trips from server
- `addTripToSupabase(trip)`: Add trip directly to server
- `getTripsFromSupabase(userId)`: Get trips from server

#### Network Simulation

- `goOffline()`: Disable network connectivity
- `goOnline()`: Restore network connectivity

#### Sync Monitoring

- `waitForSyncCompletion(timeout)`: Wait for sync to finish
- `getSyncState()`: Get current Redux sync state
- `assertSyncState(expected)`: Assert sync state matches

#### Test Environment

- `setupCleanEnvironment(userId?)`: Clean setup for tests
- `createTestTrip(overrides)`: Generate test trip data

### Enhanced SyncPage ✨

#### UI Interactions (via composed page objects)

- `createTripThroughUI(title, description)`: Create trip using TripCreationPage
- `navigateToTrip(tripId)`: Navigate using TripsListPage
- `packItemThroughUI(itemName)`: Pack item using PackingListPage
- `packMultipleItemsThroughUI(itemNames)`: Pack multiple items efficiently

#### Sync-Specific Operations

- `waitForSyncInitialization()`: Wait for sync service startup
- `waitForSyncComplete()`: Wait for sync operations to finish
- `triggerManualSync()`: Force manual sync
- `isShowingOnlineStatus()`: Check online status in UI
- `getPendingChangesCount()`: Get pending changes count
- `getConflictsCount()`: Get conflicts count ✨ NEW
- `getSyncMetrics()`: Get comprehensive metrics ✨ NEW

#### Advanced Scenarios ✨ NEW

- `simulateConflictScenario(userId)`: Create conflict for testing
- `resolveConflictWithLocalStrategy(conflictId)`: Resolve with local preference
- `resolveConflictWithServerStrategy(conflictId)`: Resolve with server preference
- `simulateOfflineToOnlineSync()`: Complete offline workflow
- `simulateServerToClientSync(userId)`: Server-side data sync

## Best Practices

### 1. Page Object Composition ✨

```typescript
test('example sync test', async ({ page }) => {
  const syncPage = new SyncPage(page);

  // Access composed page objects directly
  await syncPage.tripsListPage.expectEmptyState();

  // Or use SyncPage's convenience methods
  await syncPage.createTripThroughUI('Test Trip', 'Description');

  // Sync-specific operations
  await syncPage.waitForSyncComplete();
  const metrics = await syncPage.getSyncMetrics();
});
```

### 2. Comprehensive Error Handling

```typescript
test('should handle sync errors gracefully', async ({ page }) => {
  try {
    await syncPage.packItemThroughUI('Non-existent Item');
  } catch (error) {
    console.log('Item not found in UI, using fallback approach');
    // Simulate the action directly if UI interaction fails
    await syncPage.page.evaluate(() => {
      // Fallback implementation
    });
  }
});
```

### 3. Performance Monitoring

```typescript
test('should monitor sync performance', async ({ page }) => {
  const startTime = Date.now();

  // Perform operations
  await performSyncOperations();

  const totalTime = Date.now() - startTime;
  const metrics = await syncPage.getSyncMetrics();

  // Performance assertions
  expect(totalTime).toBeLessThan(10000);
  expect(metrics.pendingChanges).toBe(0);

  console.log(`📊 Performance: ${totalTime}ms`, metrics);
});
```

### 4. Conflict Testing

```typescript
test('should handle conflicts intelligently', async ({ page }) => {
  // Create conflict scenario
  const { conflictId } = await syncPage.simulateConflictScenario(userId);

  // Verify conflict detection
  expect(await syncPage.getConflictsCount()).toBeGreaterThan(0);

  // Test different resolution strategies
  await syncPage.resolveConflictWithLocalStrategy(conflictId);
  expect(await syncPage.getConflictsCount()).toBe(0);
});
```

## Running the Tests

### All Sync Tests

```bash
pnpm nx e2e frontend-e2e --grep "sync"
```

### Specific Test Suites

```bash
# Original core sync tests
pnpm nx e2e frontend-e2e --grep "Sync Flow E2E Tests"

# Extended advanced sync tests
pnpm nx e2e frontend-e2e --grep "Extended Sync Flow E2E Tests"

# Integration demo tests
pnpm nx e2e frontend-e2e --grep "Sync Integration Demo Tests"

# Conflict resolution tests only
pnpm nx e2e frontend-e2e --grep "Conflict Resolution"

# Performance tests only
pnpm nx e2e frontend-e2e --grep "Performance and Reliability"
```

### Development Testing

```bash
# Run specific test with detailed output
pnpm nx e2e frontend-e2e --grep "should demonstrate end-to-end trip creation" --headed

# Debug mode with browser DevTools
pnpm nx e2e frontend-e2e --grep "sync" --debug
```

## Architecture Benefits

### Before Refactoring ❌

- SyncPage duplicated trip creation logic
- Hard to maintain UI interaction code
- Tests were tightly coupled to implementation details
- Limited reusability across test files

### After Refactoring ✅

- **Composition over Duplication**: SyncPage reuses existing page objects
- **Single Source of Truth**: UI interactions defined once in dedicated page objects
- **Better Maintainability**: Changes propagate automatically to all tests
- **Enhanced Testability**: Easy to test complex workflows by composing page objects
- **Clear Separation**: Sync concerns separate from UI interaction concerns
- **Future-Proof**: Easy to add new page objects and compose them with SyncPage

## Future Enhancements

### Planned Improvements

1. **Real-time Sync Testing**: WebSocket-based sync verification
2. **Advanced Conflict Resolution**: Three-way merge testing
3. **Performance Benchmarking**: Automated performance regression detection
4. **Visual Sync Testing**: Screenshot-based sync state verification
5. **Multi-Browser Sync**: Cross-browser sync consistency testing

### Extensibility

The refactored architecture makes it easy to:

- Add new page objects (e.g., `SettingsPage`, `ProfilePage`)
- Compose them with `SyncPage` for comprehensive sync testing
- Create specialized test utilities for specific scenarios
- Maintain backwards compatibility with existing tests

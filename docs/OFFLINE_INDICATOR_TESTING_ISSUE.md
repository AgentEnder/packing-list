# Offline Indicator Testing Issue

## Problem Statement

The offline status indicator is not showing up in e2e test environment when simulating offline conditions.

## Root Cause Analysis

### 1. Redux Store Not Exposed

- The Redux store is conditionally exposed in `packages/state/src/store.ts`
- The condition checks for `globalThis.window` which may not exist in the test environment
- Tests expect `window.__REDUX_STORE__` but it's not available

### 2. Sync State Flow

```
Browser Offline Event → ConnectivityService → SyncService → Redux State → UI Component
```

- The offline badge appears when `state.sync.syncState.isOnline === false`
- The `SyncStatusBadge` component correctly checks this state
- The SyncProvider subscribes to sync service and updates Redux

### 3. Test Infrastructure Limitations

- E2e tests cannot access Redux store to verify or modify sync state
- The `goOffline()` method in sync-test-utils.ts tries to:
  - Set browser context offline
  - Override navigator.onLine
  - Dispatch offline events
  - Update Redux state directly (fails because store not available)

## Attempted Solutions

1. **Direct Redux State Update**: Added code to update Redux sync state in `goOffline()` - fails because store not available
2. **Store Exposure Fix**: Modified store.ts to expose to window - still not working in test environment
3. **UI Element Fallback**: Modified `isShowingOfflineStatus()` to check Redux state as fallback

## Recommendations

### Short-term Solutions

1. **Mock at Component Level**: Instead of trying to simulate real offline conditions, mock the sync state at the component level for testing.

2. **Use Sync Demo Page**: The sync-demo page has explicit controls for testing sync states - use this for manual testing.

3. **API-Level Testing**: Test offline behavior by intercepting network requests rather than simulating browser offline state.

### Long-term Solutions

1. **Expose Redux Store for Testing**:

   ```typescript
   // In store.ts
   if (
     process.env.NODE_ENV === 'test' ||
     process.env.NODE_ENV === 'development'
   ) {
     if (typeof window !== 'undefined') {
       window.__REDUX_STORE__ = store;
     }
   }
   ```

2. **Create Test Utilities**:

   ```typescript
   // In SyncProvider
   if (process.env.NODE_ENV === 'test') {
     window.__SYNC_TEST_UTILS__ = {
       setOffline: () =>
         dispatch({
           type: 'SET_SYNC_STATE',
           payload: { ...syncState, isOnline: false },
         }),
       setOnline: () =>
         dispatch({
           type: 'SET_SYNC_STATE',
           payload: { ...syncState, isOnline: true },
         }),
     };
   }
   ```

3. **Use React Testing Library**: For component-level testing of sync states, use React Testing Library with mocked providers.

## Working Test Example

Instead of testing the actual offline indicator, test the sync functionality through API behavior:

```typescript
test('should handle offline data creation', async ({ page }) => {
  // Create data while online
  const onlineData = await createTestData();

  // Intercept network requests to simulate offline
  await page.route('**/api/**', (route) => route.abort());

  // Create data "offline" (will fail to sync)
  const offlineData = await createTestData();

  // Restore network
  await page.unroute('**/api/**');

  // Verify data syncs when back online
  await waitForSync();
  await verifyDataSynced(offlineData);
});
```

## Conclusion

The offline indicator not showing in tests is due to architectural limitations in how the Redux store is exposed to the test environment. While we've implemented fixes to the sync test utilities, the fundamental issue requires changes to how the application initializes its Redux store in test environments.

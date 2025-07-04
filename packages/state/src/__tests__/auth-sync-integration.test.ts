import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  seedIndexedDB,
  mockSupabase,
  createIntegrationStore,
} from './integration-helpers.js';
import { loadOfflineState } from '../offline-hydration.js';
import { closeDatabase } from '@packing-list/offline-storage';
import authReducer, { authSlice } from '@packing-list/auth-state';

mockSupabase();

beforeEach(async () => {
  await seedIndexedDB({});
});

afterEach(async () => {
  await closeDatabase();
});

describe('Auth state changes during sync', () => {
  it('maintains sign-out state while sync thunk resolves', async () => {
    const store = createIntegrationStore({
      auth: authReducer(undefined, { type: 'init' }),
    });

    const syncPromise = store.dispatch(
      (dispatch: any) =>
        new Promise((resolve) => {
          setTimeout(() => {
            dispatch({
              type: 'SET_SYNC_STATE',
              payload: {
                syncState: {
                  lastSyncTimestamp: Date.now(),
                  pendingChanges: [],
                  isOnline: true,
                  isSyncing: false,
                  conflicts: [],
                },
              },
            });
            resolve(true);
          }, 50);
        })
    ) as Promise<any>;

    store.dispatch(authSlice.actions.updateAuthState({ user: null }));
    await syncPromise;

    expect(store.getState().auth.user).toBeNull();
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  seedIndexedDB,
  mockSupabase,
  createIntegrationStore,
} from './integration-helpers.js';
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
      (dispatch: (action: { type: string; payload?: unknown }) => void) =>
        new Promise<boolean>((resolve) => {
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
    ) as Promise<boolean>;

    store.dispatch(authSlice.actions.updateAuthState({ user: null }));
    await syncPromise;

    expect(store.getState().auth.user).toBeNull();
  });
});
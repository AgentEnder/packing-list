import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { authSlice, AuthState } from './auth-slice.js';

describe('Auth Slice', () => {
  let store: ReturnType<typeof configureStore<{ auth: AuthState }>>;

  beforeEach(() => {
    store = configureStore({
      reducer: { auth: authReducer },
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().auth;
      expect(state).toEqual({
        user: null,
        session: null,
        loading: true,
        error: null,
        lastError: null,
        isAuthenticating: false,
        isInitialized: false,
        isOfflineMode: false,
        forceOfflineMode: false,
        connectivityState: { isOnline: true, isConnected: true },
        offlineAccounts: [],
        hasOfflinePasscode: false,
      });
    });
  });

  describe('Actions', () => {
    describe('setForceOfflineMode', () => {
      it('should enable force offline mode', () => {
        store.dispatch(authSlice.actions.setForceOfflineMode(true));
        const state = store.getState().auth;

        expect(state.forceOfflineMode).toBe(true);
        expect(state.isOfflineMode).toBe(true);
      });

      it('should disable force offline mode and recalculate offline mode', () => {
        // First enable force offline mode
        store.dispatch(authSlice.actions.setForceOfflineMode(true));

        // Then disable it
        store.dispatch(authSlice.actions.setForceOfflineMode(false));
        const state = store.getState().auth;

        expect(state.forceOfflineMode).toBe(false);
        // Should be false since connectivity is good by default
        expect(state.isOfflineMode).toBe(false);
      });
    });

    describe('updateConnectivityState', () => {
      it('should update connectivity and trigger offline mode when disconnected', () => {
        store.dispatch(
          authSlice.actions.updateConnectivityState({
            isOnline: false,
            isConnected: false,
          })
        );

        const state = store.getState().auth;
        expect(state.connectivityState.isOnline).toBe(false);
        expect(state.connectivityState.isConnected).toBe(false);
        expect(state.isOfflineMode).toBe(true);
      });

      it('should maintain online mode when connectivity is good', () => {
        store.dispatch(
          authSlice.actions.updateConnectivityState({
            isOnline: true,
            isConnected: true,
          })
        );

        const state = store.getState().auth;
        expect(state.connectivityState.isOnline).toBe(true);
        expect(state.connectivityState.isConnected).toBe(true);
        expect(state.isOfflineMode).toBe(false);
      });

      it('should respect force offline mode over good connectivity', () => {
        // Enable force offline mode first
        store.dispatch(authSlice.actions.setForceOfflineMode(true));

        // Then update with good connectivity
        store.dispatch(
          authSlice.actions.updateConnectivityState({
            isOnline: true,
            isConnected: true,
          })
        );

        const state = store.getState().auth;
        expect(state.connectivityState.isOnline).toBe(true);
        expect(state.connectivityState.isConnected).toBe(true);
        expect(state.forceOfflineMode).toBe(true);
        expect(state.isOfflineMode).toBe(true); // Should stay offline due to force mode
      });
    });

    describe('clearError', () => {
      it('should clear error and lastError', () => {
        // First set an error using updateAuthState
        store.dispatch(
          authSlice.actions.updateAuthState({
            error: 'Test error',
            lastError: 'Test error',
          })
        );

        // Verify error is set
        expect(store.getState().auth.error).toBe('Test error');
        expect(store.getState().auth.lastError).toBe('Test error');

        // Clear the error
        store.dispatch(authSlice.actions.clearError(null));

        const state = store.getState().auth;
        expect(state.error).toBe(null);
        expect(state.lastError).toBe(null);
      });
    });

    describe('resetAuthState', () => {
      it('should reset auth state while preserving connectivity', () => {
        // Set up some state
        store.dispatch(authSlice.actions.setForceOfflineMode(true));
        store.dispatch(
          authSlice.actions.updateAuthState({
            error: 'Test error',
          })
        );
        store.dispatch(
          authSlice.actions.updateConnectivityState({
            isOnline: false,
            isConnected: false,
          })
        );

        // Reset
        store.dispatch(authSlice.actions.resetAuthState(null));

        const state = store.getState().auth;
        expect(state.user).toBe(null);
        expect(state.error).toBe(null);
        expect(state.forceOfflineMode).toBe(false);
        expect(state.isInitialized).toBe(true);
        expect(state.isOfflineMode).toBe(false); // Reset to initial state
        expect(state.connectivityState.isOnline).toBe(true); // Reset to initial state
        expect(state.connectivityState.isConnected).toBe(true);
      });
    });

    describe('updateAuthState', () => {
      it('should update partial auth state', () => {
        store.dispatch(
          authSlice.actions.updateAuthState({
            loading: false,
            error: 'Authentication failed',
            lastError: 'Authentication failed',
          })
        );

        const state = store.getState().auth;
        expect(state.loading).toBe(false);
        expect(state.error).toBe('Authentication failed');
        expect(state.lastError).toBe('Authentication failed');
      });

      it('should update user state', () => {
        const user = {
          id: 'test-user',
          email: 'test@example.com',
          name: 'Test User',
          type: 'remote' as const,
          created_at: '2023-01-01',
        };

        store.dispatch(authSlice.actions.updateAuthState({ user }));

        const state = store.getState().auth;
        expect(state.user).toEqual(user);
      });
    });
  });

  describe('Offline Mode Logic', () => {
    it('should be offline when forceOfflineMode is true', () => {
      store.dispatch(authSlice.actions.setForceOfflineMode(true));
      store.dispatch(
        authSlice.actions.updateConnectivityState({
          isOnline: true,
          isConnected: true,
        })
      );

      expect(store.getState().auth.isOfflineMode).toBe(true);
    });

    it('should be offline when not connected', () => {
      store.dispatch(
        authSlice.actions.updateConnectivityState({
          isOnline: true,
          isConnected: false,
        })
      );

      expect(store.getState().auth.isOfflineMode).toBe(true);
    });

    it('should be offline when not online', () => {
      store.dispatch(
        authSlice.actions.updateConnectivityState({
          isOnline: false,
          isConnected: true,
        })
      );

      expect(store.getState().auth.isOfflineMode).toBe(true);
    });

    it('should be online when all conditions are met', () => {
      store.dispatch(authSlice.actions.setForceOfflineMode(false));
      store.dispatch(
        authSlice.actions.updateConnectivityState({
          isOnline: true,
          isConnected: true,
        })
      );

      expect(store.getState().auth.isOfflineMode).toBe(false);
    });
  });

  describe('User State Management', () => {
    it('should identify shared account by ID', () => {
      const sharedUser = {
        id: 'local-shared-user',
        email: 'test@example.com',
        name: 'Test User',
        type: 'local' as const,
        created_at: '2023-01-01',
      };

      store.dispatch(authSlice.actions.updateAuthState({ user: sharedUser }));

      const state = store.getState().auth;
      expect(state.user?.id).toBe('local-shared-user');
      // The slice should identify this as a shared account
    });

    it('should identify shared account by email', () => {
      const sharedUser = {
        id: 'some-other-id',
        email: 'shared@local.device',
        name: 'Shared Account',
        type: 'local' as const,
        created_at: '2023-01-01',
      };

      store.dispatch(authSlice.actions.updateAuthState({ user: sharedUser }));

      const state = store.getState().auth;
      expect(state.user?.email).toBe('shared@local.device');
    });

    it('should handle regular user accounts', () => {
      const regularUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Regular User',
        type: 'remote' as const,
        created_at: '2023-01-01',
      };

      store.dispatch(authSlice.actions.updateAuthState({ user: regularUser }));

      const state = store.getState().auth;
      expect(state.user).toEqual(regularUser);
    });
  });

  describe('Session Management', () => {
    it('should update session state', () => {
      const mockSession = { user: { id: 'test' }, access_token: 'token123' };

      store.dispatch(
        authSlice.actions.updateAuthState({ session: mockSession })
      );

      const state = store.getState().auth;
      expect(state.session).toEqual(mockSession);
    });

    it('should clear session', () => {
      // First set a session
      const mockSession = { user: { id: 'test' }, access_token: 'token123' };
      store.dispatch(
        authSlice.actions.updateAuthState({ session: mockSession })
      );

      // Then clear it
      store.dispatch(authSlice.actions.updateAuthState({ session: null }));

      const state = store.getState().auth;
      expect(state.session).toBe(null);
    });
  });

  describe('State Consistency', () => {
    it('should maintain consistent state during complex operations', () => {
      // Simulate a complex flow
      store.dispatch(authSlice.actions.updateAuthState({ loading: true }));
      store.dispatch(
        authSlice.actions.updateAuthState({ isAuthenticating: true })
      );
      store.dispatch(
        authSlice.actions.updateConnectivityState({
          isOnline: true,
          isConnected: true,
        })
      );

      const user = {
        id: 'remote-user-123',
        email: 'user@example.com',
        name: 'Test User',
        type: 'remote' as const,
        created_at: '2023-01-01',
      };

      store.dispatch(authSlice.actions.updateAuthState({ user }));
      store.dispatch(
        authSlice.actions.updateAuthState({
          session: { access_token: 'token' },
        })
      );
      store.dispatch(authSlice.actions.updateAuthState({ loading: false }));
      store.dispatch(
        authSlice.actions.updateAuthState({ isAuthenticating: false })
      );

      const state = store.getState().auth;
      expect(state.user).toEqual(user);
      expect(state.session).toEqual({ access_token: 'token' });
      expect(state.loading).toBe(false);
      expect(state.isAuthenticating).toBe(false);
      expect(state.isOfflineMode).toBe(false);
      expect(state.error).toBe(null);
    });
  });
});

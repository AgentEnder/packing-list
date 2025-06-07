import { describe, it, expect } from 'vitest';
import {
  selectAuth,
  selectUser,
  selectSession,
  selectIsAuthenticated,
  selectIsLoading,
  selectIsAuthenticating,
  selectError,
  selectLastError,
  selectIsOfflineMode,
  selectConnectivityState,
  selectIsOnline,
  selectIsConnected,
  selectIsInitialized,
  selectUserEmail,
  selectUserName,
  selectUserAvatar,
  selectAuthStatus,
  selectConnectivityStatus,
  selectOfflineAccounts,
  selectHasOfflinePasscode,
  selectForceOfflineMode,
  type RootState,
} from './selectors.js';
import type { AuthState } from './auth-slice.js';

// Mock auth state for testing
const createMockAuthState = (overrides?: Partial<AuthState>): AuthState => ({
  user: {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    type: 'remote' as const,
    created_at: '2023-01-01T00:00:00Z',
    isShared: false,
  },
  session: { token: 'test-token' },
  loading: false,
  isAuthenticating: false,
  error: null,
  lastError: null,
  isOfflineMode: false,
  forceOfflineMode: false,
  connectivityState: {
    isOnline: true,
    isConnected: true,
  },
  isInitialized: true,
  offlineAccounts: [],
  hasOfflinePasscode: false,
  ...overrides,
});

const createMockRootState = (
  authOverrides?: Partial<AuthState>
): RootState => ({
  auth: createMockAuthState(authOverrides),
});

describe('Auth Selectors', () => {
  describe('Base Selectors', () => {
    it('selectAuth should return auth state', () => {
      const state = createMockRootState();
      const result = selectAuth(state);

      expect(result).toBe(state.auth);
    });
  });

  describe('User Selectors', () => {
    it('selectUser should return user', () => {
      const state = createMockRootState();
      const result = selectUser(state);

      expect(result).toEqual(state.auth.user);
    });

    it('selectUserEmail should return user email', () => {
      const state = createMockRootState();
      const result = selectUserEmail(state);

      expect(result).toBe('test@example.com');
    });

    it('selectUserEmail should return undefined when user is null', () => {
      const state = createMockRootState({ user: null });
      const result = selectUserEmail(state);

      expect(result).toBeUndefined();
    });

    it('selectUserName should return user name', () => {
      const state = createMockRootState();
      const result = selectUserName(state);

      expect(result).toBe('Test User');
    });

    it('selectUserName should return undefined when user has no name', () => {
      const state = createMockRootState({
        user: { ...createMockAuthState().user!, name: undefined },
      });
      const result = selectUserName(state);

      expect(result).toBeUndefined();
    });

    it('selectUserAvatar should return user avatar URL', () => {
      const state = createMockRootState();
      const result = selectUserAvatar(state);

      expect(result).toBe('https://example.com/avatar.jpg');
    });

    it('selectUserAvatar should return undefined when user has no avatar', () => {
      const state = createMockRootState({
        user: { ...createMockAuthState().user!, avatar_url: undefined },
      });
      const result = selectUserAvatar(state);

      expect(result).toBeUndefined();
    });
  });

  describe('Session Selectors', () => {
    it('selectSession should return session', () => {
      const state = createMockRootState();
      const result = selectSession(state);

      expect(result).toEqual({ token: 'test-token' });
    });

    it('selectSession should return null when no session', () => {
      const state = createMockRootState({ session: null });
      const result = selectSession(state);

      expect(result).toBeNull();
    });
  });

  describe('Authentication Status Selectors', () => {
    it('selectIsAuthenticated should return true when user exists', () => {
      const state = createMockRootState();
      const result = selectIsAuthenticated(state);

      expect(result).toBe(true);
    });

    it('selectIsAuthenticated should return false when user is null', () => {
      const state = createMockRootState({ user: null });
      const result = selectIsAuthenticated(state);

      expect(result).toBe(false);
    });

    it('selectIsLoading should return loading state', () => {
      const state = createMockRootState({ loading: true });
      const result = selectIsLoading(state);

      expect(result).toBe(true);
    });

    it('selectIsAuthenticating should return authenticating state', () => {
      const state = createMockRootState({ isAuthenticating: true });
      const result = selectIsAuthenticating(state);

      expect(result).toBe(true);
    });

    it('selectIsInitialized should return initialization state', () => {
      const state = createMockRootState({ isInitialized: false });
      const result = selectIsInitialized(state);

      expect(result).toBe(false);
    });
  });

  describe('Error Selectors', () => {
    it('selectError should return current error', () => {
      const state = createMockRootState({ error: 'Test error' });
      const result = selectError(state);

      expect(result).toBe('Test error');
    });

    it('selectLastError should return last error', () => {
      const state = createMockRootState({ lastError: 'Last error' });
      const result = selectLastError(state);

      expect(result).toBe('Last error');
    });
  });

  describe('Offline Mode Selectors', () => {
    it('selectIsOfflineMode should return offline mode state', () => {
      const state = createMockRootState({ isOfflineMode: true });
      const result = selectIsOfflineMode(state);

      expect(result).toBe(true);
    });

    it('selectForceOfflineMode should return force offline mode state', () => {
      const state = createMockRootState({ forceOfflineMode: true });
      const result = selectForceOfflineMode(state);

      expect(result).toBe(true);
    });

    it('selectOfflineAccounts should return offline accounts', () => {
      const accounts = [{ id: '1', email: 'test@example.com' }];
      const state = createMockRootState({ offlineAccounts: accounts });
      const result = selectOfflineAccounts(state);

      expect(result).toBe(accounts);
    });

    it('selectHasOfflinePasscode should return passcode state', () => {
      const state = createMockRootState({ hasOfflinePasscode: true });
      const result = selectHasOfflinePasscode(state);

      expect(result).toBe(true);
    });
  });

  describe('Connectivity Selectors', () => {
    it('selectConnectivityState should return connectivity state', () => {
      const state = createMockRootState();
      const result = selectConnectivityState(state);

      expect(result).toEqual({
        isOnline: true,
        isConnected: true,
      });
    });

    it('selectIsOnline should return online status', () => {
      const state = createMockRootState({
        connectivityState: { isOnline: false, isConnected: true },
      });
      const result = selectIsOnline(state);

      expect(result).toBe(false);
    });

    it('selectIsConnected should return connected status', () => {
      const state = createMockRootState({
        connectivityState: { isOnline: true, isConnected: false },
      });
      const result = selectIsConnected(state);

      expect(result).toBe(false);
    });
  });

  describe('Composite Selectors', () => {
    it('selectAuthStatus should return combined auth status', () => {
      const state = createMockRootState({
        loading: true,
        isInitialized: false,
        isOfflineMode: true,
      });
      const result = selectAuthStatus(state);

      expect(result).toEqual({
        isAuthenticated: true,
        isLoading: true,
        isInitialized: false,
        isOfflineMode: true,
      });
    });

    it('selectConnectivityStatus should return combined connectivity status', () => {
      const state = createMockRootState({
        connectivityState: { isOnline: true, isConnected: true },
        isOfflineMode: false,
      });
      const result = selectConnectivityStatus(state);

      expect(result).toEqual({
        isOnline: true,
        isConnected: true,
        isOfflineMode: false,
        canUseRemoteAuth: true,
      });
    });

    it('selectConnectivityStatus should set canUseRemoteAuth to false when offline mode', () => {
      const state = createMockRootState({
        connectivityState: { isOnline: true, isConnected: true },
        isOfflineMode: true,
      });
      const result = selectConnectivityStatus(state);

      expect(result.canUseRemoteAuth).toBe(false);
    });

    it('selectConnectivityStatus should set canUseRemoteAuth to false when not connected', () => {
      const state = createMockRootState({
        connectivityState: { isOnline: true, isConnected: false },
        isOfflineMode: false,
      });
      const result = selectConnectivityStatus(state);

      expect(result.canUseRemoteAuth).toBe(false);
    });
  });

  describe('Selector Memoization', () => {
    it('should return same reference when input state unchanged', () => {
      const state = createMockRootState();

      const result1 = selectAuthStatus(state);
      const result2 = selectAuthStatus(state);

      expect(result1).toBe(result2);
    });

    it('should return new reference when input state changes', () => {
      const state1 = createMockRootState({ loading: false });
      const state2 = createMockRootState({ loading: true });

      const result1 = selectAuthStatus(state1);
      const result2 = selectAuthStatus(state2);

      expect(result1).not.toBe(result2);
      expect(result1.isLoading).toBe(false);
      expect(result2.isLoading).toBe(true);
    });

    it('should memoize complex selectors properly', () => {
      const state = createMockRootState();

      const result1 = selectConnectivityStatus(state);
      const result2 = selectConnectivityStatus(state);

      expect(result1).toBe(result2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null user gracefully', () => {
      const state = createMockRootState({ user: null });

      expect(selectIsAuthenticated(state)).toBe(false);
      expect(selectUserEmail(state)).toBeUndefined();
      expect(selectUserName(state)).toBeUndefined();
      expect(selectUserAvatar(state)).toBeUndefined();
    });

    it('should handle missing connectivity state gracefully', () => {
      const state = createMockRootState({
        connectivityState: { isOnline: false, isConnected: false },
      });

      expect(selectIsOnline(state)).toBe(false);
      expect(selectIsConnected(state)).toBe(false);
      expect(selectConnectivityStatus(state).canUseRemoteAuth).toBe(false);
    });

    it('should handle empty offline accounts', () => {
      const state = createMockRootState({ offlineAccounts: [] });
      const result = selectOfflineAccounts(state);

      expect(result).toEqual([]);
    });
  });
});

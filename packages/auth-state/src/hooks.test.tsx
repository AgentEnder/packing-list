import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { authSlice, type AuthState } from './auth-slice.js';
import {
  useAuth,
  useAuthInitializer,
  useAuthUser,
  useAuthSession,
  useIsAuthenticated,
  useAuthLoading,
  useAuthError,
  useIsOfflineMode,
  useConnectivityState,
  useAuthStatus,
  useConnectivityStatus,
} from './hooks.js';
import React from 'react';

// Mock all auth services at the module level
vi.mock('@packing-list/auth', () => {
  const mockAuthService = {
    subscribe: vi.fn(() => vi.fn()),
    isRemotelyAuthenticated: vi.fn(() => false),
    signOut: vi.fn(async () => ({})),
    getState: vi.fn(() => ({
      user: null,
      session: null,
      loading: false,
      error: null,
    })),
  };

  const mockLocalAuthService = {
    subscribe: vi.fn(() => vi.fn()),
    signOut: vi.fn(async () => ({})),
    signInWithoutPassword: vi.fn(async () => ({
      user: { id: 'local-shared-user' },
    })),
    getLocalUsers: vi.fn(async () => []),
    getState: vi.fn(() => ({
      user: null,
      session: null,
      loading: false,
      error: null,
    })),
  };

  const mockConnectivityService = {
    subscribe: vi.fn(() => vi.fn()),
    getState: vi.fn(() => ({
      isOnline: true,
      isConnected: true,
    })),
  };

  return {
    authService: mockAuthService,
    LocalAuthService: vi.fn().mockImplementation(() => mockLocalAuthService),
    ConnectivityService: vi
      .fn()
      .mockImplementation(() => mockConnectivityService),
    getConnectivityService: vi.fn(() => mockConnectivityService),
  };
});

vi.mock('@packing-list/auth/src/connectivity.js', () => ({
  getConnectivityService: vi.fn(() => ({
    subscribe: vi.fn(() => vi.fn()),
    getState: vi.fn(() => ({
      isOnline: true,
      isConnected: true,
    })),
  })),
}));

// Create a test store
const createTestStore = (preloadedState?: { auth: AuthState }) => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
    },
    preloadedState,
  });
};

const createMockAuthState = (
  overrides: Partial<AuthState> = {}
): AuthState => ({
  user: {
    id: 'test-user',
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

// Wrapper component for tests
const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Couldn't get ts to be happy here.
  const TestWrapper: React.FC<{ children: any }> = ({ children }) => (
    <Provider store={store}>{children}</Provider>
  );
  return TestWrapper;
};

describe('Auth Hooks', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createTestStore({
      auth: createMockAuthState(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useAuth', () => {
    it('should return auth state and actions', () => {
      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Check state values - should use actual store state, not SSR fallbacks
      expect(result.current.user).toBeDefined();
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.loading).toBe(false); // Store state loading is false
      expect(result.current.signInWithGooglePopup).toBeInstanceOf(Function);
      expect(result.current.signOut).toBeInstanceOf(Function);
    });

    it('should show sign-in options for shared account', () => {
      const storeWithSharedUser = createTestStore({
        auth: createMockAuthState({
          user: {
            id: 'local-shared-user',
            email: 'shared@local.device',
            name: 'Shared Account',
            type: 'local' as const,
            created_at: '2023-01-01T00:00:00Z',
            isShared: true,
          },
        }),
      });

      const wrapper = createWrapper(storeWithSharedUser);
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.shouldShowSignInOptions).toBe(true);
    });

    it('should not show sign-in options for authenticated personal account', () => {
      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.shouldShowSignInOptions).toBe(false);
    });

    it('should show sign-in options when no user', () => {
      const storeWithNoUser = createTestStore({
        auth: createMockAuthState({ user: null }),
      });

      const wrapper = createWrapper(storeWithNoUser);
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.shouldShowSignInOptions).toBe(true);
    });

    it('should dispatch actions correctly', () => {
      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Test that actions are callable
      expect(() => result.current.signInWithGooglePopup()).not.toThrow();
      expect(() => result.current.signOut()).not.toThrow();
      expect(() => result.current.clearError()).not.toThrow();
      expect(() => result.current.setForceOfflineMode(true)).not.toThrow();
    });
  });

  describe('useAuthInitializer', () => {
    it('should initialize auth without returning any values', () => {
      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useAuthInitializer(), { wrapper });

      // useAuthInitializer should not return anything
      expect(result.current).toBeUndefined();
    });

    it('should handle SSR environment gracefully', () => {
      // Mock SSR environment
      const originalEnv = (import.meta as { env: Record<string, unknown> }).env;
      (import.meta as { env: Record<string, unknown> }).env = { SSR: true };

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useAuthInitializer(), { wrapper });

      // Should not throw in SSR
      expect(result.current).toBeUndefined();

      // Restore environment
      (import.meta as { env: Record<string, unknown> }).env = originalEnv;
    });
  });

  describe('Individual Selector Hooks', () => {
    it('useAuthUser should return user', () => {
      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useAuthUser(), { wrapper });

      expect(result.current).toEqual(store.getState().auth.user);
    });

    it('useAuthSession should return session', () => {
      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useAuthSession(), { wrapper });

      expect(result.current).toEqual(store.getState().auth.session);
    });

    it('useIsAuthenticated should return authentication status', () => {
      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useIsAuthenticated(), { wrapper });

      expect(result.current).toBe(true);
    });

    it('useIsAuthenticated should return false when no user', () => {
      const storeWithNoUser = createTestStore({
        auth: createMockAuthState({ user: null }),
      });

      const wrapper = createWrapper(storeWithNoUser);
      const { result } = renderHook(() => useIsAuthenticated(), { wrapper });

      expect(result.current).toBe(false);
    });

    it('useAuthLoading should return loading state', () => {
      const storeWithLoading = createTestStore({
        auth: createMockAuthState({ loading: true }),
      });

      const wrapper = createWrapper(storeWithLoading);
      const { result } = renderHook(() => useAuthLoading(), { wrapper });

      expect(result.current).toBe(true);
    });

    it('useAuthError should return error state', () => {
      const storeWithError = createTestStore({
        auth: createMockAuthState({ error: 'Test error' }),
      });

      const wrapper = createWrapper(storeWithError);
      const { result } = renderHook(() => useAuthError(), { wrapper });

      expect(result.current).toBe('Test error');
    });

    it('useIsOfflineMode should return offline mode state', () => {
      const storeWithOfflineMode = createTestStore({
        auth: createMockAuthState({ isOfflineMode: true }),
      });

      const wrapper = createWrapper(storeWithOfflineMode);
      const { result } = renderHook(() => useIsOfflineMode(), { wrapper });

      expect(result.current).toBe(true);
    });

    it('useConnectivityState should return connectivity state', () => {
      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useConnectivityState(), { wrapper });

      expect(result.current).toEqual({
        isOnline: true,
        isConnected: true,
      });
    });

    it('useAuthStatus should return combined auth status', () => {
      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useAuthStatus(), { wrapper });

      expect(result.current).toMatchObject({
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        isOfflineMode: false,
      });
    });

    it('useConnectivityStatus should return connectivity status', () => {
      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useConnectivityStatus(), { wrapper });

      expect(result.current).toMatchObject({
        isOnline: true,
        isConnected: true,
        isOfflineMode: false,
        canUseRemoteAuth: true,
      });
    });
  });

  describe('State Updates', () => {
    it('should react to store state changes', () => {
      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(false); // Initial store state loading is false

      // Update store state using a proper action
      act(() => {
        store.dispatch(authSlice.actions.updateAuthState({ loading: true }));
      });

      // Hook should reflect the new state
      expect(result.current.loading).toBe(true);
    });
  });

  describe('Memoization', () => {
    it('should memoize shouldShowSignInOptions correctly', () => {
      const wrapper = createWrapper(store);
      const { result, rerender } = renderHook(() => useAuth(), { wrapper });

      const firstValue = result.current.shouldShowSignInOptions;

      // Rerender without changing user
      rerender();

      const secondValue = result.current.shouldShowSignInOptions;
      expect(firstValue).toBe(secondValue);
    });

    it('should update shouldShowSignInOptions when user changes', () => {
      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.shouldShowSignInOptions).toBe(false);

      // Change to shared user
      act(() => {
        store.dispatch(
          authSlice.actions.updateAuthState({
            user: {
              id: 'local-shared-user',
              email: 'shared@local.device',
              name: 'Shared Account',
              type: 'local' as const,
              created_at: '2023-01-01T00:00:00Z',
              isShared: true,
            },
          })
        );
      });

      expect(result.current.shouldShowSignInOptions).toBe(true);
    });
  });
});
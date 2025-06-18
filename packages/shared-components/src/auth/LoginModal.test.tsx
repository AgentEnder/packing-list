import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore, UnknownAction } from '@reduxjs/toolkit';
import { authSlice, type AuthState } from '@packing-list/auth-state';
import { useLoginModal } from './useLoginModal.js';
import React from 'react';

// Mock import.meta.env to ensure SSR is false
Object.defineProperty(globalThis, 'import.meta', {
  value: {
    env: {
      SSR: false,
    },
  },
});

// Mock auth services
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

// Mock connectivity service separately
vi.mock('@packing-list/connectivity', () => ({
  getConnectivityService: vi.fn(() => ({
    subscribe: vi.fn(() => vi.fn()),
    getState: vi.fn(() => ({
      isOnline: true,
      isConnected: true,
    })),
  })),
}));

// Create a test store with both auth and ui state
const createTestStore = (preloadedState?: {
  auth: AuthState;
  ui: { loginModal: { isOpen: boolean } };
}) => {
  // Simple reducer for UI state
  const uiReducer = (
    state = { loginModal: { isOpen: false } },
    action: UnknownAction
  ) => {
    switch (action.type) {
      case 'OPEN_LOGIN_MODAL':
        return {
          ...state,
          loginModal: { isOpen: true },
        };
      case 'CLOSE_LOGIN_MODAL':
        return {
          ...state,
          loginModal: { isOpen: false },
        };
      default:
        return state;
    }
  };

  return configureStore({
    reducer: {
      auth: authSlice.reducer,
      ui: uiReducer,
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
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return TestWrapper;
};

describe('LoginModal Integration', () => {
  describe('useLoginModal hook', () => {
    it('should open and close login modal', () => {
      const store = createTestStore({
        auth: createMockAuthState(),
        ui: { loginModal: { isOpen: false } },
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useLoginModal(), { wrapper });

      // Initially closed
      expect(store.getState().ui.loginModal.isOpen).toBe(false);

      // Open modal
      act(() => {
        result.current.openLoginModal();
      });

      expect(store.getState().ui.loginModal.isOpen).toBe(true);

      // Close modal
      act(() => {
        result.current.closeLoginModal();
      });

      expect(store.getState().ui.loginModal.isOpen).toBe(false);
    });
  });
});

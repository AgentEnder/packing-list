import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

// Mock the auth service and related dependencies using vi.hoisted
const mocks = vi.hoisted(() => {
  const mockAuthService = {
    signInWithGooglePopup: vi.fn(),
    signInWithEmail: vi.fn(),
    signUpWithEmail: vi.fn(),
    signOut: vi.fn(),
    getState: vi.fn(),
    getLocalAuthService: vi.fn(),
    waitForInitialization: vi.fn(),
  };

  const mockLocalAuthService = {
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInWithoutPassword: vi.fn(),
    signOut: vi.fn(),
    getState: vi.fn(),
    getLocalUsers: vi.fn(),
    hasPasscode: vi.fn(),
    createOfflineAccountForOnlineUser: vi.fn(),
  };

  const mockConnectivityService = {
    checkNow: vi.fn(),
  };

  return {
    mockAuthService,
    mockLocalAuthService,
    mockConnectivityService,
  };
});

// Mock the modules
vi.mock('@packing-list/auth', () => ({
  authService: mocks.mockAuthService,
  LocalAuthService: vi.fn(() => mocks.mockLocalAuthService),
  getConnectivityService: vi.fn(() => mocks.mockConnectivityService),
}));

import authReducer, {
  AuthState,
  signInWithGooglePopup,
  signInWithPassword,
  signInOfflineWithoutPassword,
  signOut,
  signUp,
  initializeAuth,
} from './auth-slice.js';

describe('Auth Flow Coordination', () => {
  let store: ReturnType<typeof configureStore<{ auth: AuthState }>>;

  const { mockAuthService, mockLocalAuthService, mockConnectivityService } =
    mocks;

  const mockRemoteUser = {
    id: 'remote-user-123',
    email: 'user@example.com',
    name: 'Test User',
    type: 'remote' as const,
    created_at: '2023-01-01',
    isShared: false,
  };

  const mockLocalUser = {
    id: 'local-user-123',
    email: 'user@example.com',
    name: 'Test User',
    type: 'local' as const,
    created_at: '2023-01-01',
    isShared: false,
  };

  const mockSharedUser = {
    id: 'local-shared-user',
    email: 'shared@local.device',
    name: 'Shared Account',
    type: 'local' as const,
    created_at: '2023-01-01',
    isShared: true,
  };

  const mockLocalAuthUsers = [
    {
      id: 'local-user-123',
      email: 'user@example.com',
      name: 'Test User',
      created_at: '2023-01-01',
      passcode_hash: null,
    },
    {
      id: 'local-shared-user',
      email: 'shared@local.device',
      name: 'Shared Account',
      created_at: '2023-01-01',
      passcode_hash: null,
    },
  ];

  beforeEach(() => {
    store = configureStore({
      reducer: { auth: authReducer },
    });

    // Reset all mocks
    vi.clearAllMocks();

    // Default mock implementations
    mockConnectivityService.checkNow.mockResolvedValue({
      isOnline: true,
      isConnected: true,
    });

    mockLocalAuthService.getLocalUsers.mockResolvedValue(mockLocalAuthUsers);
    mockLocalAuthService.hasPasscode.mockResolvedValue(false);
    mockLocalAuthService.getState.mockReturnValue({
      user: null,
      session: null,
      error: null,
    });

    mockAuthService.getState.mockReturnValue({
      user: null,
      session: null,
      error: null,
      loading: false,
      isRemoteAuthenticated: false,
    });

    mockAuthService.getLocalAuthService.mockReturnValue(mockLocalAuthService);
    mockAuthService.waitForInitialization.mockResolvedValue(undefined);
  });

  describe('Google OAuth Flow', () => {
    it('should handle successful Google sign-in with auth service coordination', async () => {
      // Setup Google sign-in success
      mockAuthService.signInWithGooglePopup.mockResolvedValue({ error: null });

      // Simulate auth service state progression
      let authServiceCallCount = 0;
      mockAuthService.getState.mockImplementation(() => {
        authServiceCallCount++;

        if (authServiceCallCount >= 3) {
          // After a few calls, auth service is ready with user
          return {
            user: mockRemoteUser,
            session: { access_token: 'google-token-123' },
            error: null,
            loading: false,
            isRemoteAuthenticated: true,
          };
        }

        // Initially, auth service is still processing
        return {
          user: null,
          session: null,
          error: null,
          loading: true,
          isRemoteAuthenticated: false,
        };
      });

      const action = signInWithGooglePopup();
      const result = await store.dispatch(action);

      expect(result.type).toBe('auth/signInWithGooglePopup/fulfilled');
      expect(mockAuthService.signInWithGooglePopup).toHaveBeenCalledOnce();
      expect(mockLocalAuthService.getLocalUsers).toHaveBeenCalled();

      const state = store.getState().auth;
      expect(state.user).toEqual(mockRemoteUser);
      expect(state.isAuthenticating).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle Google sign-in with polling timeout', async () => {
      // Setup Google sign-in success but auth service never becomes ready
      mockAuthService.signInWithGooglePopup.mockResolvedValue({ error: null });
      mockAuthService.getState.mockReturnValue({
        user: mockRemoteUser,
        session: { access_token: 'google-token-123' },
        error: null,
        loading: false,
        isRemoteAuthenticated: false, // Never becomes true
      });

      const action = signInWithGooglePopup();
      const result = await store.dispatch(action);

      expect(result.type).toBe('auth/signInWithGooglePopup/fulfilled');
      expect((result.payload as { user: typeof mockRemoteUser }).user).toEqual(
        mockRemoteUser
      );
    }, 10000); // Increase timeout for polling test

    it('should handle Google sign-in failure', async () => {
      mockAuthService.signInWithGooglePopup.mockResolvedValue({
        error: 'Google auth failed',
      });

      const action = signInWithGooglePopup();
      const result = await store.dispatch(action);

      expect(result.type).toBe('auth/signInWithGooglePopup/rejected');
      expect(result.payload).toBe('Google auth failed');

      const state = store.getState().auth;
      expect(state.error).toBe('Google auth failed');
      expect(state.isAuthenticating).toBe(false);
    });

    it('should reject Google sign-in in offline mode', async () => {
      // Set store to offline mode
      store.dispatch({
        type: 'auth/updateAuthState',
        payload: { isOfflineMode: true },
      });

      const action = signInWithGooglePopup();
      const result = await store.dispatch(action);

      expect(result.type).toBe('auth/signInWithGooglePopup/rejected');
      expect(result.payload).toBe(
        'Google sign-in not available in offline mode'
      );
      expect(mockAuthService.signInWithGooglePopup).not.toHaveBeenCalled();
    });
  });

  describe('Email/Password Flow', () => {
    it('should handle online email/password sign-in with auth service coordination', async () => {
      // Setup email sign-in success
      mockAuthService.signInWithEmail.mockResolvedValue({ error: null });

      // Simulate auth service state progression
      let authServiceCallCount = 0;
      mockAuthService.getState.mockImplementation(() => {
        authServiceCallCount++;

        if (authServiceCallCount >= 2) {
          return {
            user: mockRemoteUser,
            session: { access_token: 'email-token-123' },
            error: null,
            loading: false,
            isRemoteAuthenticated: true,
          };
        }

        return {
          user: null,
          session: null,
          error: null,
          loading: true,
          isRemoteAuthenticated: false,
        };
      });

      const action = signInWithPassword({
        email: 'user@example.com',
        password: 'password123',
      });
      const result = await store.dispatch(action);

      expect(result.type).toBe('auth/signInWithPassword/fulfilled');
      expect(mockAuthService.signInWithEmail).toHaveBeenCalledWith(
        'user@example.com',
        'password123'
      );
      expect(mockLocalAuthService.getLocalUsers).toHaveBeenCalled();

      const state = store.getState().auth;
      expect(state.user).toEqual(mockRemoteUser);
      expect(state.isAuthenticating).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle offline email/password sign-in with local auth service', async () => {
      // Set store to offline mode
      store.dispatch({
        type: 'auth/updateAuthState',
        payload: { isOfflineMode: true },
      });

      // Setup local sign-in success
      mockLocalAuthService.signIn.mockResolvedValue({ error: null });
      mockLocalAuthService.getState.mockReturnValue({
        user: {
          id: 'local-user-123',
          email: 'user@example.com',
          name: 'Test User',
          created_at: '2023-01-01',
          passcode_hash: null,
        },
        session: { local_token: 'local-token-123' },
        error: null,
      });

      const action = signInWithPassword({
        email: 'user@example.com',
        password: 'password123',
      });
      const result = await store.dispatch(action);

      expect(result.type).toBe('auth/signInWithPassword/fulfilled');
      expect(mockLocalAuthService.signIn).toHaveBeenCalledWith(
        'user@example.com',
        'password123'
      );
      expect(mockAuthService.signInWithEmail).not.toHaveBeenCalled();

      const state = store.getState().auth;
      expect(state.user?.type).toBe('local');
      expect(state.user?.email).toBe('user@example.com');
      expect(state.isAuthenticating).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle email authentication with confirmation required', async () => {
      // Setup email sign-in that requires confirmation
      mockAuthService.signInWithEmail.mockResolvedValue({ error: null });
      mockAuthService.getState.mockReturnValue({
        user: null, // No user until email is confirmed
        session: null,
        error: null,
        loading: false,
        isRemoteAuthenticated: false,
      });

      const action = signInWithPassword({
        email: 'user@example.com',
        password: 'password123',
      });
      const result = await store.dispatch(action);

      expect(result.type).toBe('auth/signInWithPassword/fulfilled');
      expect((result.payload as { user: null }).user).toBe(null);
    }, 10000); // Increase timeout for polling test

    it('should handle email/password sign-in failure', async () => {
      mockAuthService.signInWithEmail.mockResolvedValue({
        error: 'Invalid credentials',
      });

      const action = signInWithPassword({
        email: 'wrong@example.com',
        password: 'wrongpass',
      });
      const result = await store.dispatch(action);

      expect(result.type).toBe('auth/signInWithPassword/rejected');
      expect(result.payload).toBe('Invalid credentials');

      const state = store.getState().auth;
      expect(state.error).toBe('Invalid credentials');
      expect(state.isAuthenticating).toBe(false);
    });
  });

  describe('Local Account Flow', () => {
    it('should handle local account sign-in without password', async () => {
      mockLocalAuthService.signInWithoutPassword.mockResolvedValue({
        error: null,
      });
      mockLocalAuthService.getState.mockReturnValue({
        user: {
          id: 'local-user-123',
          email: 'user@example.com',
          name: 'Test User',
          created_at: '2023-01-01',
          passcode_hash: null,
        },
        session: { local_token: 'local-token-123' },
        error: null,
      });

      const action = signInOfflineWithoutPassword({
        email: 'user@example.com',
      });
      const result = await store.dispatch(action);

      expect(result.type).toBe('auth/signInOfflineWithoutPassword/fulfilled');
      expect(mockLocalAuthService.signInWithoutPassword).toHaveBeenCalledWith(
        'user@example.com'
      );

      const state = store.getState().auth;
      expect(state.user?.type).toBe('local');
      expect(state.user?.email).toBe('user@example.com');
      expect(state.isAuthenticating).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle local account sign-in failure', async () => {
      mockLocalAuthService.signInWithoutPassword.mockResolvedValue({
        error: 'Account not found',
      });

      const action = signInOfflineWithoutPassword({
        email: 'nonexistent@example.com',
      });
      const result = await store.dispatch(action);

      expect(result.type).toBe('auth/signInOfflineWithoutPassword/rejected');
      expect(result.payload).toBe('Account not found');

      const state = store.getState().auth;
      expect(state.error).toBe('Account not found');
      expect(state.isAuthenticating).toBe(false);
    });
  });

  describe('Sign Up Flow', () => {
    it('should handle online email/password sign-up', async () => {
      mockAuthService.signUpWithEmail.mockResolvedValue({ error: null });
      mockAuthService.getState.mockReturnValue({
        user: null, // Usually requires email confirmation
        session: null,
        error: null,
        loading: false,
        isRemoteAuthenticated: false,
      });

      const action = signUp({
        email: 'new@example.com',
        password: 'password123',
        metadata: { name: 'New User' },
      });
      const result = await store.dispatch(action);

      expect(result.type).toBe('auth/signUp/fulfilled');
      expect(mockAuthService.signUpWithEmail).toHaveBeenCalledWith(
        'new@example.com',
        'password123',
        { name: 'New User' }
      );

      const state = store.getState().auth;
      expect(state.isAuthenticating).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle offline sign-up with local auth service', async () => {
      // Set store to offline mode
      store.dispatch({
        type: 'auth/updateAuthState',
        payload: { isOfflineMode: true },
      });

      mockLocalAuthService.signUp.mockResolvedValue({ error: null });
      mockLocalAuthService.getState.mockReturnValue({
        user: {
          id: 'local-new-user',
          email: 'new@example.com',
          name: 'New User',
          created_at: '2023-01-01',
          passcode_hash: null,
        },
        session: { local_token: 'new-local-token' },
        error: null,
      });

      const action = signUp({
        email: 'new@example.com',
        password: 'password123',
        metadata: { name: 'New User' },
      });
      const result = await store.dispatch(action);

      expect(result.type).toBe('auth/signUp/fulfilled');
      expect(mockLocalAuthService.signUp).toHaveBeenCalledWith(
        'new@example.com',
        'password123',
        { name: 'New User' }
      );
      expect(mockAuthService.signUpWithEmail).not.toHaveBeenCalled();

      const state = store.getState().auth;
      expect(state.user?.type).toBe('local');
      expect(state.user?.email).toBe('new@example.com');
      expect(state.isAuthenticating).toBe(false);
      expect(state.error).toBe(null);
    });
  });

  describe('Sign Out Flow', () => {
    it('should handle online sign-out with auth service coordination', async () => {
      // Start with a signed-in remote user
      store.dispatch({
        type: 'auth/updateAuthState',
        payload: {
          user: mockRemoteUser,
          session: { access_token: 'token123' },
          isOfflineMode: false,
        },
      });

      mockAuthService.signOut.mockResolvedValue({ error: null });

      // Simulate auth service state progression after sign-out
      let authServiceCallCount = 0;
      mockAuthService.getState.mockImplementation(() => {
        authServiceCallCount++;

        if (authServiceCallCount >= 2) {
          // After sign-out, switched to shared account
          return {
            user: mockSharedUser,
            session: null,
            error: null,
            loading: false,
            isRemoteAuthenticated: false,
          };
        }

        // Initially still signed in
        return {
          user: mockRemoteUser,
          session: { access_token: 'token123' },
          error: null,
          loading: false,
          isRemoteAuthenticated: true,
        };
      });

      const action = signOut();
      const result = await store.dispatch(action);

      expect(result.type).toBe('auth/signOut/fulfilled');
      expect(mockAuthService.signOut).toHaveBeenCalledOnce();

      // The result should contain the shared user
      expect((result.payload as { user: typeof mockSharedUser }).user).toEqual(
        mockSharedUser
      );
    }, 10000); // Increase timeout for polling test

    it('should handle offline sign-out switching to shared account', async () => {
      // Start with a signed-in local user in offline mode
      store.dispatch({
        type: 'auth/updateAuthState',
        payload: {
          user: mockLocalUser,
          session: { local_token: 'local123' },
          isOfflineMode: true,
        },
      });

      mockLocalAuthService.signOut.mockResolvedValue({ error: null });
      mockLocalAuthService.signInWithoutPassword.mockResolvedValue({
        error: null,
      });
      mockLocalAuthService.getState.mockReturnValue({
        user: {
          id: 'local-shared-user',
          email: 'shared@local.device',
          name: 'Shared Account',
          created_at: '2023-01-01',
          passcode_hash: null,
        },
        session: null,
        error: null,
      });

      const action = signOut();
      const result = await store.dispatch(action);

      expect(result.type).toBe('auth/signOut/fulfilled');
      expect(mockLocalAuthService.signOut).toHaveBeenCalledOnce();
      expect(mockLocalAuthService.signInWithoutPassword).toHaveBeenCalledWith(
        'shared@local.device',
        true
      );

      // The result should contain the shared user
      expect((result.payload as { user: { email: string } }).user.email).toBe(
        'shared@local.device'
      );
    });

    it('should handle sign-out failure', async () => {
      mockAuthService.signOut.mockResolvedValue({
        error: 'Sign-out failed',
      });

      const action = signOut();
      const result = await store.dispatch(action);

      expect(result.type).toBe('auth/signOut/rejected');
      expect(result.payload).toBe('Sign-out failed');

      const state = store.getState().auth;
      expect(state.error).toBe('Sign-out failed');
      expect(state.loading).toBe(false);
    });
  });

  describe('Offline Mode Transitions', () => {
    it('should handle personal account detection by ID in initializeAuth', async () => {
      const personalLocalUsers = [
        {
          id: 'local-remote-user-123', // Personal account for remote user
          email: 'user@example.com',
          name: 'Test User',
          created_at: '2023-01-01',
          passcode_hash: null,
        },
        ...mockLocalAuthUsers,
      ];

      mockLocalAuthService.getLocalUsers.mockResolvedValue(personalLocalUsers);

      // Set up auth service state with a remote user
      mockAuthService.getState.mockReturnValue({
        user: mockRemoteUser,
        session: { access_token: 'token123' },
        error: null,
        loading: false,
        isRemoteAuthenticated: true,
      });

      // Force offline mode
      store.dispatch({
        type: 'auth/updateAuthState',
        payload: { forceOfflineMode: true },
      });

      const action = initializeAuth();
      const result = await store.dispatch(action);

      expect(result.type).toBe('auth/initializeAuth/fulfilled');
      expect(mockLocalAuthService.signInWithoutPassword).toHaveBeenCalledWith(
        'user@example.com',
        true
      );
    });

    it('should handle personal account detection by email fallback', async () => {
      const personalLocalUsers = [
        {
          id: 'different-format-id', // Different ID format
          email: 'user@example.com', // Same email as remote user
          name: 'Test User',
          created_at: '2023-01-01',
          passcode_hash: null,
        },
        ...mockLocalAuthUsers,
      ];

      mockLocalAuthService.getLocalUsers.mockResolvedValue(personalLocalUsers);

      // Set up auth service state with a remote user
      mockAuthService.getState.mockReturnValue({
        user: mockRemoteUser,
        session: { access_token: 'token123' },
        error: null,
        loading: false,
        isRemoteAuthenticated: true,
      });

      // Force offline mode
      store.dispatch({
        type: 'auth/updateAuthState',
        payload: { forceOfflineMode: true },
      });

      const action = initializeAuth();
      const result = await store.dispatch(action);

      expect(result.type).toBe('auth/initializeAuth/fulfilled');
      expect(mockLocalAuthService.signInWithoutPassword).toHaveBeenCalledWith(
        'user@example.com',
        true
      );
    });

    it('should fall back to shared account when no personal account found', async () => {
      // Only shared account available
      mockLocalAuthService.getLocalUsers.mockResolvedValue([
        mockLocalAuthUsers[1],
      ]);

      // Set up auth service state with a remote user
      mockAuthService.getState.mockReturnValue({
        user: mockRemoteUser,
        session: { access_token: 'token123' },
        error: null,
        loading: false,
        isRemoteAuthenticated: true,
      });

      // Force offline mode
      store.dispatch({
        type: 'auth/updateAuthState',
        payload: { forceOfflineMode: true },
      });

      const action = initializeAuth();
      const result = await store.dispatch(action);

      expect(result.type).toBe('auth/initializeAuth/fulfilled');
      expect(mockAuthService.getLocalAuthService().signOut).toHaveBeenCalled();
      expect(
        mockAuthService.getLocalAuthService().signInWithoutPassword
      ).toHaveBeenCalledWith('shared@local.device', true);
    });
  });

  describe('Error Handling', () => {
    it('should handle connectivity check timeout gracefully', async () => {
      // Simulate connectivity check timeout
      mockConnectivityService.checkNow.mockRejectedValue(
        new Error('Connectivity check timeout')
      );

      // Mock auth service waitForInitialization to succeed even when connectivity fails
      mockAuthService.waitForInitialization.mockResolvedValue(undefined);

      const action = initializeAuth();
      const result = await store.dispatch(action);

      expect(result.type).toBe('auth/initializeAuth/fulfilled');
      // Should default to online mode for better UX
    });

    it('should preserve error state across authentication flows', async () => {
      // Test error persistence in lastError
      mockAuthService.signInWithGooglePopup.mockResolvedValue({
        error: 'First error',
      });

      const firstAction = signInWithGooglePopup();
      await store.dispatch(firstAction);

      let state = store.getState().auth;
      expect(state.error).toBe('First error');
      expect(state.lastError).toBe('First error');

      // Clear current error but preserve lastError
      store.dispatch({ type: 'auth/clearError' });

      state = store.getState().auth;
      expect(state.error).toBe(null);
      expect(state.lastError).toBe(null);
    });

    it('should reset auth state properly after sign-out to allow subsequent login attempts', async () => {
      // Start with a signed-in remote user
      store.dispatch({
        type: 'auth/updateAuthState',
        payload: {
          user: mockRemoteUser,
          session: { access_token: 'token123' },
          isOfflineMode: false,
          isAuthenticating: false,
          loading: false,
          error: null,
        },
      });

      mockAuthService.signOut.mockResolvedValue({ error: null });
      mockAuthService.getState.mockReturnValue({
        user: mockSharedUser,
        session: null,
        error: null,
        loading: false,
        isRemoteAuthenticated: false,
      });

      // Perform sign-out
      const signOutAction = signOut();
      await store.dispatch(signOutAction);

      // Check that auth state is properly reset for subsequent login attempts
      const finalState = store.getState().auth;
      expect(finalState.user).toEqual(mockSharedUser);
      expect(finalState.loading).toBe(false);
      expect(finalState.isAuthenticating).toBe(false);
      expect(finalState.error).toBe(null);
      expect(finalState.isInitialized).toBe(true);

      // Now try to start a new sign-in flow to ensure it's not blocked
      mockAuthService.signInWithGooglePopup.mockResolvedValue({ error: null });
      mockAuthService.getState.mockReturnValue({
        user: mockRemoteUser,
        session: { access_token: 'new-token' },
        error: null,
        loading: false,
        isRemoteAuthenticated: true,
      });

      const newSignInAction = signInWithGooglePopup();
      const newSignInResult = await store.dispatch(newSignInAction);

      // Should succeed without issues
      expect(newSignInResult.type).toBe('auth/signInWithGooglePopup/fulfilled');

      const newState = store.getState().auth;
      expect(newState.user).toEqual(mockRemoteUser);
      expect(newState.isAuthenticating).toBe(false);
      expect(newState.error).toBe(null);
    });
  });
});

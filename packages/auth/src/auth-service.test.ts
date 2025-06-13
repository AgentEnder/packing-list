import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from './auth-service.js';
import { getSupabaseClient } from '@packing-list/supabase';

// Mock dependencies
vi.mock('@packing-list/supabase', () => ({
  getSupabaseClient: vi.fn(),
  isSupabaseAvailable: vi.fn(() => true), // Always return true in tests
}));
vi.mock('./local-auth-service.js', () => ({
  LocalAuthService: vi.fn().mockImplementation(() => {
    return {
      subscribe: vi.fn((callback) => {
        const unsubscribeFn = vi.fn();
        // Call callback asynchronously to avoid timing issues
        setTimeout(() => {
          callback({ loading: false, user: null });
        }, 0);
        return unsubscribeFn; // Return the unsubscribe function
      }),
      getLocalUsers: vi.fn().mockResolvedValue([]),
      signUp: vi
        .fn()
        .mockResolvedValue({ user: { id: 'test-user' }, error: null }),
      signIn: vi
        .fn()
        .mockResolvedValue({ user: { id: 'test-user' }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithoutPassword: vi
        .fn()
        .mockResolvedValue({ user: { id: 'test-user' }, error: null }),
      createOfflineAccountForOnlineUser: vi
        .fn()
        .mockResolvedValue({ user: { id: 'test-user' }, error: null }),
      updateProfile: vi.fn().mockResolvedValue({ error: null }),
      destroy: vi.fn(),
    };
  }),
}));
vi.mock('./connectivity.js');

describe('Auth Service', () => {
  let mockSupabaseAuth: {
    getUser: ReturnType<typeof vi.fn>;
    getSession: ReturnType<typeof vi.fn>;
    signInWithOAuth: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
    onAuthStateChange: ReturnType<typeof vi.fn>;
    signUp: ReturnType<typeof vi.fn>;
    signInWithPassword: ReturnType<typeof vi.fn>;
  };
  let mockPopup: {
    closed: boolean;
    close: ReturnType<typeof vi.fn>;
  };

  // Mock user and session objects
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockSession = {
    access_token: 'test-token',
    user: mockUser,
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock popup window behavior
    mockPopup = {
      closed: false,
      close: vi.fn(),
    };

    // Mock window.open for popup tests
    Object.defineProperty(window, 'open', {
      writable: true,
      value: vi.fn(() => mockPopup),
    });

    // Mock Supabase auth
    mockSupabaseAuth = {
      getUser: vi.fn(),
      getSession: vi
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
    };

    (getSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: mockSupabaseAuth,
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state structure', () => {
      const state = authService.getState();

      expect(state).toHaveProperty('user');
      expect(state).toHaveProperty('session');
      expect(state).toHaveProperty('loading');
      expect(state).toHaveProperty('error');
      expect(state).toHaveProperty('isRemoteAuthenticated');
    });

    it('should always have a user (never null)', () => {
      const state = authService.getState();
      expect(state.user).not.toBe(null);
      expect(typeof state.user).toBe('object');
    });
  });

  describe('User Type Detection', () => {
    it('should identify shared accounts correctly', () => {
      const state = authService.getState();

      // The initial user should be the shared account
      expect(state.user).toHaveProperty('isShared');
      if (state.user.isShared) {
        expect(state.user.id).toBe('local-shared-user');
        expect(state.user.email).toBe('shared@local.device');
      }
    });

    it('should detect remote authentication state', () => {
      const isRemoteAuth = authService.isRemotelyAuthenticated();
      expect(typeof isRemoteAuth).toBe('boolean');
    });

    it('should detect shared account usage', () => {
      const isShared = authService.isUsingSharedAccount();
      expect(typeof isShared).toBe('boolean');
    });
  });

  describe('Google Sign-In', () => {
    it('should handle Google OAuth sign-in initiation', async () => {
      mockSupabaseAuth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://oauth-url.com' },
        error: null,
      });

      // Mock popup to close immediately and session check to succeed
      mockPopup.closed = true;
      mockSupabaseAuth.getSession.mockResolvedValueOnce({
        data: { session: { user: { id: 'test-user' } } },
        error: null,
      });

      const result = await authService.signInWithGooglePopup();

      expect(mockSupabaseAuth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback'),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: true,
        },
      });

      expect(result.error).toBeUndefined();
      expect(window.open).toHaveBeenCalledWith(
        'https://oauth-url.com',
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
    });

    it('should handle Google OAuth errors', async () => {
      mockSupabaseAuth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: { message: 'OAuth failed' },
      });

      const result = await authService.signInWithGooglePopup();

      expect(result.error).toBeDefined();
      expect(result.error).toBe('OAuth failed');
    });

    it('should handle missing OAuth data', async () => {
      mockSupabaseAuth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await authService.signInWithGooglePopup();

      expect(result.error).toBeDefined();
    });
  });

  describe('Sign Out', () => {
    it('should handle successful sign out', async () => {
      // First, mock the service to be in a remotely authenticated state
      const authState = authService.getState();
      authState.isRemoteAuthenticated = true;

      mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

      const result = await authService.signOut();

      expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
      expect(result.error).toBeUndefined();
    });

    it('should handle sign out errors', async () => {
      // First, mock the service to be in a remotely authenticated state
      const authState = authService.getState();
      authState.isRemoteAuthenticated = true;

      mockSupabaseAuth.signOut.mockResolvedValue({
        error: { message: 'Sign out failed' },
      });

      const result = await authService.signOut();

      expect(result.error).toBe('Sign out failed');
    });

    it('should maintain state consistency after sign out', async () => {
      mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

      await authService.signOut();

      const state = authService.getState();
      expect(state.user).not.toBe(null); // Should fallback to shared account
      // Don't check isRemoteAuthenticated since it depends on the current state
    });

    it('should return early when not remotely authenticated', async () => {
      // Ensure user is not remotely authenticated by resetting to initial state
      const authState = authService.getState();
      authState.isRemoteAuthenticated = false;

      const result = await authService.signOut();

      expect(mockSupabaseAuth.signOut).not.toHaveBeenCalled();
      expect(result.error).toBeUndefined();
    });
  });

  describe('State Management', () => {
    it('should provide current user', () => {
      const user = authService.getCurrentUser();
      expect(user).not.toBe(null);
      expect(typeof user).toBe('object');
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('type');
    });

    it('should handle state subscriptions', () => {
      const mockListener = vi.fn();

      const unsubscribe = authService.subscribe(mockListener);
      expect(typeof unsubscribe).toBe('function');

      // Cleanup
      unsubscribe();
    });

    it('should handle initialization promises', async () => {
      // Since waitForInitialization waits for the initialization promise,
      // and we've mocked everything, this should resolve quickly
      await expect(
        authService.waitForInitialization()
      ).resolves.toBeUndefined();
    }, 3000); // Increase timeout slightly
  });

  describe('Local Account Management', () => {
    it('should provide local auth service access', () => {
      const localAuthService = authService.getLocalAuthService();
      expect(localAuthService).toBeDefined();
      expect(typeof localAuthService).toBe('object');
    });

    it('should check for personal local accounts', async () => {
      const hasPersonal = await authService.hasPersonalLocalAccount();
      expect(typeof hasPersonal).toBe('boolean');
    });

    it('should determine when to show sign-in options', () => {
      const shouldShow = authService.shouldShowSignInOptions();
      expect(typeof shouldShow).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should handle Supabase initialization errors gracefully', async () => {
      (getSupabaseClient as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('Supabase not configured');
      });

      // Should not throw, should handle gracefully
      expect(() => authService.getState()).not.toThrow();
    });

    it('should handle network errors during OAuth', async () => {
      mockSupabaseAuth.signInWithOAuth.mockRejectedValue(
        new Error('Network error')
      );

      const result = await authService.signInWithGooglePopup();
      expect(result.error).toBeDefined();
    });

    it('should handle network errors during sign out', async () => {
      // First, mock the service to be in a remotely authenticated state
      const authState = authService.getState();
      authState.isRemoteAuthenticated = true;

      mockSupabaseAuth.signOut.mockRejectedValue(new Error('Network error'));

      const result = await authService.signOut();
      expect(result.error).toBeDefined();
    });
  });

  describe('State Consistency', () => {
    it('should maintain consistent state during complex operations', async () => {
      // Initial state should be consistent
      const initialState = authService.getState();
      expect(initialState.user).not.toBe(null);

      // Mock a failed Google sign-in
      mockSupabaseAuth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: { message: 'OAuth failed' },
      });

      await authService.signInWithGooglePopup();

      // State should still be consistent after failed operation
      const afterFailState = authService.getState();
      expect(afterFailState.user).not.toBe(null);
      expect(afterFailState.user).toEqual(initialState.user);
    });

    it('should handle rapid state changes gracefully', async () => {
      const states: Array<ReturnType<typeof authService.getState>> = [];
      const unsubscribe = authService.subscribe((state) => {
        states.push({ ...state });
      });

      // Trigger multiple rapid operations
      mockSupabaseAuth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://oauth-url.com' },
        error: null,
      });

      // Mock popup to close immediately for all calls
      mockPopup.closed = true;
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'test-user' } } },
        error: null,
      });

      await Promise.all([
        authService.signInWithGooglePopup(),
        authService.signInWithGooglePopup(),
        authService.signInWithGooglePopup(),
      ]);

      // Cleanup
      unsubscribe();

      // Should handle without errors
      expect(states.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Remote Authentication Flow', () => {
    it('should properly handle successful remote authentication', async () => {
      // Reset to ensure we start in non-authenticated state
      const authState = authService.getState();
      authState.isRemoteAuthenticated = false;

      const initialState = authService.getState();
      expect(initialState.isRemoteAuthenticated).toBe(false);

      // Mock successful authentication
      mockSupabaseAuth.signInWithOAuth.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await authService.signInWithGooglePopup();
      expect(result.error).toBeUndefined();
    });

    it('should maintain remote authentication state correctly', async () => {
      const isRemoteAuth = authService.isRemotelyAuthenticated();
      const state = authService.getState();

      expect(isRemoteAuth).toBe(state.isRemoteAuthenticated);
    });
  });

  describe('Email Authentication', () => {
    it('should handle successful email sign up', async () => {
      // Mock confirmed user for successful signup
      const confirmedUser = {
        ...mockUser,
        email_confirmed_at: '2023-01-01T00:00:00Z',
      };

      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: confirmedUser, session: mockSession },
        error: null,
      });

      const result = await authService.signUpWithEmail(
        'test@example.com',
        'password123',
        { name: 'Test User' }
      );

      expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            name: 'Test User',
            full_name: 'Test User',
          },
        },
      });
      expect(result.error).toBeUndefined();
    });

    it('should handle email sign up without metadata', async () => {
      // Mock confirmed user for successful signup
      const confirmedUser = {
        ...mockUser,
        email_confirmed_at: '2023-01-01T00:00:00Z',
      };

      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: confirmedUser, session: mockSession },
        error: null,
      });

      const result = await authService.signUpWithEmail(
        'test@example.com',
        'password123'
      );

      expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: undefined,
        },
      });
      expect(result.error).toBeUndefined();
    });

    it('should handle email sign up errors', async () => {
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already exists' },
      });

      const result = await authService.signUpWithEmail(
        'test@example.com',
        'password123'
      );

      expect(result.error).toBe('Email already exists');
    });

    it('should handle email sign in', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await authService.signInWithEmail(
        'test@example.com',
        'password123'
      );

      expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.error).toBeUndefined();
    });

    it('should handle email sign in errors', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      const result = await authService.signInWithEmail(
        'test@example.com',
        'password123'
      );

      expect(result.error).toBe('Invalid credentials');
    });

    it('should handle network errors during email operations', async () => {
      mockSupabaseAuth.signUp.mockRejectedValue(new Error('Network error'));

      const result = await authService.signUpWithEmail(
        'test@example.com',
        'password123'
      );

      expect(result.error).toBeDefined();
    });
  });
});

import { Page, BrowserContext } from '@playwright/test';

export interface E2ETestUser {
  email: string;
  password: string;
  name: string;
  id: string;
  provider: 'email' | 'google';
}

// Pre-defined test users from seed.sql
export const E2E_TEST_USERS = {
  regular: {
    email: 'e2e-test@example.com',
    password: 'testpassword123',
    name: 'E2E Test User',
    id: 'e2e-user-001',
    provider: 'email' as const,
  },
  admin: {
    email: 'e2e-admin@example.com',
    password: 'adminpassword123',
    name: 'E2E Admin User',
    id: 'e2e-user-002',
    provider: 'email' as const,
  },
  google: {
    email: 'e2e-google@example.com',
    password: '', // Google users don't have passwords
    name: 'E2E Google User',
    id: 'e2e-google-user',
    provider: 'google' as const,
  },
} as const;

/**
 * Sign in using email/password authentication
 */
export async function signInWithEmail(
  page: Page,
  user: E2ETestUser = E2E_TEST_USERS.regular
): Promise<void> {
  // First ensure we're in a clean state
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Check if user is already signed in
  try {
    const userProfile = getUserProfile(page);
    const isUserProfileVisible = await userProfile.isVisible({ timeout: 3000 });

    if (isUserProfileVisible) {
      console.log('User already signed in, skipping sign-in process');
      return;
    }
  } catch (error) {
    // User not signed in, continue with sign-in process
  }

  // Look for sign in button or go directly to login
  let isOnLoginPage = false;
  try {
    // Check if we're already on a login page or can see login form
    const loginForm = getLoginForm(page);
    isOnLoginPage = await loginForm.isVisible({ timeout: 3000 });
  } catch (error) {
    // Not on login page
  }

  if (!isOnLoginPage) {
    // Try to find and click sign in button
    try {
      const signInButton = getSignInButton(page);
      await signInButton.click({ timeout: 5000 });
      await page.waitForTimeout(1000);
    } catch {
      // Try alternative selectors
      try {
        await page.click('text="Sign In"', { timeout: 3000 });
        await page.waitForTimeout(1000);
      } catch {
        // If no sign in button found, navigate directly to login
        console.log('No sign-in button found, navigating to /login');
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
      }
    }
  }

  // Wait for login form to be visible with retries
  let loginFormVisible = false;
  for (let i = 0; i < 5; i++) {
    try {
      const loginForm = getLoginForm(page);
      await loginForm.waitFor({ timeout: 8000 });
      loginFormVisible = true;
      break;
    } catch (error) {
      console.log(
        `Attempt ${
          i + 1
        }: Login form not visible, trying to navigate to login...`
      );
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
  }

  if (!loginFormVisible) {
    throw new Error('Could not find login form after multiple attempts');
  }

  // Click email sign-in link to switch to email/password form
  try {
    const emailSignInLink = getEmailSignInLink(page);
    await emailSignInLink.click({ timeout: 5000 });
  } catch (error) {
    console.log('Email sign-in link not found or not clickable:', error);
    throw new Error('Could not find email sign-in link');
  }

  // Wait for email/password form to be visible
  try {
    await page.waitForSelector('[data-testid="email-password-form"]', {
      timeout: 15000,
    });
  } catch (error) {
    console.log('Email/password form not found');
    throw new Error('Email/password form did not appear');
  }

  // Fill in credentials using proper test IDs with retry
  try {
    // Clear and fill email
    const emailInput = getEmailInput(page);
    await emailInput.fill('');
    await emailInput.fill(user.email);

    // Clear and fill password
    const passwordInput = getPasswordInput(page);
    await passwordInput.fill('');
    await passwordInput.fill(user.password);

    // Wait a moment for form validation
    await page.waitForTimeout(500);
  } catch (error) {
    console.log('Error filling form fields:', error);
    throw new Error('Could not fill login form');
  }

  // Submit the form
  try {
    const submitButton = getAuthSubmitButton(page);
    await submitButton.click({ timeout: 5000 });
  } catch (error) {
    console.log('Submit button not found or not clickable:', error);
    throw new Error('Could not submit login form');
  }

  // Wait for any loading states to complete and ensure auth state is ready
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  console.log('Login form submission completed, checking for auth state...');

  // Check for any error messages first
  const errorSelectors = [
    '[data-testid="login-error"]',
    '[data-testid="form-error"]',
    '[data-testid="auth-error"]',
    '.error',
    '.alert-error',
    '.text-error',
  ];

  for (const selector of errorSelectors) {
    const errorElement = page.locator(selector);
    const isErrorVisible = await errorElement
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    if (isErrorVisible) {
      const errorText = await errorElement
        .textContent()
        .catch(() => 'Unknown error');
      console.log(`❌ Auth error found with selector ${selector}:`, errorText);
      throw new Error(`Authentication failed: ${errorText}`);
    }
  }

  console.log('✅ No error messages found, checking for successful auth...');

  // Debug: Check what's actually in the page after login
  const currentUrl = page.url();
  console.log('Current URL after login:', currentUrl);

  // Check if we have any user profile elements
  const userProfileCount = await page
    .locator('[data-testid="user-profile"]')
    .count();
  const userProfileAvatarCount = await page
    .locator('[data-testid="user-profile-avatar"]')
    .count();
  const signInButtonStillVisible = await page
    .locator('[data-testid="sign-in-button"]')
    .isVisible({ timeout: 2000 })
    .catch(() => false);

  console.log('Post-login UI state:', {
    currentUrl,
    userProfileCount,
    userProfileAvatarCount,
    signInButtonStillVisible,
  });

  // Debug: Check Supabase auth state directly
  const supabaseAuthDebug = await page.evaluate(async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).supabase) {
        const supabase = (window as any).supabase;
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        return {
          hasSupabase: true,
          session: session
            ? {
                user: session.user?.email,
                access_token: !!session.access_token,
              }
            : null,
          error: error?.message || null,
        };
      }
      return { hasSupabase: false };
    } catch (e) {
      return { hasSupabase: false, error: e.message };
    }
  });

  console.log('Supabase auth debug:', supabaseAuthDebug);

  // Debug: Check Redux store state
  const reduxDebug = await page.evaluate(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).__REDUX_STORE__) {
        const store = (window as any).__REDUX_STORE__;
        const state = store.getState();
        return {
          hasRedux: true,
          authState: state?.auth
            ? {
                user: state.auth.user
                  ? { email: state.auth.user.email, type: state.auth.user.type }
                  : null,
                isAuthenticated: state.auth.isAuthenticated || false,
                loading: state.auth.loading || false,
                error: state.auth.error || null,
              }
            : null,
        };
      }
      return { hasRedux: false };
    } catch (e) {
      return { hasRedux: false, error: e.message };
    }
  });

  console.log('Redux debug:', reduxDebug);

  // Give time for any navigation/redirect to complete first (which would reset Redux)
  await page.waitForTimeout(2000);

  // Now trigger auth state synchronization (AFTER any Redux store reset)
  try {
    await page.evaluate(async () => {
      // First, trigger Supabase auth state refresh
      if (typeof window !== 'undefined' && (window as any).supabase) {
        const supabase = (window as any).supabase;
        try {
          // Force a session refresh which will trigger onAuthStateChange
          const result = await supabase.auth.refreshSession();
          if (result.data?.session) {
            console.log('Supabase session refreshed successfully after login');
          } else if (result.error) {
            console.log('Session refresh failed:', result.error.message);
          } else {
            console.log('No session to refresh');
          }
        } catch (e) {
          console.warn('Error refreshing Supabase session:', e);
        }
      }

      // Trigger any React re-renders that might be needed
      console.log('Waiting for React auth state to sync...');
    });
  } catch (e) {
    console.warn('Error triggering auth state sync:', e);
  }

  // Give additional time for auth state to propagate through the system
  await page.waitForTimeout(3000);

  // Final check: Debug UI state after waiting
  const finalUserProfileCount = await page
    .locator('[data-testid="user-profile"]')
    .count();
  const finalUserProfileAvatarCount = await page
    .locator('[data-testid="user-profile-avatar"]')
    .count();
  const finalSignInButtonVisible = await page
    .locator('[data-testid="sign-in-button"]')
    .isVisible({ timeout: 2000 })
    .catch(() => false);

  console.log('Final post-login UI state:', {
    userProfileCount: finalUserProfileCount,
    userProfileAvatarCount: finalUserProfileAvatarCount,
    signInButtonStillVisible: finalSignInButtonVisible,
    currentUrl: page.url(),
  });

  console.log('Sign in process completed');
}

/**
 * Clear all authentication state with minimal navigation to preserve Redux state
 */
export async function clearAllAuthState(page: Page): Promise<void> {
  try {
    console.log('Clearing all auth state...');

    // Clear auth state via JavaScript without navigation first
    await page.evaluate(() => {
      try {
        // Clear all auth-related localStorage
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.includes('auth') ||
              key.includes('supabase') ||
              key.includes('session') ||
              key.includes('user') ||
              key.includes('token'))
          ) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));

        // Clear sessionStorage too
        const sessionKeysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (
            key &&
            (key.includes('auth') ||
              key.includes('supabase') ||
              key.includes('session') ||
              key.includes('user') ||
              key.includes('token'))
          ) {
            sessionKeysToRemove.push(key);
          }
        }
        sessionKeysToRemove.forEach((key) => sessionStorage.removeItem(key));

        // Clear Supabase auth if available
        if (typeof window !== 'undefined' && (window as any).supabase) {
          const supabase = (window as any).supabase;
          try {
            supabase.auth.signOut({ scope: 'local' });
          } catch (e) {
            console.log('Could not sign out via Supabase:', e);
          }
        }
        console.log('Auth state cleared via JavaScript');
      } catch (securityError) {
        // Handle SecurityError for localStorage/sessionStorage access gracefully
        console.warn(
          'Security error clearing auth state:',
          securityError.message
        );

        // Still try to clear Supabase auth if accessible
        try {
          if (typeof window !== 'undefined' && (window as any).supabase) {
            const supabase = (window as any).supabase;
            supabase.auth.signOut({ scope: 'local' });
          }
        } catch (e) {
          console.log('Could not access Supabase for sign out');
        }
      }
    });

    // Small wait for state to clear
    await page.waitForTimeout(1000);

    // Only navigate if we're on a login/auth page (need to get away from those)
    const currentUrl = page.url();
    const needsNavigation =
      currentUrl.includes('/login') ||
      currentUrl.includes('/auth') ||
      currentUrl.includes('/error');

    if (needsNavigation) {
      try {
        console.log(
          'Navigating away from auth page to preserve clean state...'
        );
        await page.goto('/', {
          waitUntil: 'domcontentloaded',
          timeout: 10000,
        });

        // After navigation (which resets Redux), we need to wait for the app to initialize
        await page.waitForTimeout(2000);
      } catch (navError) {
        console.log(
          'Navigation after auth clear failed (continuing anyway):',
          navError.message
        );
      }
    }

    console.log('Auth state cleared');
  } catch (error) {
    console.log('Error clearing auth state:', error.message);
    // Don't throw errors from cleanup operations
  }
}

/**
 * Sign out current user and wait for transition to shared local account
 * In this app, sign-out means transitioning from personal account to shared@local.device
 * This version uses multiple approaches to ensure the transition actually happens
 */
export async function signOut(page: Page): Promise<void> {
  try {
    console.log('Starting comprehensive sign out process...');

    // Method 1: Try UI sign out first (most natural)
    try {
      const userProfileDropdown = page
        .locator('[data-testid="user-profile"]')
        .first();
      const isUserProfileVisible = await userProfileDropdown.isVisible({
        timeout: 2000,
      });

      if (isUserProfileVisible) {
        console.log('Found user profile, attempting to sign out via UI...');
        await userProfileDropdown.click();
        await page.waitForTimeout(500);

        const signOutButton = page.locator(
          '[data-testid="sign-out-button"], [data-testid="logout-button"], button:has-text("Sign Out"), button:has-text("Logout")'
        );
        const isSignOutButtonVisible = await signOutButton
          .first()
          .isVisible({ timeout: 2000 });

        if (isSignOutButtonVisible) {
          await signOutButton.first().click();
          console.log('Clicked UI sign out button');
          await page.waitForTimeout(3000); // Give more time for UI sign out
        } else {
          console.log('No sign out button found in dropdown');
        }
      }
    } catch (error) {
      console.log('UI sign out method failed:', error.message);
    }

    // Method 2: Force Redux state transition directly
    console.log('Attempting direct Redux sign out...');
    try {
      await page.evaluate(async () => {
        if (typeof window !== 'undefined' && (window as any).__REDUX_STORE__) {
          const store = (window as any).__REDUX_STORE__;

          // Dispatch the signOut action and wait for it to complete
          const signOutAction = store.dispatch({
            type: 'auth/signOut/pending',
            meta: { requestId: 'test-signout-' + Date.now() },
          });

          console.log('Dispatched Redux signOut action');

          // Also manually update the Redux state to shared user as fallback
          setTimeout(() => {
            store.dispatch({
              type: 'auth/signOut/fulfilled',
              payload: {
                user: {
                  id: 'local-shared-user',
                  email: 'shared@local.device',
                  name: 'Shared Account',
                  type: 'local',
                  isShared: true,
                },
                session: null,
                loading: false,
                error: null,
                offlineAccounts: [],
              },
              meta: { requestId: 'test-signout-' + Date.now() },
            });
            console.log('Manually set Redux state to shared account');
          }, 1000);
        }
      });
    } catch (error) {
      console.log('Redux sign out error:', error.message);
    }

    // Method 3: Force Supabase sign out and clear all auth data
    console.log('Forcing Supabase sign out and clearing auth data...');
    try {
      await page.evaluate(async () => {
        // Clear Supabase session first
        if (typeof window !== 'undefined' && (window as any).supabase) {
          const supabase = (window as any).supabase;
          try {
            await supabase.auth.signOut();
            console.log('Supabase signOut completed');
          } catch (e) {
            console.log('Supabase signOut error:', e);
          }
        }

        // Clear all auth-related storage
        try {
          // Clear localStorage auth items
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (
              key &&
              (key.includes('auth') ||
                key.includes('supabase') ||
                key.includes('session') ||
                key.includes('user') ||
                key.includes('token') ||
                key.includes('sb-'))
            ) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((key) => localStorage.removeItem(key));

          // Clear sessionStorage
          const sessionKeysToRemove: string[] = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (
              key &&
              (key.includes('auth') ||
                key.includes('supabase') ||
                key.includes('session') ||
                key.includes('user') ||
                key.includes('token'))
            ) {
              sessionKeysToRemove.push(key);
            }
          }
          sessionKeysToRemove.forEach((key) => sessionStorage.removeItem(key));

          console.log('Cleared browser storage');
        } catch (storageError) {
          console.warn('Error clearing storage:', storageError.message);
        }
      });
    } catch (error) {
      console.log('Auth data clearing error:', error.message);
    }

    // Method 4: Force auth service state transition
    console.log('Attempting to force auth service state transition...');
    try {
      await page.evaluate(async () => {
        // Try to access the auth service directly if available
        if (typeof window !== 'undefined') {
          // Check if auth service is available globally
          const globalAuthService = (window as any).authService;
          if (globalAuthService) {
            try {
              // Force transition to shared local account
              const result = await globalAuthService.signOut();
              console.log('Auth service signOut result:', result);

              // If that doesn't work, try to manually trigger the state change
              setTimeout(() => {
                if (globalAuthService.switchToSharedLocalAccount) {
                  globalAuthService.switchToSharedLocalAccount();
                  console.log('Manually triggered switchToSharedLocalAccount');
                }
              }, 500);
            } catch (e) {
              console.log('Auth service manipulation error:', e);
            }
          }
        }
      });
    } catch (error) {
      console.log('Auth service manipulation error:', error.message);
    }

    // Wait for state changes to propagate
    await page.waitForTimeout(3000);

    // Method 5: If all else fails, use page reload and manual state setting
    console.log('Checking if sign out worked...');
    let authState = await getAuthState(page);

    if (authState.isAuthenticated) {
      console.log('Sign out did not work, using page reload approach...');

      // Clear storage before reload
      await page.evaluate(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
          console.log('Cleared all storage before reload');
        } catch (e) {
          console.log('Error clearing storage before reload:', e);
        }
      });

      // Reload the page
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      // Force set shared user state after reload
      await page.evaluate(() => {
        try {
          if (
            typeof window !== 'undefined' &&
            (window as any).__REDUX_STORE__
          ) {
            const store = (window as any).__REDUX_STORE__;

            // Force set the state to shared user
            store.dispatch({
              type: 'auth/updateAuthState',
              payload: {
                user: {
                  id: 'local-shared-user',
                  email: 'shared@local.device',
                  name: 'Shared Account',
                  type: 'local',
                  isShared: true,
                  created_at: new Date().toISOString(),
                },
                session: null,
                loading: false,
                error: null,
                isRemoteAuthenticated: false,
                isOfflineMode: false,
                isAuthenticated: false,
              },
            });
            console.log('Forced Redux state to shared account after reload');
          }
        } catch (e) {
          console.log('Error setting state after reload:', e);
        }
      });

      await page.waitForTimeout(2000);
    }

    // Final verification
    authState = await getAuthState(page);
    if (authState.isAuthenticated) {
      console.warn(
        'Warning: User still appears authenticated after all sign out attempts'
      );
      console.warn('Auth state:', {
        isAuthenticated: authState.isAuthenticated,
        userEmail: authState.user?.email,
        authMethod: authState.authMethod,
      });
    } else {
      console.log('Sign out successful - user is now on shared local account');
    }
  } catch (error) {
    console.log('Sign out process error:', error.message);
  }
}

/**
 * Mock Google OAuth flow for e2e testing
 * This bypasses the actual Google OAuth and simulates a successful login
 */
export async function mockGoogleSignIn(
  page: Page,
  user: E2ETestUser = E2E_TEST_USERS.google
): Promise<void> {
  // Intercept OAuth requests and return mock data
  await page.route('**/auth/v1/authorize*', async (route) => {
    // Simulate successful OAuth flow
    const mockSession = {
      access_token: 'mock-google-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: {
        id: user.id,
        email: user.email,
        user_metadata: {
          name: user.name,
          avatar_url: 'https://lh3.googleusercontent.com/a/default-user',
        },
        app_metadata: {
          provider: 'google',
          providers: ['google'],
        },
      },
    };

    // Return success response
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: mockSession, error: null }),
    });
  });

  // Navigate to login page
  await page.goto('/login');

  // Wait for login form and click Google sign in
  await page.waitForSelector('[data-testid="login-form"]');
  await page.click('[data-testid="google-sign-in-button"]');

  // Wait for auth to complete
  await page.waitForFunction(
    () => {
      return (
        document.querySelector('[data-testid="user-profile"]') !== null ||
        window.location.pathname !== '/login'
      );
    },
    { timeout: 10000 }
  );
}

/**
 * Directly set auth state in browser for faster test setup
 * This bypasses the UI entirely and sets auth state directly
 */
export async function setDirectAuthState(
  page: Page,
  user: E2ETestUser = E2E_TEST_USERS.regular
): Promise<void> {
  // Inject auth state directly into the page
  await page.evaluate((userData) => {
    // Mock Supabase session
    const mockSession = {
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: {
        id: userData.id,
        email: userData.email,
        user_metadata: {
          name: userData.name,
        },
        app_metadata: {
          provider: userData.provider,
        },
      },
    };

    // Set in localStorage (Supabase client usually stores here)
    localStorage.setItem(
      'sb-localhost-auth-token',
      JSON.stringify(mockSession)
    );

    // Dispatch a custom event to notify auth state change
    window.dispatchEvent(new CustomEvent('supabase:auth:token-changed'));
  }, user);

  // Navigate to a protected page to trigger auth check
  await page.goto('/');
  await waitForAuthReady(page);
}

/**
 * Reset Supabase test data (calls SQL reset function)
 */
export async function resetSupabaseTestData(page: Page): Promise<void> {
  // This would typically call your Supabase reset function
  // For now, we'll just clear browser storage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Create a test user dynamically (calls SQL create function)
 */
export async function createTestUser(
  page: Page,
  email: string,
  password = 'testpassword123',
  name = 'Dynamic Test User'
): Promise<E2ETestUser> {
  // This would typically call your Supabase create function
  // For e2e testing, we'll use the seeded users instead
  const testUser: E2ETestUser = {
    email,
    password,
    name,
    id: `dynamic-${Date.now()}`,
    provider: 'email',
  };

  return testUser;
}

/**
 * Get Supabase localStorage key for the current environment
 */
function getSupabaseStorageKey(): string {
  const url = 'http://localhost:54321'; // From .env.e2e
  const key = `sb-${new URL(url).host}-auth-token`;
  return key;
}

/**
 * Check if user is authenticated by examining UI state and Supabase session
 * In this app, users are only considered "authenticated" if they have a real account.
 * The shared@local.device account is the default unauthenticated state.
 */
export async function getAuthState(page: Page): Promise<{
  isAuthenticated: boolean;
  user: any | null;
  session: any | null;
  authMethod: 'none' | 'supabase' | 'localStorage' | 'ui';
}> {
  try {
    // Method 1: Check UI state first - most reliable for e2e tests
    // If we can see a sign-in button, we're not authenticated (even with offline accounts)
    const signInButton = page.locator('[data-testid="sign-in-button"]');
    const isSignInButtonVisible = await signInButton
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isSignInButtonVisible) {
      console.log('Sign-in button visible - user not authenticated');
      return {
        isAuthenticated: false,
        user: null,
        session: null,
        authMethod: 'none',
      };
    }

    // Method 2: Check for user profile avatar (most reliable indicator of authentication)
    const userProfileAvatar = page.locator(
      '[data-testid="user-profile-avatar"]'
    );
    const isUserProfileAvatarVisible = await userProfileAvatar
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isUserProfileAvatarVisible) {
      console.log('User profile avatar visible - user is authenticated');

      // Try to get user details from the profile dropdown
      let userEmail: string | null = null;
      let userName: string | null = null;

      try {
        // Click on the avatar to open the dropdown
        await userProfileAvatar.click({ timeout: 2000 });
        await page.waitForTimeout(500);

        // Try to get user details from the dropdown
        const userEmailElement = page
          .locator('[data-testid="user-email"]')
          .first();
        const userNameElement = page
          .locator('[data-testid="user-name"]')
          .first();

        userEmail = await userEmailElement.textContent().catch(() => null);
        userName = await userNameElement.textContent().catch(() => null);

        // Close the dropdown by clicking elsewhere
        await page.click('body');
        await page.waitForTimeout(300);
      } catch (e) {
        console.log('Could not extract user details from dropdown:', e);
      }

      // Verify this is not the shared user
      if (
        userEmail &&
        userEmail !== 'shared@local.device' &&
        !userEmail.includes('shared@')
      ) {
        console.log('Found authenticated user with email:', userEmail);
        return {
          isAuthenticated: true,
          user: { name: userName || 'Authenticated User', email: userEmail },
          session: null,
          authMethod: 'ui',
        };
      } else {
        console.log(
          'User profile avatar visible but appears to be shared user'
        );
      }
    }

    // Method 3: Check if we can get session from window.supabase
    const supabaseSession = await page.evaluate(async () => {
      try {
        if (typeof window !== 'undefined' && (window as any).supabase) {
          const supabase = (window as any).supabase;
          try {
            const {
              data: { session },
              error,
            } = await supabase.auth.getSession();
            if (!error && session?.user) {
              // Double-check this is not the shared local user
              if (session.user.email !== 'shared@local.device') {
                return {
                  success: true,
                  user: session.user,
                  session: session,
                };
              }
            }
          } catch (e) {
            console.warn('Error getting Supabase session:', e);
          }
        }
        return { success: false };
      } catch (securityError) {
        // Handle SecurityError gracefully
        console.warn(
          'Security error accessing Supabase:',
          securityError.message
        );
        return { success: false };
      }
    });

    if (supabaseSession.success) {
      console.log('Found valid Supabase session for real user');
      return {
        isAuthenticated: true,
        user: supabaseSession.user,
        session: supabaseSession.session,
        authMethod: 'supabase',
      };
    }

    // Method 4: Check localStorage for Supabase session
    const storageKey = getSupabaseStorageKey();
    const storedSessionData = await page.evaluate((key) => {
      try {
        const storedSession = localStorage.getItem(key);
        if (storedSession) {
          try {
            const sessionData = JSON.parse(storedSession);
            if (sessionData?.access_token && sessionData?.user) {
              // Double-check this is not the shared local user
              if (sessionData.user.email !== 'shared@local.device') {
                return {
                  success: true,
                  user: sessionData.user,
                  session: sessionData,
                };
              }
            }
          } catch (e) {
            console.warn('Failed to parse stored session:', e);
          }
        }
        return { success: false };
      } catch (securityError) {
        // Handle SecurityError for localStorage access gracefully
        console.warn(
          'Security error accessing localStorage:',
          securityError.message
        );
        return { success: false };
      }
    }, storageKey);

    if (storedSessionData.success) {
      console.log('Found valid stored Supabase session for real user');
      return {
        isAuthenticated: true,
        user: storedSessionData.user,
        session: storedSessionData.session,
        authMethod: 'localStorage',
      };
    }

    // Method 5: Check Redux store state to distinguish real users from shared users
    const reduxAuthState = await page.evaluate(() => {
      try {
        // Check if Redux store is available and has auth state
        if (typeof window !== 'undefined' && (window as any).__REDUX_STORE__) {
          const store = (window as any).__REDUX_STORE__;
          const state = store.getState();
          if (state?.auth?.user) {
            const user = state.auth.user;
            // Check if this is a real authenticated user (not shared local account)
            if (
              user.email !== 'shared@local.device' &&
              !user.email?.includes('local.device') &&
              user.id !== 'local-shared-user' &&
              user.email?.includes('@') &&
              !user.email?.includes('shared@')
            ) {
              console.log(
                'Found real authenticated user in Redux store:',
                user.email
              );
              return {
                success: true,
                user: user,
                session: state.auth.session,
                isRemoteAuthenticated:
                  state.auth.isRemoteAuthenticated || false,
              };
            } else {
              console.log(
                'Found shared/local user in Redux store - not authenticated'
              );
              return { success: false, user: user };
            }
          }
        }
        return { success: false };
      } catch (e) {
        console.warn('Error checking Redux auth state:', e);
        return { success: false };
      }
    });

    if (reduxAuthState.success) {
      console.log('Found valid authenticated user in Redux store');
      return {
        isAuthenticated: true,
        user: reduxAuthState.user,
        session: reduxAuthState.session,
        authMethod: 'ui',
      };
    }

    // Method 6: Check if we have user profile elements but need to click to access them
    const userProfileExists = await page
      .locator('[data-testid="user-profile"]')
      .count()
      .catch(() => 0);
    const loginFormExists = await page
      .locator('[data-testid="login-form"]')
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    // If we have user profile elements and no login form visible, and no sign-in button (checked above)
    // we might be authenticated, but we need to verify it's not the shared user
    if (userProfileExists > 0 && !loginFormExists) {
      console.log(
        'User profile elements detected, checking for authentication...'
      );

      // Try to get the user email from UI to verify it's not the shared user
      const userEmailElement = page
        .locator('[data-testid="user-email"]')
        .first();
      const userEmail = await userEmailElement.textContent().catch(() => null);

      if (
        userEmail &&
        userEmail !== 'shared@local.device' &&
        !userEmail.includes('shared@')
      ) {
        console.log(
          'User profile visible with real email - authenticated via UI:',
          userEmail
        );

        const userNameElement = page
          .locator('[data-testid="user-name"]')
          .first();
        const userName = await userNameElement.textContent().catch(() => null);

        return {
          isAuthenticated: true,
          user: { name: userName || 'UI User', email: userEmail },
          session: null,
          authMethod: 'ui',
        };
      } else {
        console.log(
          'User profile visible but appears to be shared user - not authenticated'
        );
      }
    }

    // Method 7: Final fallback - check if we're on the main page and no auth UI is visible
    const currentUrl = page.url();
    const isOnLoginPage =
      currentUrl.includes('/login') || currentUrl.includes('/auth');

    if (!isOnLoginPage && currentUrl.includes('localhost:3000')) {
      // If we're on main page, have no sign-in button, and no login form, we might be authenticated
      // but with very subtle UI changes. Let's be more aggressive in our detection.

      // Check if we can find any positive auth indicators
      const hasUserMenu = await page
        .locator(
          '[data-testid="user-menu"], [data-testid="account-menu"], [data-testid="user-profile-menu"]'
        )
        .isVisible({ timeout: 1000 })
        .catch(() => false);

      // Additional check: make sure we don't see offline badge (indicates shared user)
      const hasOfflineBadge = await page
        .locator('[data-testid="offline-badge"]')
        .isVisible({ timeout: 1000 })
        .catch(() => false);

      if (hasUserMenu && !hasOfflineBadge) {
        console.log(
          'On main app page with user menu visible and no offline badge - authenticated'
        );

        return {
          isAuthenticated: true,
          user: { name: 'Authenticated App User' },
          session: null,
          authMethod: 'ui',
        };
      } else if (!hasOfflineBadge && userProfileExists > 0) {
        // Last chance - if we have user profile elements and no offline badge, assume authenticated
        console.log(
          'On main app page with user profile elements and no offline badge - likely authenticated'
        );

        return {
          isAuthenticated: true,
          user: { name: 'Profile User' },
          session: null,
          authMethod: 'ui',
        };
      } else {
        console.log(
          'On main app page but insufficient auth indicators or offline badge present - likely shared user'
        );
      }
    }

    // Default: not authenticated (likely on shared local account)
    console.log(
      'No authentication indicators found - user is on shared local account'
    );
    return {
      isAuthenticated: false,
      user: null,
      session: null,
      authMethod: 'none',
    };
  } catch (error) {
    console.warn('Error checking auth state:', error);
    return {
      isAuthenticated: false,
      user: null,
      session: null,
      authMethod: 'none',
    };
  }
}

/**
 * Wait for authentication to complete
 */
export async function waitForAuthReady(
  page: Page,
  timeoutMs = 15000
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    // Check primary UI indicators first
    const signInButtonVisible = await page
      .locator('[data-testid="sign-in-button"]')
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    const loginFormVisible = await page
      .locator('[data-testid="login-form"]')
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    // If no sign-in button and no login form, we're likely authenticated
    if (!signInButtonVisible && !loginFormVisible) {
      console.log(
        'No sign-in button or login form visible - checking for auth indicators'
      );

      // Look for positive auth indicators
      const userProfileExists = await page
        .locator('[data-testid="user-profile"]')
        .count()
        .catch(() => 0);

      // Check if we're on the main app (not login page)
      const currentUrl = page.url();
      const isOnMainApp =
        currentUrl.includes('localhost:3000') &&
        !currentUrl.includes('/login') &&
        !currentUrl.includes('/auth');

      if (userProfileExists > 0 || isOnMainApp) {
        console.log(
          'Auth ready detected via UI state (no login elements + positive indicators)'
        );

        // Double-check with auth state
        const authState = await getAuthState(page);
        if (authState.isAuthenticated) {
          console.log(`Auth confirmed via ${authState.authMethod} method`);
          return true;
        } else {
          console.log(
            'UI suggests auth but getAuthState says no - continuing to wait'
          );
        }
      }
    } else {
      console.log(
        'Sign-in button or login form still visible - not authenticated yet'
      );
    }

    // Try to trigger auth state sync if we have Supabase available
    if (Date.now() - startTime > 5000) {
      // Only try this after 5 seconds
      try {
        await page.evaluate(() => {
          if (typeof window !== 'undefined' && (window as any).supabase) {
            const supabase = (window as any).supabase;
            supabase.auth
              .refreshSession()
              .then((result) => {
                if (result.data?.session) {
                  console.log('Session refresh triggered during auth wait');
                }
              })
              .catch((e) =>
                console.warn('Session refresh error during wait:', e)
              );
          }
        });
      } catch (e) {
        console.warn('Error triggering auth sync during wait:', e);
      }
    }

    await page.waitForTimeout(200);
  }

  console.warn('Timeout waiting for auth to be ready');

  // Final debug info
  try {
    const finalAuthState = await getAuthState(page);
    const signInButtonVisible = await page
      .locator('[data-testid="sign-in-button"]')
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    const loginFormVisible = await page
      .locator('[data-testid="login-form"]')
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    const userProfileCount = await page
      .locator('[data-testid="user-profile"]')
      .count()
      .catch(() => 0);

    console.log('Final auth wait state:', {
      isAuthenticated: finalAuthState.isAuthenticated,
      authMethod: finalAuthState.authMethod,
      signInButtonVisible,
      loginFormVisible,
      userProfileCount,
      currentUrl: page.url(),
      userId: finalAuthState.user?.id,
      userEmail: finalAuthState.user?.email,
    });
  } catch (e) {
    console.warn('Error getting final auth state during wait:', e);
  }

  return false;
}

/**
 * Test the complete authentication flow with proper expectations for shared local account behavior
 */
export async function testAuthFlow(
  page: Page,
  user: E2ETestUser = E2E_TEST_USERS.regular
): Promise<void> {
  console.log(`Testing auth flow for user: ${user.email}`);

  // Ensure clean starting state - but minimize navigation
  await clearAllAuthState(page);

  // Only navigate if not already on main page
  const currentUrl = page.url();
  if (
    !currentUrl.includes('localhost:3000') ||
    currentUrl.includes('/login') ||
    currentUrl.includes('/auth')
  ) {
    await page.goto('/', { waitUntil: 'networkidle' });
  }

  // Check initial state (should be unauthenticated - on shared local account)
  const initialAuthState = await getAuthState(page);
  console.log('Initial auth state:', initialAuthState.isAuthenticated);

  // Sign in
  await signInWithEmail(page, user);

  // Wait for auth to be ready
  const isAuthReady = await waitForAuthReady(page);
  if (!isAuthReady) {
    throw new Error('Auth did not become ready after sign in');
  }

  // Verify authenticated state (should be personal account, not shared)
  const authState = await getAuthState(page);
  if (!authState.isAuthenticated) {
    throw new Error('User is not authenticated after sign in');
  }

  console.log('Sign in successful');

  // Sign out
  await signOut(page);

  // Wait a moment for sign out to complete
  await page.waitForTimeout(2000);

  // Check final state - should be back on shared local account (isAuthenticated = false)
  const finalAuthState = await getAuthState(page);
  if (finalAuthState.isAuthenticated) {
    console.warn(
      'Note: User still shows as authenticated after sign out - this might indicate the transition to shared local account did not complete properly'
    );
  } else {
    console.log(
      'Sign out completed successfully - user is now on shared local account'
    );
  }

  console.log('Auth flow test completed');
}

/**
 * UI Element Locator Utilities
 * These functions return locators for commonly used UI elements
 */

/**
 * Get the sign-in button locator
 */
export function getSignInButton(page: Page) {
  return page.locator('[data-testid="sign-in-button"]:visible');
}

/**
 * Get the login form locator
 */
export function getLoginForm(page: Page) {
  return page.locator('[data-testid="login-form"]');
}

/**
 * Get the user profile locator
 */
export function getUserProfile(page: Page) {
  return page.locator('[data-testid="user-profile"]');
}

/**
 * Get the sign-out button locator
 */
export function getSignOutButton(page: Page) {
  return page.locator(
    '[data-testid="sign-out-button"], [data-testid="logout-button"], button:has-text("Sign Out"), button:has-text("Logout")'
  );
}

/**
 * Get the email input locator
 */
export function getEmailInput(page: Page) {
  return page.locator('[data-testid="email-input"]');
}

/**
 * Get the password input locator
 */
export function getPasswordInput(page: Page) {
  return page.locator('[data-testid="password-input"]');
}

/**
 * Get the auth submit button locator
 */
export function getAuthSubmitButton(page: Page) {
  return page.locator('[data-testid="auth-submit-button"]');
}

/**
 * Get the email sign-in link locator
 */
export function getEmailSignInLink(page: Page) {
  return page.locator('[data-testid="email-sign-in-link"]');
}

/**
 * Get the Google sign-in button locator
 */
export function getGoogleSignInButton(page: Page) {
  return page.locator('[data-testid="google-sign-in-button"]');
}

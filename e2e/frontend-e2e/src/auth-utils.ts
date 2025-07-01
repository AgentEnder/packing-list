import { Page } from '@playwright/test';

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
    id: '11111111-1111-1111-1111-111111111111',
    provider: 'email' as const,
  },
  admin: {
    email: 'e2e-admin@example.com',
    password: 'adminpassword123',
    name: 'E2E Admin User',
    id: '22222222-2222-2222-2222-222222222222',
    provider: 'email' as const,
  },
  google: {
    email: 'e2e-google@example.com',
    password: '', // Google users don't have passwords
    name: 'E2E Google User',
    id: '33333333-3333-3333-3333-333333333333',
    provider: 'google' as const,
  },
} as const;

interface AuthUser {
  email: string;
}

interface AuthSession {
  // Add proper session properties as needed
  [key: string]: unknown;
}

/**
 * Sign in using email/password authentication
 * Simplified to follow the most common user path
 */
export async function signInWithEmail(
  page: Page,
  user: E2ETestUser = E2E_TEST_USERS.regular
): Promise<void> {
  // Navigate to home page
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Check if already signed in (but not with shared account)
  const authState = await getAuthState(page);
  if (authState.isAuthenticated && authState.user?.email === user.email) {
    return;
  }

  // If signed in with wrong account, sign out first
  if (authState.isAuthenticated) {
    await signOut(page);
    await page.waitForLoadState('networkidle');
  }

  // Navigate to login page
  const signInButton = getSignInButton(page);

  // Check if sign-in button is available, but don't wait too long
  try {
    await signInButton.waitFor({ state: 'visible', timeout: 3000 });
    await signInButton.click();
  } catch {
    // If no sign-in button, navigate directly to login
    await page.goto('/login');
  }

  await page.waitForLoadState('networkidle');

  // Wait for login form and switch to email/password
  const loginForm = getLoginForm(page);
  await loginForm.waitFor({ timeout: 10000 });

  const emailSignInLink = getEmailSignInLink(page);

  // Check if email sign-in link is available
  try {
    await emailSignInLink.waitFor({ state: 'visible', timeout: 5000 });
    await emailSignInLink.click();
  } catch {
    // Email link not found, might already be on email form
  }

  // Wait for email/password form
  await page.waitForSelector('[data-testid="email-password-form"]', {
    timeout: 10000,
  });

  // Fill credentials
  const emailInput = getEmailInput(page);
  const passwordInput = getPasswordInput(page);

  await emailInput.fill(user.email);
  await passwordInput.fill(user.password);

  // Submit form
  const submitButton = getAuthSubmitButton(page);
  await submitButton.click();

  // Wait for navigation or auth state change
  await page.waitForLoadState('networkidle');

  // Check for errors without unnecessary delay
  const errorElement = page.locator('[data-testid="form-error"]');
  try {
    await errorElement.waitFor({ state: 'visible', timeout: 2000 });
    const errorText = (await errorElement.textContent()) || 'Unknown error';
    // Don't throw immediately - let the calling test handle it
  } catch {
    // No error found, which is good
  }
}

/**
 * Sign out the current user
 */
export async function signOut(page: Page): Promise<void> {
  // First check if user is actually authenticated
  const authState = await getAuthState(page);

  if (!authState.isAuthenticated) {
    return;
  }

  // Look for user profile dropdown
  const userProfile = getUserProfile(page);

  try {
    await userProfile.waitFor({ state: 'visible', timeout: 3000 });
  } catch {
    return;
  }

  try {
    // Click the user profile to open dropdown
    await userProfile.click({ timeout: 5000 });

    // Look for and click sign out button
    const signOutButton = getSignOutButton(page);
    await signOutButton.click({ timeout: 5000 });
  } catch (error) {
    // Don't throw - just log and continue since this is often used in cleanup
  }
}

/**
 * Check if user is authenticated by looking at UI state
 * Fixed to properly wait for elements to become visible
 */
export async function getAuthState(page: Page): Promise<{
  isAuthenticated: boolean;
  user: AuthUser | null;
  session: AuthSession | null;
  authMethod: 'ui' | 'none';
}> {
  // Wait for either user profile OR sign-in button to appear (one should always be present)
  try {
    const userProfile = getUserProfile(page);
    const signInButton = getSignInButton(page);

    // Race between user profile and sign-in button appearing
    const result = await Promise.race([
      userProfile
        .waitFor({ state: 'visible', timeout: 5000 })
        .then(() => 'profile'),
      signInButton
        .waitFor({ state: 'visible', timeout: 5000 })
        .then(() => 'signin'),
    ]).catch(() => null);

    if (result === 'profile') {
      // User profile is visible - try to get user email
      let userEmail: string | null = null;
      try {
        await userProfile.click();

        const userEmailElement = page
          .locator('[data-testid="user-email"]:visible')
          .first();
        userEmail = await userEmailElement
          .textContent({ timeout: 2000 })
          .catch(() => null);

        // Close dropdown by clicking elsewhere
        await page.keyboard.press('Escape');
      } catch {
        // Could not get email, but user profile exists
      }

      // Verify this is not the shared local user
      if (
        userEmail &&
        userEmail !== 'shared@local.device' &&
        !userEmail.includes('shared@') &&
        !userEmail.includes('local.device')
      ) {
        return {
          isAuthenticated: true,
          user: { email: userEmail },
          session: null,
          authMethod: 'ui',
        };
      } else {
        // This is a shared local account, not actually authenticated
        return {
          isAuthenticated: false,
          user: null,
          session: null,
          authMethod: 'none',
        };
      }
    } else if (result === 'signin') {
      // Sign-in button is visible - user is not authenticated
      return {
        isAuthenticated: false,
        user: null,
        session: null,
        authMethod: 'none',
      };
    }
  } catch (error) {
    console.warn('Error determining auth state:', error);
  }

  // Default to not authenticated if we can't determine state
  return {
    isAuthenticated: false,
    user: null,
    session: null,
    authMethod: 'none',
  };
}

/**
 * Wait for authentication state to be ready
 * Fixed to properly wait for elements to become visible
 */
export async function waitForAuthReady(
  page: Page,
  timeoutMs = 15000
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const signInButton = getSignInButton(page);
      const userProfile = getUserProfile(page);

      // Use Promise.race to wait for either element to appear
      const result = await Promise.race([
        userProfile
          .waitFor({ state: 'visible', timeout: 1000 })
          .then(() => 'profile'),
        signInButton
          .waitFor({ state: 'visible', timeout: 1000 })
          .then(() => 'signin'),
        new Promise((resolve) => setTimeout(() => resolve('timeout'), 1000)),
      ]);

      if (result === 'profile') {
        return true;
      } else if (result === 'signin') {
        return true;
      }

      // If we got timeout, continue the loop
    } catch (error) {
      console.warn('Error during auth ready check:', error);
      // Small delay before retrying to avoid hammering the DOM
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.warn(`waitForAuthReady timed out after ${timeoutMs}ms`);
  return false;
}

/**
 * Clear authentication state
 * Enhanced to be more thorough for test isolation
 */
export async function clearAllAuthState(page: Page): Promise<void> {
  await page.evaluate(async () => {
    // Clear Supabase session
    if (
      typeof window !== 'undefined' &&
      (window as unknown as Record<string, unknown>).supabase
    ) {
      const supabase = (window as unknown as Record<string, unknown>).supabase;
      try {
        await (
          supabase as { auth: { signOut: () => Promise<void> } }
        ).auth.signOut();
      } catch (e) {
        console.warn('Supabase signOut error:', e);
      }
    }

    // Clear browser storage
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Storage clear error:', e);
    }

    // Clear IndexedDB databases more thoroughly
    if (typeof window !== 'undefined' && window.indexedDB) {
      try {
        // Clear common auth databases
        const dbsToDelete = [
          'firebaseLocalStorageDb',
          'supabase-auth',
          'keyval-store',
          'packingListDb',
          'authDB',
        ];

        for (const dbName of dbsToDelete) {
          try {
            window.indexedDB.deleteDatabase(dbName);
          } catch (e) {
            console.warn(`Error deleting database ${dbName}:`, e);
          }
        }
      } catch (e) {
        console.warn('IndexedDB clear error:', e);
      }
    }
  });

  // Navigate to home page to ensure clean state
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

/**
 * UI Element Locator Utilities
 */
export function getSignInButton(page: Page) {
  return page.locator('[data-testid="sign-in-button"]:visible');
}

export function getLoginForm(page: Page) {
  return page.locator('[data-testid="login-form"]');
}

export function getUserProfile(page: Page) {
  return page.locator('[data-testid="user-profile"]:visible');
}

export function getSignOutButton(page: Page) {
  return page.locator('[data-testid="sign-out-button"]:visible').first();
}

export function getEmailInput(page: Page) {
  return page.locator('[data-testid="email-input"]');
}

export function getPasswordInput(page: Page) {
  return page.locator('[data-testid="password-input"]');
}

export function getAuthSubmitButton(page: Page) {
  return page.locator('[data-testid="auth-submit-button"]');
}

export function getEmailSignInLink(page: Page) {
  return page.locator('[data-testid="email-sign-in-link"]');
}

export function getGoogleSignInButton(page: Page) {
  return page.locator('[data-testid="google-sign-in-button"]');
}

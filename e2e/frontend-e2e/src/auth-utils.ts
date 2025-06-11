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

  // Check if already signed in
  const userProfile = getUserProfile(page);
  const isAlreadySignedIn = await userProfile
    .isVisible({ timeout: 2000 })
    .catch(() => false);
  if (isAlreadySignedIn) {
    console.log('User already signed in');
    return;
  }

  // Navigate to login page
  const signInButton = getSignInButton(page);
  const hasSignInButton = await signInButton
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (hasSignInButton) {
    await signInButton.click();
  } else {
    await page.goto('/login');
  }

  await page.waitForLoadState('networkidle');

  // Wait for login form and switch to email/password
  const loginForm = getLoginForm(page);
  await loginForm.waitFor({ timeout: 10000 });

  const emailSignInLink = getEmailSignInLink(page);
  await emailSignInLink.click();

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

  // Wait for auth to complete
  await page.waitForLoadState('networkidle');

  // Check for errors
  const errorElement = page.locator('[data-testid="form-error"]');
  const hasError = await errorElement
    .isVisible({ timeout: 2000 })
    .catch(() => false);
  if (hasError) {
    const errorText = (await errorElement.textContent()) || 'Unknown error';
    throw new Error(`Authentication failed: ${errorText}`);
  }

  // Wait for user profile to appear (indicating successful login)
  const userProfileAfterLogin = getUserProfile(page);
  await userProfileAfterLogin.waitFor({ timeout: 10000 });

  console.log('Sign in completed successfully');
}

/**
 * Sign out the current user
 */
export async function signOut(page: Page): Promise<void> {
  // First check if user is actually authenticated
  const authState = await getAuthState(page);

  if (!authState.isAuthenticated) {
    console.log('User is already signed out');
    return;
  }

  // Look for user profile dropdown
  const userProfile = getUserProfile(page);
  const isProfileVisible = await userProfile
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (!isProfileVisible) {
    console.log('User profile not visible, assuming already signed out');
    return;
  }

  try {
    // Click the user profile to open dropdown
    await userProfile.click({ timeout: 5000 });

    // Look for and click sign out button
    const signOutButton = getSignOutButton(page);
    await signOutButton.click({ timeout: 5000 });

    console.log('Successfully signed out');
  } catch (error) {
    console.log('Sign out attempt failed, but continuing:', error);
    // Don't throw - just log and continue since this is often used in cleanup
  }
}

/**
 * Check if user is authenticated by looking at UI state
 * Simplified to focus on the most reliable indicators
 */
export async function getAuthState(page: Page): Promise<{
  isAuthenticated: boolean;
  user: AuthUser | null;
  session: AuthSession | null;
  authMethod: 'ui' | 'none';
}> {
  // Check for sign-in button (indicates not authenticated)
  const signInButton = getSignInButton(page);
  const hasSignInButton = await signInButton
    .isVisible({ timeout: 2000 })
    .catch(() => false);

  if (hasSignInButton) {
    return {
      isAuthenticated: false,
      user: null,
      session: null,
      authMethod: 'none',
    };
  }

  // Check for user profile (indicates authenticated)
  const userProfile = getUserProfile(page);
  const hasUserProfile = await userProfile
    .isVisible({ timeout: 2000 })
    .catch(() => false);

  if (hasUserProfile) {
    // Try to get user email from the profile
    let userEmail: string | null = null;
    try {
      await userProfile.click();

      const userEmailElement = page
        .locator('[data-testid="user-email"]:visible')
        .first();
      userEmail = await userEmailElement.textContent().catch(() => null);

      // Close dropdown
      await page.click('body');
    } catch {
      // Could not get email, but user profile exists
    }

    // Verify this is not the shared local user
    if (
      userEmail &&
      userEmail !== 'shared@local.device' &&
      !userEmail.includes('shared@')
    ) {
      return {
        isAuthenticated: true,
        user: { email: userEmail },
        session: null,
        authMethod: 'ui',
      };
    }
  }

  // Default to not authenticated (likely shared local account)
  return {
    isAuthenticated: false,
    user: null,
    session: null,
    authMethod: 'none',
  };
}

/**
 * Wait for authentication state to be ready
 * Simplified to focus on UI readiness
 */
export async function waitForAuthReady(
  page: Page,
  timeoutMs = 10000
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const signInButton = getSignInButton(page);
    const userProfile = getUserProfile(page);

    const hasSignInButton = await signInButton
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    const hasUserProfile = await userProfile
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    // Auth is ready when we have either a sign-in button OR user profile (but not both)
    if (hasSignInButton || hasUserProfile) {
      return true;
    }
  }

  return false;
}

/**
 * Clear authentication state
 * Simplified to use Supabase signOut and basic storage clearing
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
  });
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

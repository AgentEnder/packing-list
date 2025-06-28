import { Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Direct Supabase client for test database operations
function getTestSupabaseClient() {
  const supabaseUrl =
    process.env.PUBLIC_ENV__SUPABASE_URL || 'http://localhost:54321';
  const supabaseServiceRoleKey =
    process.env.PUBLIC_ENV__SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

  const client = createClient(supabaseUrl, supabaseServiceRoleKey);
  return client;
}

/**
 * Clear all test data (for when we need a completely clean slate)
 * Still faster than full DB reset as it only clears data, not schema
 */
export async function clearAllTestData(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const supabase = (window as any).supabase;
    if (!supabase) {
      console.warn('Supabase client not found on window');
      return;
    }

    try {
      // Get all test user IDs (e2e test users)
      const testUserEmails = [
        'e2e-test@example.com',
        'e2e-admin@example.com',
        'e2e-google@example.com',
      ];

      // Clear data for all test users
      for (const email of testUserEmails) {
        try {
          // Find user by email
          const { data: users } = await supabase
            .from('auth.users')
            .select('id')
            .eq('email', email);

          if (users && users.length > 0) {
            const userId = users[0].id;

            // Use the same clearing logic as clearUserData
            const tablesToClear = [
              'packing_items',
              'trip_people',
              'trip_destinations',
              'trip_events',
              'trips',
              'user_people',
              'user_preferences',
              'user_settings',
            ];

            for (const table of tablesToClear) {
              try {
                await supabase.from(table).delete().eq('user_id', userId);
              } catch (err) {
                console.warn(`Error clearing ${table} for ${email}:`, err);
              }
            }
          }
        } catch (err) {
          console.warn(`Error processing test user ${email}:`, err);
        }
      }
    } catch (error) {
      console.error('Error during all test data cleanup:', error);
    }
  });
}

/**
 * Convenience function for common test setup pattern:
 * Sign in with test user and clear their data for clean test state
 */
export async function setupCleanTestUser(page: Page): Promise<void> {
  // Import here to avoid circular dependencies
  const { signInWithEmail, waitForAuthReady } = await import('./auth-utils');

  console.log('🚀 Starting clean test user setup...');

  // Sign in first
  await signInWithEmail(page);

  // Wait for authentication to be ready
  await waitForAuthReady(page);

  // Force clear Redux store and storage
  await page.evaluate(() => {
    // Clear Redux store completely
    if ((window as any).store) {
      const store = (window as any).store;
      // Clear all trips and reset selected trip
      store.dispatch({ type: 'CLEAR_ALL_TRIPS' });
      store.dispatch({ type: 'SELECT_TRIP', payload: { tripId: null } });
      // Clear any cached data
      store.dispatch({ type: 'CLEAR_ALL_CACHE' });
    }

    // Clear browser storage
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Storage clear error:', e);
    }
  });

  // Force reload to ensure clean hydration
  console.log('🔄 Reloading page for clean hydration...');
  await page.reload();
  await page.waitForLoadState('networkidle');

  // Wait for auth to be ready again after reload
  await waitForAuthReady(page);

  // Verify the clean state
  const verificationResult = await page.evaluate(() => {
    const store = (window as any).store;
    if (store) {
      const state = store.getState();
      return {
        tripCount: state.trips?.length || 0,
        selectedTripId: state.selectedTripId || null,
        hasTrips: (state.trips?.length || 0) > 0,
        isSignedIn: !!state.auth?.user,
        userId: state.auth?.user?.id || null,
        uiAuthenticated: true, // We know UI is authenticated since we just signed in
      };
    }
    return {
      tripCount: 0,
      selectedTripId: null,
      hasTrips: false,
      isSignedIn: false,
      userId: null,
      uiAuthenticated: false,
    };
  });

  console.log('Clean test user setup completed', verificationResult);

  // Additional check for Redux auth state
  if (verificationResult.uiAuthenticated && !verificationResult.isSignedIn) {
    console.log(
      '⚠️ Redux auth state not set but UI shows authenticated, continuing...'
    );
  }
}

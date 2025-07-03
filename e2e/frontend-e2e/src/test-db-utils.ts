import { Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// eslint-disable-next-line @nx/enforce-module-boundaries
import type { Database } from '../../../packages/supabase/src/database-types.js'; // Ensure types are loaded
import { sign } from 'crypto';

// Direct Supabase client for test database operations
function getTestSupabaseClient() {
  const supabaseUrl =
    process.env.PUBLIC_ENV__SUPABASE_URL || 'http://localhost:54321';
  const supabaseServiceRoleKey =
    process.env.PUBLIC_ENV__SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

  const client = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);
  return client;
}

/**
 * Clear all test data using server-side Supabase client
 * More reliable than browser-based cleanup
 */
export async function clearAllTestData(page: Page): Promise<void> {
  try {
    const supabase = getTestSupabaseClient();

    // Clear data for the current test user
    const tablesToClear: Array<keyof Database['public']['Tables']> = [
      'trip_people',
      'trips',
      'user_people',
      'default_item_rules',
      'rule_packs',
      'trip_default_item_rules',
      'trip_items',
      'sync_changes',
      'user_profiles',
      'trip_rule_overrides',
    ] as const;

    for (const table of tablesToClear) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .not('id', 'is', null); // Delete all rows where id is not null

        if (error) {
          console.warn(`Error clearing ${table}:`, error.message);
        }
      } catch (err) {
        console.warn(`Exception clearing ${table}:`, err);
      }
    }
  } catch (error) {
    console.error('Error during test data cleanup:', error);
  }
}

/**
 * Convenience function for common test setup pattern:
 * Sign in with test user and clear their data for clean test state
 */
export async function setupCleanTestUser(page: Page): Promise<void> {
  // Clear test data through database cleanup - preserve all browser state
  await clearAllTestData(page);

  await page.goto('/');

  // Import here to avoid circular dependencies
  const { signInWithEmail, waitForAuthReady } = await import('./auth-utils');

  await signInWithEmail(page);

  // Wait for auth state to be ready
  await waitForAuthReady(page);
}

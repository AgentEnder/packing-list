import { FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { Database } from '../../../packages/supabase/src/database-types';

async function globalSetup(config: FullConfig) {
  console.log('🧹 Global E2E setup: Starting fresh database reset...');

  // Create Supabase client with service role key
  const supabaseUrl =
    process.env.PUBLIC_ENV__SUPABASE_URL || 'http://localhost:54321';
  const supabaseServiceRoleKey =
    process.env.PUBLIC_ENV__SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);

  try {
    console.log('📋 Clearing all test data from database...');

    // List of tables to clear (in reverse dependency order)
    const tablesToClear: Array<keyof Database['public']['Tables']> = [
      'trip_items',
      'trip_people',
      'trip_rule_overrides',
      'trips',
      'user_people',
      'user_profiles',
      'sync_changes', // Ensure sync changes are cleared first
      'default_item_rules',
      'rule_packs',
      'trip_default_item_rules',
    ];

    // Clear each table
    for (const table of tablesToClear) {
      try {
        const { error, count } = await supabase
          .from(table)
          .delete({
            count: 'exact', // Get exact count of deleted rows
          })
          .not('id', 'is', null); // Delete all rows where id is not null (i.e., all rows)

        if (error) {
          console.warn(`⚠️  Warning clearing ${table}:`, error.message);
        } else {
          console.log(`✅ Cleared ${table} (${count || 'unknown'} rows)`);
        }
      } catch (err) {
        console.warn(`⚠️  Exception clearing ${table}:`, err);
      }
    }

    console.log('🗑️  Database cleanup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error; // Fail the test run if setup fails
  }

  console.log('✅ Global E2E setup completed successfully');
}

export default globalSetup;

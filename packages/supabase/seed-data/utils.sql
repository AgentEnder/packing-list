-- ============================================================================
-- Helper Functions for E2E Testing
-- ============================================================================

-- Function to reset test data (useful for e2e test isolation)
CREATE OR REPLACE FUNCTION reset_e2e_test_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete test-specific data
  -- Adjust these DELETE statements based on your schema
  
  -- Example deletions:
  -- DELETE FROM public.packing_lists WHERE user_id LIKE 'e2e-%';
  -- DELETE FROM public.trips WHERE user_id LIKE 'e2e-%';
  
  -- Re-insert fresh test data if needed
  -- This ensures each test starts with a clean slate
END;
$$;

-- Function to clean up e2e test users
CREATE OR REPLACE FUNCTION cleanup_e2e_test_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete users with e2e test emails
  DELETE FROM auth.users WHERE email LIKE 'e2e-%@%' OR email LIKE '%+e2e@%';
  
  -- Delete any application data for test users
  -- Add your cleanup logic here based on your schema
END;
$$; 
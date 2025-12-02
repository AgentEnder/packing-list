-- Backfill existing trip owners into trip_users table
-- This ensures all existing trips have proper ownership records

-- Insert owner records for all existing trips
INSERT INTO trip_users (trip_id, user_id, email, role, status, created_at, updated_at)
SELECT 
    t.id AS trip_id,
    t.user_id,
    u.email,
    'owner' AS role,
    'accepted' AS status,
    t.created_at,
    NOW() AS updated_at
FROM trips t
INNER JOIN auth.users u ON t.user_id = u.id
WHERE t.is_deleted = false
-- Only insert if not already exists (in case migration runs multiple times)
AND NOT EXISTS (
    SELECT 1 FROM trip_users tu
    WHERE tu.trip_id = t.id
    AND tu.user_id = t.user_id
    AND tu.is_deleted = false
);

-- Log the results
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM trip_users
    WHERE role = 'owner'
    AND status = 'accepted';
    
    RAISE NOTICE 'Backfilled % trip owners into trip_users table', v_count;
END $$;
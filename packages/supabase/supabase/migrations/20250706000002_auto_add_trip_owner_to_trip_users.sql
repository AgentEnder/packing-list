-- Automatically add trip owners to trip_users table when trips are created
-- This ensures all new trips have proper ownership records for collaboration features

-- Create function to add trip owner to trip_users
CREATE OR REPLACE FUNCTION add_trip_owner_to_trip_users()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert the trip owner into trip_users table
    INSERT INTO trip_users (trip_id, user_id, email, role, status, created_at, updated_at)
    SELECT 
        NEW.id AS trip_id,
        NEW.user_id,
        u.email,
        'owner' AS role,
        'accepted' AS status,
        NEW.created_at,
        NEW.updated_at
    FROM auth.users u
    WHERE u.id = NEW.user_id
    -- Only insert if not already exists (safety check)
    AND NOT EXISTS (
        SELECT 1 FROM trip_users tu
        WHERE tu.trip_id = NEW.id
        AND tu.user_id = NEW.user_id
        AND tu.is_deleted = false
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically run this function when trips are inserted
CREATE TRIGGER trigger_add_trip_owner_to_trip_users
    AFTER INSERT ON trips
    FOR EACH ROW
    EXECUTE FUNCTION add_trip_owner_to_trip_users();

-- Backfill any existing trips that don't have trip_users records
-- (This handles the case where trips were created before this trigger existed)
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
-- Only insert if not already exists
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
    AND status = 'accepted'
    AND is_deleted = false;
    
    RAISE NOTICE 'Total trip owners in trip_users table: %', v_count;
END $$;
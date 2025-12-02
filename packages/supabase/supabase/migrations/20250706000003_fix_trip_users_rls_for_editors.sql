-- Fix RLS policy to allow editors to see all trip members (including owner)
-- Currently editors can only see their own trip_user record, not other members

-- Drop the current restrictive policy
DROP POLICY IF EXISTS "Users can view trip memberships" ON trip_users;

-- Create a new policy that allows users to see all members of trips they have access to
CREATE POLICY "Users can view trip memberships" ON trip_users
    FOR SELECT
    USING (
        -- User can see trip members if they have access to the trip
        user_has_trip_access(trip_id, auth.uid())
        -- Note: user_has_trip_access already checks if user is owner OR accepted member
    );

-- The user_has_trip_access function already handles:
-- 1. Trip ownership (trips.user_id = auth.uid())
-- 2. Accepted membership (trip_users.user_id = auth.uid() AND status = 'accepted')
-- So this policy will allow:
-- - Owners to see all members of their trips
-- - Editors to see all members of trips they're accepted members of
-- - Users to see pending invitations for trips they have access to
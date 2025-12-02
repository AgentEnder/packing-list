-- Fix RLS policy to allow users to accept their own trip invitations
-- The current policy only allows UPDATE when status is 'pending', but we need to allow 
-- the updated row to exist after the status changes to 'accepted'

-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Update trip memberships" ON trip_users;

-- Create a new UPDATE policy that allows users to update their own invitations
-- and allows the updated row to exist
CREATE POLICY "Update trip memberships" ON trip_users
    FOR UPDATE
    USING (
        -- Trip owner can update any membership
        EXISTS (
            SELECT 1 FROM trips
            WHERE trips.id = trip_users.trip_id
            AND trips.user_id = auth.uid()
            AND NOT trips.is_deleted
        )
        OR
        -- User can update their own invitation (by user_id or email)
        (
            trip_users.user_id = auth.uid() OR trip_users.email = auth.email()
        )
    )
    WITH CHECK (
        -- Trip owner can update any membership
        EXISTS (
            SELECT 1 FROM trips
            WHERE trips.id = trip_users.trip_id
            AND trips.user_id = auth.uid()
            AND NOT trips.is_deleted
        )
        OR
        -- User can update their own invitation (by user_id or email)
        -- Allow the updated row to exist regardless of status
        (
            trip_users.user_id = auth.uid() OR trip_users.email = auth.email()
        )
    );
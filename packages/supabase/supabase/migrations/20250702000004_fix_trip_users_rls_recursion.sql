-- Fix infinite recursion in trip_users RLS policies

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view trip memberships" ON trip_users;

-- Create a simplified policy that avoids recursion
-- Users can see trip memberships for trips they own or their own pending invitations
CREATE POLICY "Users can view trip memberships" ON trip_users
    FOR SELECT
    USING (
        -- User is the trip owner
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = trip_users.trip_id 
            AND trips.user_id = auth.uid()
            AND NOT trips.is_deleted
        )
        OR
        -- User has a pending or accepted invitation (by email or user_id)
        (
            trip_users.user_id = auth.uid() 
            OR trip_users.email = auth.email()
        )
    );
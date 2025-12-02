-- Allow users with pending invitations to view trip details

-- Update the user_has_trip_access function to include pending invitations
CREATE OR REPLACE FUNCTION user_has_trip_access(p_trip_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM trips t
        WHERE t.id = p_trip_id
        AND t.is_deleted = false
        AND (
            -- User owns the trip
            t.user_id = p_user_id
            OR
            -- User is an accepted member
            EXISTS (
                SELECT 1 FROM trip_users tu
                WHERE tu.trip_id = t.id
                AND tu.user_id = p_user_id
                AND tu.status = 'accepted'
                AND tu.is_deleted = false
            )
            OR
            -- User has a pending invitation (by user_id or email)
            EXISTS (
                SELECT 1 FROM trip_users tu
                WHERE tu.trip_id = t.id
                AND (
                    tu.user_id = p_user_id 
                    OR tu.email = (SELECT email FROM auth.users WHERE id = p_user_id)
                )
                AND tu.status = 'pending'
                AND tu.is_deleted = false
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
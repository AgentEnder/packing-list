-- Update RLS policies to support multi-user access through trip_users table

-- Helper function to check if a user has access to a trip
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
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's role in a trip
CREATE OR REPLACE FUNCTION get_user_trip_role(p_trip_id UUID, p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- Check if user is trip owner
    IF EXISTS (
        SELECT 1 FROM trips
        WHERE id = p_trip_id
        AND user_id = p_user_id
        AND is_deleted = false
    ) THEN
        RETURN 'owner';
    END IF;
    
    -- Check trip_users table for role
    SELECT role INTO v_role
    FROM trip_users
    WHERE trip_id = p_trip_id
    AND user_id = p_user_id
    AND status = 'accepted'
    AND is_deleted = false
    LIMIT 1;
    
    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view their own trips" ON trips;
DROP POLICY IF EXISTS "Users can insert their own trips" ON trips;
DROP POLICY IF EXISTS "Users can update their own trips" ON trips;
DROP POLICY IF EXISTS "Users can delete their own trips" ON trips;

-- Recreate trips policies with multi-user support
CREATE POLICY "Users can view trips they have access to" ON trips
    FOR SELECT
    USING (
        is_deleted = false 
        AND user_has_trip_access(id, auth.uid())
    );

CREATE POLICY "Users can insert their own trips" ON trips
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update trips they own" ON trips
    FOR UPDATE
    USING (
        is_deleted = false 
        AND user_id = auth.uid()
    )
    WITH CHECK (
        is_deleted = false 
        AND user_id = auth.uid()
    );

CREATE POLICY "Users can delete trips they own" ON trips
    FOR DELETE
    USING (
        is_deleted = false 
        AND user_id = auth.uid()
    );

-- Update trip_people policies
DROP POLICY IF EXISTS "Users can view people in their trips" ON trip_people;
DROP POLICY IF EXISTS "Users can insert people in their trips" ON trip_people;
DROP POLICY IF EXISTS "Users can update people in their trips" ON trip_people;
DROP POLICY IF EXISTS "Users can delete people in their trips" ON trip_people;

CREATE POLICY "Users can view people in accessible trips" ON trip_people
    FOR SELECT
    USING (
        is_deleted = false 
        AND user_has_trip_access(trip_id, auth.uid())
    );

CREATE POLICY "Users can insert people in editable trips" ON trip_people
    FOR INSERT
    WITH CHECK (
        user_has_trip_access(trip_id, auth.uid())
        AND get_user_trip_role(trip_id, auth.uid()) IN ('owner', 'editor')
    );

CREATE POLICY "Users can update people in editable trips" ON trip_people
    FOR UPDATE
    USING (
        is_deleted = false 
        AND user_has_trip_access(trip_id, auth.uid())
        AND get_user_trip_role(trip_id, auth.uid()) IN ('owner', 'editor')
    )
    WITH CHECK (
        is_deleted = false 
        AND user_has_trip_access(trip_id, auth.uid())
        AND get_user_trip_role(trip_id, auth.uid()) IN ('owner', 'editor')
    );

CREATE POLICY "Users can delete people in editable trips" ON trip_people
    FOR DELETE
    USING (
        is_deleted = false 
        AND user_has_trip_access(trip_id, auth.uid())
        AND get_user_trip_role(trip_id, auth.uid()) IN ('owner', 'editor')
    );

-- Update trip_items policies
DROP POLICY IF EXISTS "Users can view items in their trips" ON trip_items;
DROP POLICY IF EXISTS "Users can insert items in their trips" ON trip_items;
DROP POLICY IF EXISTS "Users can update items in their trips" ON trip_items;
DROP POLICY IF EXISTS "Users can delete items in their trips" ON trip_items;

CREATE POLICY "Users can view items in accessible trips" ON trip_items
    FOR SELECT
    USING (
        is_deleted = false 
        AND user_has_trip_access(trip_id, auth.uid())
    );

CREATE POLICY "Users can insert items in editable trips" ON trip_items
    FOR INSERT
    WITH CHECK (
        user_has_trip_access(trip_id, auth.uid())
        AND get_user_trip_role(trip_id, auth.uid()) IN ('owner', 'editor')
    );

CREATE POLICY "Users can update items in editable trips" ON trip_items
    FOR UPDATE
    USING (
        is_deleted = false 
        AND user_has_trip_access(trip_id, auth.uid())
        AND get_user_trip_role(trip_id, auth.uid()) IN ('owner', 'editor')
    )
    WITH CHECK (
        is_deleted = false 
        AND user_has_trip_access(trip_id, auth.uid())
        AND get_user_trip_role(trip_id, auth.uid()) IN ('owner', 'editor')
    );

CREATE POLICY "Users can delete items in editable trips" ON trip_items
    FOR DELETE
    USING (
        is_deleted = false 
        AND user_has_trip_access(trip_id, auth.uid())
        AND get_user_trip_role(trip_id, auth.uid()) IN ('owner', 'editor')
    );

-- Update trip_rule_overrides policies
DROP POLICY IF EXISTS "Users can view rule overrides in their trips" ON trip_rule_overrides;
DROP POLICY IF EXISTS "Users can insert rule overrides in their trips" ON trip_rule_overrides;
DROP POLICY IF EXISTS "Users can update rule overrides in their trips" ON trip_rule_overrides;
DROP POLICY IF EXISTS "Users can delete rule overrides in their trips" ON trip_rule_overrides;

CREATE POLICY "Users can view rule overrides in accessible trips" ON trip_rule_overrides
    FOR SELECT
    USING (
        is_deleted = false 
        AND user_has_trip_access(trip_id, auth.uid())
    );

CREATE POLICY "Users can insert rule overrides in editable trips" ON trip_rule_overrides
    FOR INSERT
    WITH CHECK (
        user_has_trip_access(trip_id, auth.uid())
        AND get_user_trip_role(trip_id, auth.uid()) IN ('owner', 'editor')
    );

CREATE POLICY "Users can update rule overrides in editable trips" ON trip_rule_overrides
    FOR UPDATE
    USING (
        is_deleted = false 
        AND user_has_trip_access(trip_id, auth.uid())
        AND get_user_trip_role(trip_id, auth.uid()) IN ('owner', 'editor')
    )
    WITH CHECK (
        is_deleted = false 
        AND user_has_trip_access(trip_id, auth.uid())
        AND get_user_trip_role(trip_id, auth.uid()) IN ('owner', 'editor')
    );

CREATE POLICY "Users can delete rule overrides in editable trips" ON trip_rule_overrides
    FOR DELETE
    USING (
        is_deleted = false 
        AND user_has_trip_access(trip_id, auth.uid())
        AND get_user_trip_role(trip_id, auth.uid()) IN ('owner', 'editor')
    );
-- ============================================================================
-- Migration: Fix default_item_rules RLS to use trip-based access through TripUser membership
-- The previous policy only checked trip ownership, not membership through trip_users table
-- ============================================================================

-- Drop the existing SELECT policy that uses old trips.user_id pattern
DROP POLICY IF EXISTS "Users can view default item rules" ON public.default_item_rules;

-- Create new SELECT policy that uses user_has_trip_access() function
-- This allows users to view rules if they:
-- 1. Own the rule directly (user_id = auth.uid())
-- 2. Have access to a trip that uses the rule (through trip ownership OR trip_users membership)
CREATE POLICY "Users can view default item rules" ON public.default_item_rules
    FOR SELECT
    USING (
        is_deleted = false
        AND (
            -- User owns the rule directly
            user_id = auth.uid()
            OR
            -- User has access to a trip that uses this rule
            EXISTS (
                SELECT 1 FROM trip_default_item_rules tdir
                WHERE tdir.rule_id = default_item_rules.id
                AND tdir.is_deleted = false
                AND user_has_trip_access(tdir.trip_id, auth.uid())
            )
        )
    );

-- The INSERT, UPDATE, and DELETE policies remain unchanged as they should
-- still only allow users to modify rules they own directly
-- (collaborative editing of rules across trips would be complex and risky)

-- Add comment to document the policy
COMMENT ON POLICY "Users can view default item rules" ON public.default_item_rules IS 
'Allows users to view rules they own directly or rules used by trips they have access to through trip_users membership';

-- ============================================================================
-- Migration Complete
-- 
-- Summary:
-- - Fixed SELECT policy to use user_has_trip_access() instead of direct trips.user_id check
-- - Users can now view default_item_rules when they have access to trips that use them
-- - Covers both trip ownership and trip_users membership scenarios
-- - Maintains security by only allowing modification of directly owned rules
-- ============================================================================
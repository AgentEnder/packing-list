-- ============================================================================
-- Update trip_default_item_rules RLS Policies for Shared Trips
-- ============================================================================
-- This migration updates the RLS policies for trip_default_item_rules to support
-- multi-user trips (trips shared via the trip_users table)

-- ============================================================================
-- Drop Existing Policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their trip default item rules" ON public.trip_default_item_rules;
DROP POLICY IF EXISTS "Users can insert their trip default item rules" ON public.trip_default_item_rules;
DROP POLICY IF EXISTS "Users can update their trip default item rules" ON public.trip_default_item_rules;
DROP POLICY IF EXISTS "Users can delete their trip default item rules" ON public.trip_default_item_rules;

-- ============================================================================
-- Create New Policies Supporting Multi-User Access
-- ============================================================================

-- Users can view trip default item rules for trips they have access to
CREATE POLICY "Users can view trip rules for accessible trips" ON public.trip_default_item_rules
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_default_item_rules.trip_id
        AND (trips.user_id = auth.uid() OR public.user_can_view_trip(trips.id, auth.uid()))
    )
  );

-- Users can insert trip default item rules for trips they can edit
CREATE POLICY "Users can insert trip rules for editable trips" ON public.trip_default_item_rules
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_default_item_rules.trip_id
        AND (trips.user_id = auth.uid() OR public.user_can_edit_trip(trips.id, auth.uid()))
    )
  );

-- Users can update trip default item rules for trips they can edit
CREATE POLICY "Users can update trip rules for editable trips" ON public.trip_default_item_rules
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_default_item_rules.trip_id
        AND (trips.user_id = auth.uid() OR public.user_can_edit_trip(trips.id, auth.uid()))
    )
  ) WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_default_item_rules.trip_id
        AND (trips.user_id = auth.uid() OR public.user_can_edit_trip(trips.id, auth.uid()))
    )
  );

-- Users can delete trip default item rules for trips they can edit
CREATE POLICY "Users can delete trip rules for editable trips" ON public.trip_default_item_rules
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_default_item_rules.trip_id
        AND (trips.user_id = auth.uid() OR public.user_can_edit_trip(trips.id, auth.uid()))
    )
  );

-- ============================================================================
-- Update default_item_rules Policies for Shared Trips
-- ============================================================================

-- Drop existing policies for default_item_rules
DROP POLICY IF EXISTS "Users can view default item rules" ON public.default_item_rules;
DROP POLICY IF EXISTS "Users can insert own default item rules" ON public.default_item_rules;
DROP POLICY IF EXISTS "Users can update own default item rules" ON public.default_item_rules;
DROP POLICY IF EXISTS "Users can delete own default item rules" ON public.default_item_rules;

-- Users can view rules if they own them OR if they have access to a trip that uses them
CREATE POLICY "Users can view accessible default item rules" ON public.default_item_rules
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.trip_default_item_rules tdir
      JOIN public.trips t ON t.id = tdir.trip_id
      WHERE tdir.rule_id = default_item_rules.id
        AND (t.user_id = auth.uid() OR public.user_can_view_trip(t.id, auth.uid()))
    )
  );

-- Users can insert rules if they own them
CREATE POLICY "Users can insert own default item rules" ON public.default_item_rules
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update rules if they own them
CREATE POLICY "Users can update own default item rules" ON public.default_item_rules
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete rules if they own them
CREATE POLICY "Users can delete own default item rules" ON public.default_item_rules
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- Update Comments
-- ============================================================================

COMMENT ON TABLE public.trip_default_item_rules IS 
  'Associates trips with default item rules. Users can access rules for trips they own or have been granted access to via trip_users.';

COMMENT ON TABLE public.default_item_rules IS 
  'User-defined packing rules. Users can view rules they own or rules used by trips they have access to.';

-- ============================================================================
-- Migration Complete
-- ============================================================================

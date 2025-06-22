-- ============================================================================
-- Migration: Update RLS policies for trip-based access to rules
-- Update policies to allow users to access rules based on trip ownership
-- instead of just direct user ownership
-- ============================================================================

-- ============================================================================
-- Update default_item_rules RLS policies
-- ============================================================================

-- Drop existing policies for default_item_rules
DROP POLICY IF EXISTS "Users can view own default item rules" ON public.default_item_rules;
DROP POLICY IF EXISTS "Users can insert own default item rules" ON public.default_item_rules;
DROP POLICY IF EXISTS "Users can update own default item rules" ON public.default_item_rules;
DROP POLICY IF EXISTS "Users can delete own default item rules" ON public.default_item_rules;

-- Create new policies that allow access based on trip ownership
-- Users can view rules if they own the rule directly OR if they have a trip that uses the rule
CREATE POLICY "Users can view default item rules" ON public.default_item_rules
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.trip_default_item_rules tdir
      JOIN public.trips t ON t.id = tdir.trip_id
      WHERE tdir.rule_id = default_item_rules.id
        AND t.user_id = auth.uid()
    )
  );

-- Users can insert rules if they own them directly
CREATE POLICY "Users can insert own default item rules" ON public.default_item_rules
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update rules if they own them directly
CREATE POLICY "Users can update own default item rules" ON public.default_item_rules
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete rules if they own them directly
CREATE POLICY "Users can delete own default item rules" ON public.default_item_rules
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- Update trip_default_item_rules RLS policies (if they need updating)
-- ============================================================================

-- The existing trip_default_item_rules policies should already be correct
-- since they check trip ownership, but let's ensure they're optimal

-- Drop existing policies for trip_default_item_rules (if any old ones exist)
DROP POLICY IF EXISTS "Users can view trip default item rules" ON public.trip_default_item_rules;
DROP POLICY IF EXISTS "Users can modify trip default item rules" ON public.trip_default_item_rules;

-- The policies created in the previous migration (20250620000000_fix_trip_default_item_rules_rls.sql)
-- should already be correct for trip-based access, but let's verify they exist

-- Ensure the correct policies exist (these should already be there from the previous migration)
DO $$
BEGIN
  -- Check if the view policy exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'trip_default_item_rules' 
      AND policyname = 'Users can view their trip default item rules'
  ) THEN
    CREATE POLICY "Users can view their trip default item rules" ON public.trip_default_item_rules
      FOR SELECT USING (user_id = auth.uid());
  END IF;

  -- Check if the insert policy exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'trip_default_item_rules' 
      AND policyname = 'Users can insert their trip default item rules'
  ) THEN
    CREATE POLICY "Users can insert their trip default item rules" ON public.trip_default_item_rules
      FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
          SELECT 1 FROM public.trips
          WHERE trips.id = trip_default_item_rules.trip_id
            AND trips.user_id = auth.uid()
        )
      );
  END IF;

  -- Check if the update policy exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'trip_default_item_rules' 
      AND policyname = 'Users can update their trip default item rules'
  ) THEN
    CREATE POLICY "Users can update their trip default item rules" ON public.trip_default_item_rules
      FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
          SELECT 1 FROM public.trips
          WHERE trips.id = trip_default_item_rules.trip_id
            AND trips.user_id = auth.uid()
        )
      );
  END IF;

  -- Check if the delete policy exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'trip_default_item_rules' 
      AND policyname = 'Users can delete their trip default item rules'
  ) THEN
    CREATE POLICY "Users can delete their trip default item rules" ON public.trip_default_item_rules
      FOR DELETE USING (user_id = auth.uid());
  END IF;
END$$;

-- ============================================================================
-- Add indexes for better performance with new policies
-- ============================================================================

-- Note: Indexes for trip_default_item_rules are handled in the column type fix migration
-- (20250622000001_fix_rule_id_column_types.sql)

-- ============================================================================
-- Update comments
-- ============================================================================

COMMENT ON TABLE public.default_item_rules IS 'User-defined packing rules. Users can access rules they own directly or rules used by trips they own.';
COMMENT ON TABLE public.trip_default_item_rules IS 'Associates trips with default item rules. Users can only access associations for their own trips.';

-- ============================================================================
-- Migration Complete
-- ============================================================================ 
-- ============================================================================
-- Migration: Fix RLS policies for trip_default_item_rules
-- Update policies to use the user_id field directly for better performance
-- and ensure users can CRUD rules that belong to their own trips
-- ============================================================================

-- Drop existing policies (all possible variations)
DROP POLICY IF EXISTS "Users can view trip default item rules" ON public.trip_default_item_rules;
DROP POLICY IF EXISTS "Users can modify trip default item rules" ON public.trip_default_item_rules;
DROP POLICY IF EXISTS "Users can view their trip default item rules" ON public.trip_default_item_rules;
DROP POLICY IF EXISTS "Users can insert their trip default item rules" ON public.trip_default_item_rules;
DROP POLICY IF EXISTS "Users can update their trip default item rules" ON public.trip_default_item_rules;
DROP POLICY IF EXISTS "Users can delete their trip default item rules" ON public.trip_default_item_rules;

-- Create new, more efficient policies using the user_id field directly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their trip default item rules'
  ) THEN
    CREATE POLICY "Users can view their trip default item rules" ON public.trip_default_item_rules
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their trip default item rules'
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
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their trip default item rules'
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
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their trip default item rules'
  ) THEN
    CREATE POLICY "Users can delete their trip default item rules" ON public.trip_default_item_rules
      FOR DELETE USING (user_id = auth.uid());
  END IF;
END$$;

-- Add comment explaining the policy logic
COMMENT ON TABLE public.trip_default_item_rules IS 'Associates trips with default item rules. RLS ensures users can only access rules for their own trips.';

-- ============================================================================
-- Migration Complete
-- ============================================================================ 
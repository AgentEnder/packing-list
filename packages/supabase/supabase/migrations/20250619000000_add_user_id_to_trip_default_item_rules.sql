-- ============================================================================
-- Migration: Add user_id column to trip_default_item_rules
-- This column tracks which user made changes to rule associations
-- ============================================================================

-- Add user_id column to trip_default_item_rules table
ALTER TABLE public.trip_default_item_rules 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing records to set user_id based on the trip's user_id
UPDATE public.trip_default_item_rules 
SET user_id = trips.user_id
FROM public.trips 
WHERE trip_default_item_rules.trip_id = trips.id 
  AND trip_default_item_rules.user_id IS NULL;

-- Make user_id NOT NULL after updating existing records
ALTER TABLE public.trip_default_item_rules 
ALTER COLUMN user_id SET NOT NULL;

-- Add index for performance when filtering by user
CREATE INDEX IF NOT EXISTS idx_trip_default_item_rules_user_id 
ON public.trip_default_item_rules(user_id) 
WHERE is_deleted = FALSE;

-- Update the unique constraint to include user_id for proper isolation
ALTER TABLE public.trip_default_item_rules 
DROP CONSTRAINT IF EXISTS trip_default_item_rules_trip_id_rule_id_key;

ALTER TABLE public.trip_default_item_rules 
ADD CONSTRAINT trip_default_item_rules_user_trip_rule_unique 
UNIQUE(user_id, trip_id, rule_id);

-- Update RLS policies to use the direct user_id column
DROP POLICY IF EXISTS "Users can view trip default item rules" ON public.trip_default_item_rules;
DROP POLICY IF EXISTS "Users can modify trip default item rules" ON public.trip_default_item_rules;

CREATE POLICY "Users can view their trip default item rules" ON public.trip_default_item_rules
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can modify their trip default item rules" ON public.trip_default_item_rules
  FOR ALL USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

-- Add comment to document the field
COMMENT ON COLUMN public.trip_default_item_rules.user_id IS 'ID of the user who owns this rule association';

-- ============================================================================
-- Migration Complete
-- ============================================================================ 
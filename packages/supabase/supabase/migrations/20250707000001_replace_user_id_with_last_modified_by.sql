-- ============================================================================
-- Migration: Replace user_id with lastModifiedBy in trip tables
-- Convert trip_default_item_rules from user-based to trip-based access
-- Add lastModifiedBy tracking to other trip tables
-- ============================================================================

-- Step 1: Update trip_default_item_rules table
-- Replace user_id with lastModifiedBy and update RLS policies

-- Add lastModifiedBy column
ALTER TABLE public.trip_default_item_rules 
ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Copy existing user_id values to lastModifiedBy
UPDATE public.trip_default_item_rules 
SET last_modified_by = user_id
WHERE last_modified_by IS NULL;

-- Drop the old unique constraint that included user_id
ALTER TABLE public.trip_default_item_rules 
DROP CONSTRAINT IF EXISTS trip_default_item_rules_user_trip_rule_unique;

-- Create new unique constraint without user_id (one rule per trip)
ALTER TABLE public.trip_default_item_rules 
ADD CONSTRAINT trip_default_item_rules_trip_rule_unique 
UNIQUE(trip_id, rule_id);

-- Drop the old user_id index
DROP INDEX IF EXISTS idx_trip_default_item_rules_user_id;

-- Add index for lastModifiedBy
CREATE INDEX IF NOT EXISTS idx_trip_default_item_rules_last_modified_by 
ON public.trip_default_item_rules(last_modified_by) 
WHERE is_deleted = FALSE;

-- Drop old RLS policies (all policies that reference user_id must be dropped)
DROP POLICY IF EXISTS "Users can view their trip default item rules" ON public.trip_default_item_rules;
DROP POLICY IF EXISTS "Users can modify their trip default item rules" ON public.trip_default_item_rules;
DROP POLICY IF EXISTS "Users can insert their trip default item rules" ON public.trip_default_item_rules;
DROP POLICY IF EXISTS "Users can update their trip default item rules" ON public.trip_default_item_rules;
DROP POLICY IF EXISTS "Users can delete their trip default item rules" ON public.trip_default_item_rules;

-- Create new trip-based RLS policies
CREATE POLICY "Users can view trip default item rules in accessible trips" ON public.trip_default_item_rules
    FOR SELECT
    USING (
        is_deleted = false 
        AND user_has_trip_access(trip_id, auth.uid())
    );

CREATE POLICY "Users can insert trip default item rules in editable trips" ON public.trip_default_item_rules
    FOR INSERT
    WITH CHECK (
        user_has_trip_access(trip_id, auth.uid())
        AND get_user_trip_role(trip_id, auth.uid()) IN ('owner', 'editor')
    );

CREATE POLICY "Users can update trip default item rules in editable trips" ON public.trip_default_item_rules
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

CREATE POLICY "Users can delete trip default item rules in editable trips" ON public.trip_default_item_rules
    FOR DELETE
    USING (
        is_deleted = false 
        AND user_has_trip_access(trip_id, auth.uid())
        AND get_user_trip_role(trip_id, auth.uid()) IN ('owner', 'editor')
    );

-- Now drop the user_id column
ALTER TABLE public.trip_default_item_rules 
DROP COLUMN IF EXISTS user_id;

-- Step 2: Add lastModifiedBy to other trip tables that don't have user tracking

-- Add lastModifiedBy to trip_people
ALTER TABLE public.trip_people 
ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add lastModifiedBy to trip_items
ALTER TABLE public.trip_items 
ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add lastModifiedBy to trip_rule_overrides
ALTER TABLE public.trip_rule_overrides 
ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_people_last_modified_by 
ON public.trip_people(last_modified_by) 
WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_trip_items_last_modified_by 
ON public.trip_items(last_modified_by) 
WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_trip_rule_overrides_last_modified_by 
ON public.trip_rule_overrides(last_modified_by) 
WHERE is_deleted = FALSE;

-- Add comments to document the fields
COMMENT ON COLUMN public.trip_default_item_rules.last_modified_by IS 'ID of the user who last modified this rule association';
COMMENT ON COLUMN public.trip_people.last_modified_by IS 'ID of the user who last modified this person';
COMMENT ON COLUMN public.trip_items.last_modified_by IS 'ID of the user who last modified this item';
COMMENT ON COLUMN public.trip_rule_overrides.last_modified_by IS 'ID of the user who last modified this rule override';

-- Step 3: Create triggers to automatically set lastModifiedBy on INSERT/UPDATE

-- Function to set lastModifiedBy to current user
CREATE OR REPLACE FUNCTION set_last_modified_by()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified_by := auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for trip_default_item_rules
DROP TRIGGER IF EXISTS set_last_modified_by_trigger ON public.trip_default_item_rules;
CREATE TRIGGER set_last_modified_by_trigger
    BEFORE INSERT OR UPDATE ON public.trip_default_item_rules
    FOR EACH ROW
    EXECUTE FUNCTION set_last_modified_by();

-- Add triggers for trip_people
DROP TRIGGER IF EXISTS set_last_modified_by_trigger ON public.trip_people;
CREATE TRIGGER set_last_modified_by_trigger
    BEFORE INSERT OR UPDATE ON public.trip_people
    FOR EACH ROW
    EXECUTE FUNCTION set_last_modified_by();

-- Add triggers for trip_items
DROP TRIGGER IF EXISTS set_last_modified_by_trigger ON public.trip_items;
CREATE TRIGGER set_last_modified_by_trigger
    BEFORE INSERT OR UPDATE ON public.trip_items
    FOR EACH ROW
    EXECUTE FUNCTION set_last_modified_by();

-- Add triggers for trip_rule_overrides
DROP TRIGGER IF EXISTS set_last_modified_by_trigger ON public.trip_rule_overrides;
CREATE TRIGGER set_last_modified_by_trigger
    BEFORE INSERT OR UPDATE ON public.trip_rule_overrides
    FOR EACH ROW
    EXECUTE FUNCTION set_last_modified_by();

-- ============================================================================
-- Migration Complete
-- 
-- Summary of changes:
-- 1. trip_default_item_rules: user_id -> lastModifiedBy, RLS changed to trip-based
-- 2. trip_people: added lastModifiedBy column
-- 3. trip_items: added lastModifiedBy column  
-- 4. trip_rule_overrides: added lastModifiedBy column
-- 5. All tables now have automatic lastModifiedBy tracking via triggers
-- ============================================================================
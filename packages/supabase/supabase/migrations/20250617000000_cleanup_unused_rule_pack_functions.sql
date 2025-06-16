-- ============================================================================
-- Migration: Cleanup Unused Rule Pack Functions and Views
-- This migration removes database functions and views that were created but
-- are not actually used by the application. The rule pack logic is handled
-- client-side in Redux state management instead.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Drop unused views (in dependency order)
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.trip_pack_status;  -- This depends on trip_rules_with_pack_info
DROP VIEW IF EXISTS public.trip_rules_with_pack_info;

-- ---------------------------------------------------------------------------
-- Drop unused functions
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.apply_rule_pack_to_trip(UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.remove_rule_pack_from_trip(UUID, TEXT);
DROP FUNCTION IF EXISTS public.generate_user_rule_id(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_user_rule_packs(UUID);

-- ---------------------------------------------------------------------------
-- Remove unused columns from default_item_rules that were added for tracking
-- but are not used by the application
-- ---------------------------------------------------------------------------
ALTER TABLE public.default_item_rules 
DROP COLUMN IF EXISTS source_pack_id,
DROP COLUMN IF EXISTS source_rule_id,
DROP COLUMN IF EXISTS is_user_created;

-- Remove associated indexes
DROP INDEX IF EXISTS idx_default_item_rules_source_pack;
DROP INDEX IF EXISTS idx_default_item_rules_source_rule;

-- ============================================================================
-- Migration Complete
-- ============================================================================

COMMENT ON TABLE public.default_item_rules IS 'User-defined packing rules for automatic item calculation (cleaned up unused fields)';

-- Note: The actual rule pack functionality is implemented client-side
-- through Redux state management in packages/state/src/action-handlers/toggle-rule-pack.ts
-- The database tables (default_item_rules, rule_packs, trip_default_item_rules) 
-- are still needed for data storage and synchronization. 
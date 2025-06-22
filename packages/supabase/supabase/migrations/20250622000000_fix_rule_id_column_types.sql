-- ============================================================================
-- Migration: Fix rule_id column types for proper UUID references
-- Change rule_id from TEXT to UUID in trip_default_item_rules to match
-- the id column in default_item_rules table
-- ============================================================================

-- ============================================================================
-- Fix trip_default_item_rules.rule_id column type
-- ============================================================================

-- First, drop the existing constraint that depends on the column
ALTER TABLE public.trip_default_item_rules 
DROP CONSTRAINT IF EXISTS trip_default_item_rules_rule_id_not_empty;

-- Drop the unique constraint temporarily
ALTER TABLE public.trip_default_item_rules 
DROP CONSTRAINT IF EXISTS trip_default_item_rules_trip_id_rule_id_key;

-- Change the rule_id column from TEXT to UUID
-- This will fail if there's existing data that can't be converted
-- In a production environment, you'd need to migrate the data first
ALTER TABLE public.trip_default_item_rules 
ALTER COLUMN rule_id TYPE UUID USING rule_id::UUID;

-- Add back the unique constraint
ALTER TABLE public.trip_default_item_rules 
ADD CONSTRAINT trip_default_item_rules_trip_id_rule_id_key UNIQUE(trip_id, rule_id);

-- Add a proper foreign key constraint to ensure referential integrity
ALTER TABLE public.trip_default_item_rules
ADD CONSTRAINT fk_trip_default_item_rules_rule_id 
FOREIGN KEY (rule_id) REFERENCES public.default_item_rules(id) ON DELETE CASCADE;

-- ============================================================================
-- Update indexes to be more efficient with UUID type
-- ============================================================================

-- Drop and recreate the rule_id index for better UUID performance
DROP INDEX IF EXISTS idx_trip_default_item_rules_rule_id;
CREATE INDEX idx_trip_default_item_rules_rule_id ON public.trip_default_item_rules(rule_id);

-- Add a composite index for efficient trip-rule lookups
CREATE INDEX IF NOT EXISTS idx_trip_default_item_rules_trip_rule 
  ON public.trip_default_item_rules(trip_id, rule_id);

-- ============================================================================
-- Update comments to reflect the proper relationship
-- ============================================================================

COMMENT ON COLUMN public.trip_default_item_rules.rule_id IS 'Foreign key reference to default_item_rules.id (UUID)';
COMMENT ON TABLE public.trip_default_item_rules IS 'Associates trips with default item rules via proper UUID foreign key relationships';

-- ============================================================================
-- Migration Complete
-- ============================================================================ 
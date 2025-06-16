-- ============================================================================
-- Migration: Add original_rule_id field to default_item_rules
-- This field tracks the original rule ID when a rule is derived from a pack rule
-- ============================================================================

-- Add original_rule_id column to default_item_rules table
ALTER TABLE public.default_item_rules 
ADD COLUMN IF NOT EXISTS original_rule_id TEXT;

-- Add index for performance when looking up rules by original_rule_id
CREATE INDEX IF NOT EXISTS idx_default_item_rules_original_rule_id 
ON public.default_item_rules(original_rule_id) 
WHERE original_rule_id IS NOT NULL;

-- Add comment to document the field
COMMENT ON COLUMN public.default_item_rules.original_rule_id IS 'The original rule ID when this rule is derived from a pack rule';

-- ============================================================================
-- Migration Complete
-- ============================================================================ 
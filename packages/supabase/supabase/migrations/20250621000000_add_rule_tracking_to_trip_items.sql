-- ============================================================================
-- Add Rule Tracking to Trip Items
-- This migration adds rule_id and rule_hash columns to track which rules
-- generated which items, enabling proper invalidation when rules change
-- ============================================================================

-- Add rule_id and rule_hash columns to trip_items table
ALTER TABLE public.trip_items 
ADD COLUMN rule_id TEXT,
ADD COLUMN rule_hash TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.trip_items.rule_id IS 'ID of the rule that generated this item (for calculated items)';
COMMENT ON COLUMN public.trip_items.rule_hash IS 'Hash of the rule when this item was generated (for invalidation detection)';

-- Add index for efficient rule-based queries
CREATE INDEX idx_trip_items_rule_id ON public.trip_items(rule_id) WHERE rule_id IS NOT NULL;
CREATE INDEX idx_trip_items_rule_hash ON public.trip_items(rule_id, rule_hash) WHERE rule_id IS NOT NULL;

-- Add constraint to ensure rule_hash is present when rule_id is present
-- (allowing both to be NULL for manually added items)
ALTER TABLE public.trip_items 
ADD CONSTRAINT trip_items_rule_consistency 
CHECK (
  (rule_id IS NULL AND rule_hash IS NULL) OR 
  (rule_id IS NOT NULL AND rule_hash IS NOT NULL)
);

COMMENT ON CONSTRAINT trip_items_rule_consistency ON public.trip_items IS 
'Ensures rule_id and rule_hash are either both NULL (manual item) or both present (calculated item)'; 
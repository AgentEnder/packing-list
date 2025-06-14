-- ============================================================================
-- Migration: Add trip_default_item_rules table
-- This table links trips to default item rules to support
-- a many-to-many relationship between trips and user rules.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Trip Default Item Rules Join Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trip_default_item_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  rule_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT FALSE,

  CONSTRAINT trip_default_item_rules_rule_id_not_empty CHECK (LENGTH(TRIM(rule_id)) > 0),
  UNIQUE(trip_id, rule_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trip_default_item_rules_trip_id ON public.trip_default_item_rules(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_default_item_rules_rule_id ON public.trip_default_item_rules(rule_id);
CREATE INDEX IF NOT EXISTS idx_trip_default_item_rules_active ON public.trip_default_item_rules(trip_id) WHERE is_deleted = FALSE;

-- Updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_trip_default_item_rules_updated_at'
  ) THEN
    CREATE TRIGGER update_trip_default_item_rules_updated_at
      BEFORE UPDATE ON public.trip_default_item_rules
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- Row level security
ALTER TABLE public.trip_default_item_rules ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view trip default item rules'
  ) THEN
    CREATE POLICY "Users can view trip default item rules" ON public.trip_default_item_rules
      FOR SELECT USING (
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
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can modify trip default item rules'
  ) THEN
    CREATE POLICY "Users can modify trip default item rules" ON public.trip_default_item_rules
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.trips
          WHERE trips.id = trip_default_item_rules.trip_id
            AND trips.user_id = auth.uid()
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.trips
          WHERE trips.id = trip_default_item_rules.trip_id
            AND trips.user_id = auth.uid()
        )
      );
  END IF;
END$$;

-- Update sync_changes entity_type constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sync_changes_entity_type_valid'
  ) THEN
    ALTER TABLE public.sync_changes DROP CONSTRAINT sync_changes_entity_type_valid;
  END IF;
END$$;

ALTER TABLE public.sync_changes
ADD CONSTRAINT sync_changes_entity_type_valid
CHECK (
  entity_type IN (
    'trip',
    'trip_person',
    'trip_item',
    'trip_rule_override',
    'default_item_rule',
    'rule_pack',
    'trip_rule'
  )
);

COMMENT ON TABLE public.trip_default_item_rules IS 'Associates trips with default item rules';

-- ============================================================================
-- Migration Complete
-- ============================================================================

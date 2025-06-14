-- ============================================================================
-- Ensure packing rules tables exist and are properly configured
-- ============================================================================
-- This migration adds the default_item_rules and rule_packs tables with
-- supporting indexes, triggers and RLS policies. These tables store packing
-- rules so they can be synchronized across devices.

-- ---------------------------------------------------------------------------
-- Default Item Rules Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.default_item_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rule_id TEXT NOT NULL,
  name TEXT NOT NULL,
  calculation JSONB NOT NULL,
  conditions JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  category_id TEXT,
  subcategory_id TEXT,
  pack_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT FALSE,

  CONSTRAINT default_item_rules_rule_id_not_empty CHECK (LENGTH(TRIM(rule_id)) > 0),
  CONSTRAINT default_item_rules_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  UNIQUE(user_id, rule_id)
);

-- ---------------------------------------------------------------------------
-- Rule Packs Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rule_packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pack_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  author JSONB NOT NULL,
  metadata JSONB NOT NULL,
  stats JSONB NOT NULL,
  primary_category_id TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT FALSE,

  CONSTRAINT rule_packs_pack_id_not_empty CHECK (LENGTH(TRIM(pack_id)) > 0),
  CONSTRAINT rule_packs_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  UNIQUE(user_id, pack_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_default_item_rules_user_id ON public.default_item_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_default_item_rules_user_active ON public.default_item_rules(user_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_default_item_rules_rule_id ON public.default_item_rules(rule_id);

CREATE INDEX IF NOT EXISTS idx_rule_packs_user_id ON public.rule_packs(user_id);
CREATE INDEX IF NOT EXISTS idx_rule_packs_user_active ON public.rule_packs(user_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_rule_packs_pack_id ON public.rule_packs(pack_id);

-- ---------------------------------------------------------------------------
-- Updated At triggers (create only if missing)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_default_item_rules_updated_at'
  ) THEN
    CREATE TRIGGER update_default_item_rules_updated_at
      BEFORE UPDATE ON public.default_item_rules
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_rule_packs_updated_at'
  ) THEN
    CREATE TRIGGER update_rule_packs_updated_at
      BEFORE UPDATE ON public.rule_packs
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- ---------------------------------------------------------------------------
-- Row level security policies (create only if missing)
-- ---------------------------------------------------------------------------
ALTER TABLE public.default_item_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_packs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own default item rules') THEN
    CREATE POLICY "Users can view own default item rules" ON public.default_item_rules
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own default item rules') THEN
    CREATE POLICY "Users can insert own default item rules" ON public.default_item_rules
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own default item rules') THEN
    CREATE POLICY "Users can update own default item rules" ON public.default_item_rules
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own default item rules') THEN
    CREATE POLICY "Users can delete own default item rules" ON public.default_item_rules
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own rule packs') THEN
    CREATE POLICY "Users can view own rule packs" ON public.rule_packs
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own rule packs') THEN
    CREATE POLICY "Users can insert own rule packs" ON public.rule_packs
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own rule packs') THEN
    CREATE POLICY "Users can update own rule packs" ON public.rule_packs
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own rule packs') THEN
    CREATE POLICY "Users can delete own rule packs" ON public.rule_packs
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END$$;

-- ---------------------------------------------------------------------------
-- Update sync_changes entity type constraint
-- ---------------------------------------------------------------------------
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
    'rule_pack'
  )
);

-- ---------------------------------------------------------------------------
-- Add comments for documentation
-- ---------------------------------------------------------------------------
COMMENT ON TABLE public.default_item_rules IS 'User-defined packing rules for automatic item calculation';
COMMENT ON TABLE public.rule_packs IS 'Collections of packing rules organized by theme or trip type';

-- ============================================================================
-- Migration Complete
-- ============================================================================

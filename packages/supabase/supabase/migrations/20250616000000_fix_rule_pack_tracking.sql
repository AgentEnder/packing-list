-- ============================================================================
-- Migration: Fix Rule Pack Tracking
-- This migration updates the rule tracking system to properly handle
-- rule pack applications and avoid primary key conflicts while maintaining
-- lineage tracking.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Update default_item_rules table to better track rule pack origins
-- ---------------------------------------------------------------------------

-- Add columns to track rule pack lineage and origins
ALTER TABLE public.default_item_rules 
ADD COLUMN IF NOT EXISTS source_pack_id TEXT,
ADD COLUMN IF NOT EXISTS source_rule_id TEXT,
ADD COLUMN IF NOT EXISTS is_user_created BOOLEAN DEFAULT TRUE;

-- Add index for efficient lookups of rules from specific packs
CREATE INDEX IF NOT EXISTS idx_default_item_rules_source_pack ON public.default_item_rules(source_pack_id) WHERE source_pack_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_default_item_rules_source_rule ON public.default_item_rules(source_rule_id) WHERE source_rule_id IS NOT NULL;

-- Add comments to document the new fields
COMMENT ON COLUMN public.default_item_rules.source_pack_id IS 'ID of the rule pack this rule was originally copied from (if any)';
COMMENT ON COLUMN public.default_item_rules.source_rule_id IS 'Original rule ID within the source pack';
COMMENT ON COLUMN public.default_item_rules.is_user_created IS 'TRUE if created by user, FALSE if copied from a rule pack';

-- ---------------------------------------------------------------------------
-- Create a helper function to generate unique rule IDs for user instances
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_user_rule_id(
  user_uuid UUID,
  source_rule_id TEXT,
  source_pack_id TEXT
) RETURNS TEXT AS $$
BEGIN
  -- Generate a unique rule ID that combines user info, original rule, and pack
  -- Format: user_{first_8_chars_of_uuid}_{pack_id}_{rule_id}
  RETURN 'user_' || LEFT(user_uuid::TEXT, 8) || '_' || source_pack_id || '_' || source_rule_id;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ---------------------------------------------------------------------------
-- Add a function to safely apply rule packs without conflicts
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_rule_pack_to_trip(
  target_trip_id UUID,
  pack_id_param TEXT,
  rule_definitions JSONB
) RETURNS JSONB AS $$
DECLARE
  current_user_id UUID;
  rule_def JSONB;
  new_rule_id TEXT;
  existing_rule_id UUID;
  result JSONB := '{"applied_rules": [], "skipped_rules": []}'::JSONB;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to apply rule packs';
  END IF;

  -- Verify user owns the trip
  IF NOT EXISTS (
    SELECT 1 FROM public.trips 
    WHERE id = target_trip_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'User does not have permission to modify this trip';
  END IF;

  -- Process each rule in the pack
  FOR rule_def IN SELECT * FROM jsonb_array_elements(rule_definitions)
  LOOP
    -- Generate unique rule ID for this user's instance of the rule
    new_rule_id := public.generate_user_rule_id(
      current_user_id,
      rule_def->>'id',
      pack_id_param
    );

    -- Check if this rule already exists for this user
    SELECT id INTO existing_rule_id
    FROM public.default_item_rules
    WHERE user_id = current_user_id 
      AND rule_id = new_rule_id;

    IF existing_rule_id IS NULL THEN
      -- Create new rule instance
      INSERT INTO public.default_item_rules (
        user_id,
        rule_id,
        name,
        calculation,
        conditions,
        notes,
        category_id,
        subcategory_id,
        pack_ids,
        source_pack_id,
        source_rule_id,
        is_user_created
      ) VALUES (
        current_user_id,
        new_rule_id,
        rule_def->>'name',
        rule_def->'calculation',
        COALESCE(rule_def->'conditions', '[]'::jsonb),
        rule_def->>'notes',
        rule_def->>'categoryId',
        rule_def->>'subcategoryId',
        jsonb_build_array(jsonb_build_object('packId', pack_id_param, 'ruleId', rule_def->>'id')),
        pack_id_param,
        rule_def->>'id',
        FALSE
      );

      -- Link rule to trip
      INSERT INTO public.trip_default_item_rules (trip_id, rule_id)
      VALUES (target_trip_id, new_rule_id)
      ON CONFLICT (trip_id, rule_id) DO NOTHING;

      -- Add to applied rules
      result := jsonb_set(
        result,
        '{applied_rules}',
        (result->'applied_rules') || jsonb_build_array(new_rule_id)
      );
    ELSE
      -- Rule already exists, just link to trip if not already linked
      INSERT INTO public.trip_default_item_rules (trip_id, rule_id)
      VALUES (target_trip_id, new_rule_id)
      ON CONFLICT (trip_id, rule_id) DO NOTHING;

      -- Add to skipped rules
      result := jsonb_set(
        result,
        '{skipped_rules}',
        (result->'skipped_rules') || jsonb_build_array(new_rule_id)
      );
    END IF;
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- Add a function to remove rule pack from trip
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.remove_rule_pack_from_trip(
  target_trip_id UUID,
  pack_id_param TEXT
) RETURNS JSONB AS $$
DECLARE
  current_user_id UUID;
  removed_rules TEXT[];
  rule_record RECORD;
  result JSONB := '{"removed_rules": []}'::JSONB;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to remove rule packs';
  END IF;

  -- Verify user owns the trip
  IF NOT EXISTS (
    SELECT 1 FROM public.trips 
    WHERE id = target_trip_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'User does not have permission to modify this trip';
  END IF;

  -- Find all rules from this pack that are linked to this trip
  FOR rule_record IN
    SELECT dir.rule_id
    FROM public.default_item_rules dir
    JOIN public.trip_default_item_rules tdir ON dir.rule_id = tdir.rule_id
    WHERE dir.user_id = current_user_id
      AND tdir.trip_id = target_trip_id
      AND dir.source_pack_id = pack_id_param
      AND NOT dir.is_user_created
  LOOP
    -- Remove from trip
    DELETE FROM public.trip_default_item_rules
    WHERE trip_id = target_trip_id AND rule_id = rule_record.rule_id;

    -- Check if this rule is used in any other trips
    IF NOT EXISTS (
      SELECT 1 FROM public.trip_default_item_rules
      WHERE rule_id = rule_record.rule_id
    ) THEN
      -- Rule is not used anywhere else, delete it
      UPDATE public.default_item_rules
      SET is_deleted = TRUE, updated_at = NOW()
      WHERE rule_id = rule_record.rule_id AND user_id = current_user_id;
    END IF;

    -- Add to removed rules
    result := jsonb_set(
      result,
      '{removed_rules}',
      (result->'removed_rules') || jsonb_build_array(rule_record.rule_id)
    );
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- Create views for easier querying
-- ---------------------------------------------------------------------------

-- View to get rules applied to a trip with their pack origins
CREATE OR REPLACE VIEW public.trip_rules_with_pack_info AS
SELECT 
  t.id as trip_id,
  t.user_id,
  dir.id as rule_db_id,
  dir.rule_id,
  dir.name,
  dir.calculation,
  dir.conditions,
  dir.notes,
  dir.category_id,
  dir.subcategory_id,
  dir.pack_ids,
  dir.source_pack_id,
  dir.source_rule_id,
  dir.is_user_created,
  dir.created_at,
  dir.updated_at,
  dir.version
FROM public.trips t
JOIN public.trip_default_item_rules tdir ON t.id = tdir.trip_id
JOIN public.default_item_rules dir ON tdir.rule_id = dir.rule_id
WHERE t.is_deleted = FALSE 
  AND tdir.is_deleted = FALSE 
  AND dir.is_deleted = FALSE;

-- View to get pack application status for trips
CREATE OR REPLACE VIEW public.trip_pack_status AS
SELECT 
  trip_id,
  source_pack_id,
  COUNT(*) as applied_rules_count,
  array_agg(rule_id) as applied_rule_ids
FROM public.trip_rules_with_pack_info
WHERE source_pack_id IS NOT NULL
GROUP BY trip_id, source_pack_id;

-- ---------------------------------------------------------------------------
-- Grant permissions on new functions
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.generate_user_rule_id(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_rule_pack_to_trip(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_rule_pack_from_trip(UUID, TEXT) TO authenticated;

-- Grant access to new views
GRANT SELECT ON public.trip_rules_with_pack_info TO authenticated;
GRANT SELECT ON public.trip_pack_status TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================

COMMENT ON FUNCTION public.generate_user_rule_id IS 'Generates unique rule IDs for user instances of pack rules';
COMMENT ON FUNCTION public.apply_rule_pack_to_trip IS 'Safely applies a rule pack to a trip without ID conflicts';
COMMENT ON FUNCTION public.remove_rule_pack_from_trip IS 'Removes all rules from a specific pack from a trip';
COMMENT ON VIEW public.trip_rules_with_pack_info IS 'Rules applied to trips with pack origin information';
COMMENT ON VIEW public.trip_pack_status IS 'Pack application status for trips';

-- ============================================================================
-- Additional Migration Complete
-- ============================================================================ 
-- ============================================================================
-- Migration: Add function to retrieve user rule packs
-- This provides a helper for fetching all non-deleted rule packs for a user
-- sorted by most recently updated. It complements the packing rules sync logic.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_rule_packs(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  pack_id TEXT,
  name TEXT,
  description TEXT,
  author JSONB,
  metadata JSONB,
  stats JSONB,
  primary_category_id TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.pack_id,
    p.name,
    p.description,
    p.author,
    p.metadata,
    p.stats,
    p.primary_category_id,
    p.icon,
    p.color,
    p.created_at,
    p.updated_at
  FROM public.rule_packs p
  WHERE p.user_id = user_uuid
    AND p.is_deleted = FALSE
  ORDER BY p.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Migration Complete
-- ============================================================================

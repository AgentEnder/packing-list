-- Sprint 2: Profile Auto-Added to Trips
-- Add user_person_id column to trip_people table to link trip people to user profile templates

ALTER TABLE public.trip_people 
ADD COLUMN IF NOT EXISTS user_person_id UUID REFERENCES public.user_people(id) ON DELETE SET NULL;

-- Add index for performance when querying by user_person_id
CREATE INDEX IF NOT EXISTS idx_trip_people_user_person_id ON public.trip_people(user_person_id);

-- Add comment for documentation
COMMENT ON COLUMN public.trip_people.user_person_id IS 'Reference to user_people table for profile-based people (Sprint 2)';

-- Update sync_changes constraint to include 'user_person' entity type if needed
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
    'trip_rule',
    'user_person'
  )
);

-- ============================================================================
-- Migration Complete
-- ============================================================================ 
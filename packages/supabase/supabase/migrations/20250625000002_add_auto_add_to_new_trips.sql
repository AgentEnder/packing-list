-- Sprint 3: Add auto-add functionality for templates
-- Add column to enable templates to be automatically added to new trips

-- Add the new column
ALTER TABLE public.user_people 
ADD COLUMN auto_add_to_new_trips BOOLEAN DEFAULT FALSE;

-- Set user profiles to auto-add by default (they should always be added to new trips)
UPDATE public.user_people 
SET auto_add_to_new_trips = TRUE 
WHERE is_user_profile = TRUE;

-- Add comment to explain the column
COMMENT ON COLUMN public.user_people.auto_add_to_new_trips IS 'When TRUE, this template will be automatically added to new trips';

-- Add index for querying templates that should be auto-added
CREATE INDEX IF NOT EXISTS idx_user_people_auto_add ON public.user_people(user_id, auto_add_to_new_trips) 
WHERE is_deleted = FALSE AND auto_add_to_new_trips = TRUE;

-- ============================================================================
-- Migration Complete - Sprint 3: Auto-add templates to new trips
-- ============================================================================ 
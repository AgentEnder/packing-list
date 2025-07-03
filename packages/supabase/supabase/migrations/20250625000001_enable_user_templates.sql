-- Sprint 3: Person Templates & Reuse
-- Update database schema to support multiple people per user (templates + profile)

-- Drop the constraint that limits one profile per user
-- This allows users to have both a profile AND multiple templates
ALTER TABLE public.user_people 
DROP CONSTRAINT IF EXISTS user_people_one_profile_per_user;

-- Update comment to reflect Sprint 3 functionality
COMMENT ON COLUMN public.user_people.is_user_profile IS 'TRUE for user profile, FALSE for person templates (Sprint 3)';

-- Add a new constraint to ensure only ONE profile per user, but allow multiple templates
-- This replaces the old constraint with one that's more specific
ALTER TABLE public.user_people 
ADD CONSTRAINT user_people_one_profile_per_user_only 
  EXCLUDE (user_id WITH =) 
  WHERE (is_user_profile = TRUE AND is_deleted = FALSE)
  DEFERRABLE INITIALLY DEFERRED;

-- Add performance index for template queries
CREATE INDEX IF NOT EXISTS idx_user_people_templates ON public.user_people(user_id) 
WHERE is_user_profile = FALSE AND is_deleted = FALSE;

-- Add index for user people name search (for template suggestions)
CREATE INDEX IF NOT EXISTS idx_user_people_name_search ON public.user_people 
USING gin (to_tsvector('english', name))
WHERE is_deleted = FALSE;

-- Add function to validate user people constraints
CREATE OR REPLACE FUNCTION validate_user_people_constraints()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure user can't delete their last profile if they have trip people linked to profiles
  IF OLD.is_user_profile = TRUE AND NEW.is_deleted = TRUE THEN
    IF EXISTS (
      SELECT 1 FROM public.trip_people 
      WHERE user_person_id = OLD.id 
      AND is_deleted = FALSE
    ) THEN
      -- Check if user has another profile
      IF NOT EXISTS (
        SELECT 1 FROM public.user_people
        WHERE user_id = OLD.user_id 
        AND is_user_profile = TRUE 
        AND id != OLD.id 
        AND is_deleted = FALSE
      ) THEN
        RAISE EXCEPTION 'Cannot delete user profile that is linked to trip people without another profile';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for validation
DROP TRIGGER IF EXISTS validate_user_people_constraints_trigger ON public.user_people;
CREATE TRIGGER validate_user_people_constraints_trigger
  BEFORE UPDATE ON public.user_people
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_people_constraints();

-- ============================================================================
-- Migration Complete - Sprint 3: Enhanced User People Support
-- ============================================================================ 
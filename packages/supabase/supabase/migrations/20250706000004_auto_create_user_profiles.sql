-- Add name and email fields to user_profiles table for easy access to user display information
-- This allows us to lookup user names for trip members without the complexity of user_people

-- Add name and email columns to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Update the existing handle_new_user function to populate name and email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user_profiles record with name and email populated
  INSERT INTO public.user_profiles (
    id,
    name,
    email,
    preferences
  ) VALUES (
    NEW.id,
    -- Extract name from user metadata, fallback to email prefix
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1) -- Use email prefix as fallback
    ),
    NEW.email,
    '{
      "defaultTimeZone": "UTC",
      "theme": "system",
      "defaultTripDuration": 7,
      "autoSyncEnabled": true
    }'::jsonb
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill existing user_profiles with name and email from auth.users
UPDATE public.user_profiles
SET 
    name = COALESCE(
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name', 
        u.raw_user_meta_data->>'display_name',
        split_part(u.email, '@', 1)
    ),
    email = u.email,
    updated_at = NOW()
FROM auth.users u
WHERE user_profiles.id = u.id
AND u.email IS NOT NULL
AND (user_profiles.name IS NULL OR user_profiles.email IS NULL);

-- Log the results
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.user_profiles
    WHERE name IS NOT NULL AND email IS NOT NULL;
    
    RAISE NOTICE 'Total user profiles with name and email populated: %', v_count;
END $$;
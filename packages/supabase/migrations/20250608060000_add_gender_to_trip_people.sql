-- Add gender field to trip_people table for packing rule conditions
-- Gender is important for clothing and other gender-specific packing items

ALTER TABLE public.trip_people 
ADD COLUMN IF NOT EXISTS gender TEXT;

-- Add constraint to ensure valid gender values
-- Add the constraint only if it doesn't already exist. Older migrations may
-- have already created it during table creation.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'trip_people_gender_valid'
  ) THEN
    ALTER TABLE public.trip_people
    ADD CONSTRAINT trip_people_gender_valid
    CHECK (
      gender IS NULL
      OR gender IN ('male', 'female', 'other', 'prefer-not-to-say')
    );
  END IF;
END $$;

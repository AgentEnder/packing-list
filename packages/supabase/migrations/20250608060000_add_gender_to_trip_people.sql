-- Add gender field to trip_people table for packing rule conditions
-- Gender is important for clothing and other gender-specific packing items

ALTER TABLE public.trip_people 
ADD COLUMN IF NOT EXISTS gender TEXT;

-- Add constraint to ensure valid gender values
ALTER TABLE public.trip_people 
ADD CONSTRAINT trip_people_gender_valid 
CHECK (gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer-not-to-say')); 
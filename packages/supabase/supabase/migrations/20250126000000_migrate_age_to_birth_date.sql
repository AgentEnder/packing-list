-- Migration: Replace age column with birth_date for user_people table
-- Convert age to estimated birth_date and change the column type

-- Add the new birth_date column
ALTER TABLE public.user_people 
ADD COLUMN birth_date DATE;

-- Drop the old age column and its constraint
ALTER TABLE public.user_people 
DROP CONSTRAINT IF EXISTS user_people_age_valid;

ALTER TABLE public.user_people 
DROP COLUMN age;

-- Add constraint for birth_date (must be in the past and not more than 150 years ago)
ALTER TABLE public.user_people 
ADD CONSTRAINT user_people_birth_date_valid 
CHECK (birth_date IS NULL OR (
    birth_date <= CURRENT_DATE
));
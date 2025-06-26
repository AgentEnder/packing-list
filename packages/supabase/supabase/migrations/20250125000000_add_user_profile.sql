-- User Profile Management (Sprint 1)
-- Create user_people table for user profiles (profile-focused)

CREATE TABLE public.user_people (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  is_user_profile BOOLEAN DEFAULT TRUE, -- Sprint 1: Start with only user profiles
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT FALSE,

  -- Constraints
  CONSTRAINT user_people_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT user_people_age_valid CHECK (age IS NULL OR (age >= 0 AND age <= 150)),
  CONSTRAINT user_people_gender_valid CHECK (gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer-not-to-say')),
  CONSTRAINT user_people_one_profile_per_user UNIQUE (user_id, is_user_profile) DEFERRABLE INITIALLY DEFERRED
);

-- Performance indexes for user profile queries
CREATE INDEX idx_user_people_user_id ON public.user_people(user_id);
CREATE INDEX idx_user_people_user_active ON public.user_people(user_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_user_people_profile ON public.user_people(user_id, is_user_profile) WHERE is_user_profile = TRUE;

-- Enable RLS
ALTER TABLE public.user_people ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_people
CREATE POLICY "Users can view their own people" ON public.user_people
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own people" ON public.user_people
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own people" ON public.user_people
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own people" ON public.user_people
  FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_user_people_updated_at
  BEFORE UPDATE ON public.user_people
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at(); 
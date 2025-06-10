-- ============================================================================
-- Multi-Trip Architecture Database Schema
-- ============================================================================
-- This migration sets up the complete schema for supporting multiple trips
-- per user with offline-first sync capabilities

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- User Profiles Table (extends auth.users)
-- ============================================================================
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  preferences JSONB DEFAULT '{
    "defaultTimeZone": "UTC",
    "theme": "system",
    "defaultTripDuration": 7,
    "autoSyncEnabled": true
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Trips Table
-- ============================================================================
CREATE TABLE public.trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  days JSONB DEFAULT '[]'::jsonb,
  trip_events JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{
    "defaultTimeZone": "UTC",
    "packingViewMode": "by-day"
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT trips_title_not_empty CHECK (LENGTH(TRIM(title)) > 0)
);

-- ============================================================================
-- Trip People Table
-- ============================================================================
CREATE TABLE public.trip_people (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT trip_people_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT trip_people_age_valid CHECK (age IS NULL OR (age >= 0 AND age <= 150)),
  CONSTRAINT trip_people_gender_valid CHECK (gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer-not-to-say'))
);

-- ============================================================================
-- Trip Items Table
-- ============================================================================
CREATE TABLE public.trip_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  quantity INTEGER DEFAULT 1,
  packed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  person_id UUID REFERENCES public.trip_people(id) ON DELETE SET NULL,
  day_index INTEGER, -- Which day this item is for (0-based index)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT trip_items_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT trip_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT trip_items_day_index_valid CHECK (day_index IS NULL OR day_index >= 0)
);

-- ============================================================================
-- Trip Rule Overrides Table
-- ============================================================================
CREATE TABLE public.trip_rule_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  rule_id TEXT NOT NULL,
  override_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT trip_rule_overrides_rule_id_not_empty CHECK (LENGTH(TRIM(rule_id)) > 0),
  UNIQUE(trip_id, rule_id)
);

-- ============================================================================
-- Sync Changes Table (for conflict resolution and audit trail)
-- ============================================================================
CREATE TABLE public.sync_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  operation TEXT NOT NULL,
  data JSONB NOT NULL,
  version INTEGER NOT NULL,
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT sync_changes_entity_type_valid CHECK (entity_type IN ('trip', 'trip_person', 'trip_item', 'trip_rule_override')),
  CONSTRAINT sync_changes_operation_valid CHECK (operation IN ('create', 'update', 'delete'))
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_updated_at ON public.user_profiles(updated_at);

-- Trips indexes
CREATE INDEX idx_trips_user_id ON public.trips(user_id);
CREATE INDEX idx_trips_user_updated ON public.trips(user_id, updated_at);
CREATE INDEX idx_trips_user_active ON public.trips(user_id) WHERE is_deleted = FALSE;

-- Trip people indexes
CREATE INDEX idx_trip_people_trip_id ON public.trip_people(trip_id);
CREATE INDEX idx_trip_people_trip_active ON public.trip_people(trip_id) WHERE is_deleted = FALSE;

-- Trip items indexes
CREATE INDEX idx_trip_items_trip_id ON public.trip_items(trip_id);
CREATE INDEX idx_trip_items_person_id ON public.trip_items(person_id);
CREATE INDEX idx_trip_items_trip_active ON public.trip_items(trip_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_trip_items_trip_day ON public.trip_items(trip_id, day_index);

-- Trip rule overrides indexes
CREATE INDEX idx_trip_rule_overrides_trip_id ON public.trip_rule_overrides(trip_id);
CREATE INDEX idx_trip_rule_overrides_trip_active ON public.trip_rule_overrides(trip_id) WHERE is_deleted = FALSE;

-- Sync changes indexes
CREATE INDEX idx_sync_changes_user_timestamp ON public.sync_changes(user_id, created_at);
CREATE INDEX idx_sync_changes_entity ON public.sync_changes(entity_type, entity_id);
CREATE INDEX idx_sync_changes_user_entity ON public.sync_changes(user_id, entity_type, entity_id);

-- ============================================================================
-- Updated At Trigger Function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON public.user_profiles 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trips_updated_at 
  BEFORE UPDATE ON public.trips 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trip_people_updated_at 
  BEFORE UPDATE ON public.trip_people 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trip_items_updated_at 
  BEFORE UPDATE ON public.trip_items 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trip_rule_overrides_updated_at 
  BEFORE UPDATE ON public.trip_rule_overrides 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sync_changes_updated_at 
  BEFORE UPDATE ON public.sync_changes 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_rule_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_changes ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trips Policies
CREATE POLICY "Users can view own trips" ON public.trips
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips" ON public.trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips" ON public.trips
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips" ON public.trips
  FOR DELETE USING (auth.uid() = user_id);

-- Trip People Policies (access through trip ownership)
CREATE POLICY "Users can view trip people for own trips" ON public.trip_people
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_people.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert trip people for own trips" ON public.trip_people
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_people.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update trip people for own trips" ON public.trip_people
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_people.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete trip people for own trips" ON public.trip_people
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_people.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

-- Trip Items Policies (access through trip ownership)
CREATE POLICY "Users can view trip items for own trips" ON public.trip_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_items.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert trip items for own trips" ON public.trip_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_items.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update trip items for own trips" ON public.trip_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_items.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete trip items for own trips" ON public.trip_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_items.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

-- Trip Rule Overrides Policies (access through trip ownership)
CREATE POLICY "Users can view trip rule overrides for own trips" ON public.trip_rule_overrides
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_rule_overrides.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert trip rule overrides for own trips" ON public.trip_rule_overrides
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_rule_overrides.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update trip rule overrides for own trips" ON public.trip_rule_overrides
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_rule_overrides.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete trip rule overrides for own trips" ON public.trip_rule_overrides
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_rule_overrides.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

-- Sync Changes Policies
CREATE POLICY "Users can view own sync changes" ON public.sync_changes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync changes" ON public.sync_changes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to create a user profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get user's trips summary
CREATE OR REPLACE FUNCTION public.get_user_trips_summary(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  trip_id UUID,
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  total_items BIGINT,
  packed_items BIGINT,
  total_people BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as trip_id,
    t.title,
    t.description,
    t.created_at,
    t.updated_at,
    COALESCE(items.total_items, 0) as total_items,
    COALESCE(items.packed_items, 0) as packed_items,
    COALESCE(people.total_people, 0) as total_people
  FROM public.trips t
  LEFT JOIN (
    SELECT 
      trip_id,
      COUNT(*) as total_items,
      COUNT(*) FILTER (WHERE packed = true) as packed_items
    FROM public.trip_items
    WHERE is_deleted = false
    GROUP BY trip_id
  ) items ON items.trip_id = t.id
  LEFT JOIN (
    SELECT 
      trip_id,
      COUNT(*) as total_people
    FROM public.trip_people
    WHERE is_deleted = false
    GROUP BY trip_id
  ) people ON people.trip_id = t.id
  WHERE t.user_id = user_uuid 
    AND t.is_deleted = false
  ORDER BY t.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Add comment to track migration
COMMENT ON SCHEMA public IS 'Multi-trip architecture schema - supports offline-first sync';

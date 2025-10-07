-- ============================================================================
-- Trip Users Table - Multi-User Trip Support
-- ============================================================================
-- This migration adds support for sharing trips between multiple users
-- with role-based access control

-- ============================================================================
-- Trip Users Join Table
-- ============================================================================
CREATE TABLE public.trip_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'viewer',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Either user_id or email must be provided (for pending invitations)
  CONSTRAINT trip_users_user_or_email CHECK (
    (user_id IS NOT NULL) OR (email IS NOT NULL)
  ),
  
  -- Valid roles: owner, editor, viewer
  CONSTRAINT trip_users_role_valid CHECK (
    role IN ('owner', 'editor', 'viewer')
  ),
  
  -- Unique constraint: one user per trip (by user_id)
  CONSTRAINT trip_users_unique_user_trip UNIQUE (trip_id, user_id),
  
  -- Unique constraint: one email per trip (for pending invitations)
  CONSTRAINT trip_users_unique_email_trip UNIQUE (trip_id, email)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================
CREATE INDEX idx_trip_users_trip_id ON public.trip_users(trip_id);
CREATE INDEX idx_trip_users_user_id ON public.trip_users(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_trip_users_email ON public.trip_users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_trip_users_pending ON public.trip_users(email) WHERE accepted_at IS NULL AND email IS NOT NULL;

-- ============================================================================
-- Triggers for Automatic updated_at
-- ============================================================================
CREATE TRIGGER update_trip_users_updated_at 
  BEFORE UPDATE ON public.trip_users 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Function to Migrate Existing Trip Ownership to trip_users
-- ============================================================================
-- This function populates the trip_users table with existing trip owners
CREATE OR REPLACE FUNCTION public.migrate_trip_ownership()
RETURNS void AS $$
BEGIN
  -- Insert trip owners into trip_users table
  INSERT INTO public.trip_users (trip_id, user_id, role, accepted_at, invited_by)
  SELECT 
    t.id as trip_id,
    t.user_id,
    'owner' as role,
    t.created_at as accepted_at,
    t.user_id as invited_by
  FROM public.trips t
  WHERE NOT EXISTS (
    SELECT 1 FROM public.trip_users tu 
    WHERE tu.trip_id = t.id AND tu.user_id = t.user_id
  );
  
  RAISE NOTICE 'Migrated % trip owners to trip_users table', 
    (SELECT COUNT(*) FROM public.trips);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the migration
SELECT public.migrate_trip_ownership();

-- ============================================================================
-- Helper Function to Get User Role for a Trip
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_trip_role(
  target_trip_id UUID,
  target_user_id UUID
)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Check trip_users table first
  SELECT role INTO user_role
  FROM public.trip_users
  WHERE trip_id = target_trip_id 
    AND user_id = target_user_id
    AND accepted_at IS NOT NULL;
  
  -- If not found in trip_users, check if user is the trip owner (legacy support)
  IF user_role IS NULL THEN
    SELECT 'owner' INTO user_role
    FROM public.trips
    WHERE id = target_trip_id 
      AND user_id = target_user_id;
  END IF;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Helper Function to Check if User Can Edit Trip
-- ============================================================================
CREATE OR REPLACE FUNCTION public.user_can_edit_trip(
  target_trip_id UUID,
  target_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := public.get_user_trip_role(target_trip_id, target_user_id);
  RETURN user_role IN ('owner', 'editor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Helper Function to Check if User Can View Trip
-- ============================================================================
CREATE OR REPLACE FUNCTION public.user_can_view_trip(
  target_trip_id UUID,
  target_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := public.get_user_trip_role(target_trip_id, target_user_id);
  RETURN user_role IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on trip_users table
ALTER TABLE public.trip_users ENABLE ROW LEVEL SECURITY;

-- Users can view trip_users entries for trips they have access to
CREATE POLICY "Users can view trip_users for accessible trips" ON public.trip_users
  FOR SELECT USING (
    public.user_can_view_trip(trip_id, auth.uid())
  );

-- Only trip owners can insert new trip_users entries
CREATE POLICY "Trip owners can add users to trips" ON public.trip_users
  FOR INSERT WITH CHECK (
    public.get_user_trip_role(trip_id, auth.uid()) = 'owner'
  );

-- Only trip owners can update trip_users entries
CREATE POLICY "Trip owners can update trip users" ON public.trip_users
  FOR UPDATE USING (
    public.get_user_trip_role(trip_id, auth.uid()) = 'owner'
  );

-- Only trip owners can delete trip_users entries
CREATE POLICY "Trip owners can remove users from trips" ON public.trip_users
  FOR DELETE USING (
    public.get_user_trip_role(trip_id, auth.uid()) = 'owner'
  );

-- ============================================================================
-- Update Trips RLS Policies to Support Shared Access
-- ============================================================================

-- Drop existing trip policies
DROP POLICY IF EXISTS "Users can view own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can insert own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can update own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can delete own trips" ON public.trips;

-- Users can view trips they have access to (owner or shared)
CREATE POLICY "Users can view accessible trips" ON public.trips
  FOR SELECT USING (
    auth.uid() = user_id OR public.user_can_view_trip(id, auth.uid())
  );

-- Users can insert their own trips
CREATE POLICY "Users can create trips" ON public.trips
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Users can update trips they can edit
CREATE POLICY "Users can update editable trips" ON public.trips
  FOR UPDATE USING (
    auth.uid() = user_id OR public.user_can_edit_trip(id, auth.uid())
  );

-- Only trip owners can delete trips
CREATE POLICY "Trip owners can delete trips" ON public.trips
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- ============================================================================
-- Update Trip People RLS Policies to Support Shared Access
-- ============================================================================

-- Drop existing trip_people policies
DROP POLICY IF EXISTS "Users can view trip people for own trips" ON public.trip_people;
DROP POLICY IF EXISTS "Users can insert trip people for own trips" ON public.trip_people;
DROP POLICY IF EXISTS "Users can update trip people for own trips" ON public.trip_people;
DROP POLICY IF EXISTS "Users can delete trip people for own trips" ON public.trip_people;

-- Users can view trip people for accessible trips
CREATE POLICY "Users can view trip people for accessible trips" ON public.trip_people
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_people.trip_id 
      AND (trips.user_id = auth.uid() OR public.user_can_view_trip(trips.id, auth.uid()))
    )
  );

-- Users can insert trip people for editable trips
CREATE POLICY "Users can insert trip people for editable trips" ON public.trip_people
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_people.trip_id 
      AND (trips.user_id = auth.uid() OR public.user_can_edit_trip(trips.id, auth.uid()))
    )
  );

-- Users can update trip people for editable trips
CREATE POLICY "Users can update trip people for editable trips" ON public.trip_people
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_people.trip_id 
      AND (trips.user_id = auth.uid() OR public.user_can_edit_trip(trips.id, auth.uid()))
    )
  );

-- Users can delete trip people for editable trips
CREATE POLICY "Users can delete trip people for editable trips" ON public.trip_people
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_people.trip_id 
      AND (trips.user_id = auth.uid() OR public.user_can_edit_trip(trips.id, auth.uid()))
    )
  );

-- ============================================================================
-- Update Trip Items RLS Policies to Support Shared Access
-- ============================================================================

-- Drop existing trip_items policies
DROP POLICY IF EXISTS "Users can view trip items for own trips" ON public.trip_items;
DROP POLICY IF EXISTS "Users can insert trip items for own trips" ON public.trip_items;
DROP POLICY IF EXISTS "Users can update trip items for own trips" ON public.trip_items;
DROP POLICY IF EXISTS "Users can delete trip items for own trips" ON public.trip_items;

-- Users can view trip items for accessible trips
CREATE POLICY "Users can view trip items for accessible trips" ON public.trip_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_items.trip_id 
      AND (trips.user_id = auth.uid() OR public.user_can_view_trip(trips.id, auth.uid()))
    )
  );

-- Users can insert trip items for editable trips
CREATE POLICY "Users can insert trip items for editable trips" ON public.trip_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_items.trip_id 
      AND (trips.user_id = auth.uid() OR public.user_can_edit_trip(trips.id, auth.uid()))
    )
  );

-- All users with access can update trip items (to mark as packed)
-- But we'll add application-level restrictions for editors vs viewers
CREATE POLICY "Users can update trip items for accessible trips" ON public.trip_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_items.trip_id 
      AND (trips.user_id = auth.uid() OR public.user_can_view_trip(trips.id, auth.uid()))
    )
  );

-- Users can delete trip items for editable trips
CREATE POLICY "Users can delete trip items for editable trips" ON public.trip_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_items.trip_id 
      AND (trips.user_id = auth.uid() OR public.user_can_edit_trip(trips.id, auth.uid()))
    )
  );

-- ============================================================================
-- Update Trip Rule Overrides RLS Policies to Support Shared Access
-- ============================================================================

-- Drop existing trip_rule_overrides policies
DROP POLICY IF EXISTS "Users can view trip rule overrides for own trips" ON public.trip_rule_overrides;
DROP POLICY IF EXISTS "Users can insert trip rule overrides for own trips" ON public.trip_rule_overrides;
DROP POLICY IF EXISTS "Users can update trip rule overrides for own trips" ON public.trip_rule_overrides;
DROP POLICY IF EXISTS "Users can delete trip rule overrides for own trips" ON public.trip_rule_overrides;

-- Users can view trip rule overrides for accessible trips
CREATE POLICY "Users can view rule overrides for accessible trips" ON public.trip_rule_overrides
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_rule_overrides.trip_id 
      AND (trips.user_id = auth.uid() OR public.user_can_view_trip(trips.id, auth.uid()))
    )
  );

-- Users can insert trip rule overrides for editable trips
CREATE POLICY "Users can insert rule overrides for editable trips" ON public.trip_rule_overrides
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_rule_overrides.trip_id 
      AND (trips.user_id = auth.uid() OR public.user_can_edit_trip(trips.id, auth.uid()))
    )
  );

-- Users can update trip rule overrides for editable trips
CREATE POLICY "Users can update rule overrides for editable trips" ON public.trip_rule_overrides
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_rule_overrides.trip_id 
      AND (trips.user_id = auth.uid() OR public.user_can_edit_trip(trips.id, auth.uid()))
    )
  );

-- Users can delete trip rule overrides for editable trips
CREATE POLICY "Users can delete rule overrides for editable trips" ON public.trip_rule_overrides
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_rule_overrides.trip_id 
      AND (trips.user_id = auth.uid() OR public.user_can_edit_trip(trips.id, auth.uid()))
    )
  );

-- ============================================================================
-- Grant Permissions on Helper Functions
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.migrate_trip_ownership() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_trip_role(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_edit_trip(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_view_trip(UUID, UUID) TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================
COMMENT ON TABLE public.trip_users IS 'Multi-user trip sharing with role-based access control';

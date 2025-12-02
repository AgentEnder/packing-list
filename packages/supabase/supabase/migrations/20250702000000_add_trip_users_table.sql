-- Create trip_users table for multi-user trip collaboration
CREATE TABLE trip_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'editor')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

-- Create indexes for performance
CREATE INDEX idx_trip_users_trip_id ON trip_users(trip_id) WHERE NOT is_deleted;
CREATE INDEX idx_trip_users_user_id ON trip_users(user_id) WHERE NOT is_deleted;
CREATE INDEX idx_trip_users_email ON trip_users(email) WHERE NOT is_deleted;
CREATE INDEX idx_trip_users_status ON trip_users(status) WHERE NOT is_deleted;

-- Create unique constraints to prevent duplicate invitations
CREATE UNIQUE INDEX idx_trip_users_trip_user_unique ON trip_users(trip_id, user_id) WHERE NOT is_deleted;
CREATE UNIQUE INDEX idx_trip_users_trip_email_unique ON trip_users(trip_id, email) WHERE NOT is_deleted;

-- Enable RLS
ALTER TABLE trip_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trip_users table

-- Users can see trip memberships for trips they have access to
CREATE POLICY "Users can view trip memberships" ON trip_users
    FOR SELECT
    USING (
        -- User is the trip owner
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = trip_users.trip_id 
            AND trips.user_id = auth.uid()
            AND NOT trips.is_deleted
        )
        OR
        -- User is a member of the trip
        EXISTS (
            SELECT 1 FROM trip_users tu2
            WHERE tu2.trip_id = trip_users.trip_id
            AND tu2.user_id = auth.uid()
            AND tu2.status = 'accepted'
            AND NOT tu2.is_deleted
        )
        OR
        -- User has a pending invitation (by email or user_id)
        (
            trip_users.user_id = auth.uid() 
            OR trip_users.email = auth.email()
        )
        AND trip_users.status = 'pending'
    );

-- Trip owners can insert new members
CREATE POLICY "Trip owners can invite users" ON trip_users
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM trips
            WHERE trips.id = trip_users.trip_id
            AND trips.user_id = auth.uid()
            AND NOT trips.is_deleted
        )
    );

-- Trip owners can update memberships, users can update their own invitations
CREATE POLICY "Update trip memberships" ON trip_users
    FOR UPDATE
    USING (
        -- Trip owner can update any membership
        EXISTS (
            SELECT 1 FROM trips
            WHERE trips.id = trip_users.trip_id
            AND trips.user_id = auth.uid()
            AND NOT trips.is_deleted
        )
        OR
        -- User can update their own invitation status
        (
            (trip_users.user_id = auth.uid() OR trip_users.email = auth.email())
            AND trip_users.status = 'pending'
        )
    );

-- Trip owners can delete memberships
CREATE POLICY "Trip owners can remove users" ON trip_users
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM trips
            WHERE trips.id = trip_users.trip_id
            AND trips.user_id = auth.uid()
            AND NOT trips.is_deleted
        )
    );

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_trip_users_updated_at
    BEFORE UPDATE ON trip_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
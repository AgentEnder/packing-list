# Trip Invitations & Multi-User Trips

## Overview

The packing list application now supports sharing trips with multiple users. Trip owners can invite other users to view or collaborate on trips with role-based access control.

## Features

### Role-Based Access Control

Three roles are supported:

- **Owner**: Full control over the trip
  - Can edit all trip content
  - Can manage trip members
  - Can delete the trip
  - Can change user roles

- **Editor**: Can modify trip content
  - Can add/edit/delete items
  - Can add/edit/delete people
  - Can add/edit/delete packing rules
  - Cannot manage trip members
  - Cannot delete the trip

- **Viewer**: Read-only with limited updates
  - Can view all trip content
  - Can update packed status of items
  - Cannot add/edit/delete content
  - Cannot manage trip members

### Invitation Flow

#### Email-Based Invitations

1. **Invite by Email**: Trip owners can invite users by email address
   - If the user has an account, they are added immediately
   - If the user doesn't have an account, a pending invitation is created
   
2. **Pending Invitations**: Stored in the database with email address
   - When a user signs up with the invited email, the invitation is automatically linked
   
3. **Accepting Invitations**: 
   - Users can accept invitations when they log in
   - Pending invitations are converted to active trip memberships

#### Direct User Addition

Trip owners can add existing users directly by their user ID (useful for admin tools or when email is already known to exist).

## Database Schema

### trip_users Table

```sql
CREATE TABLE public.trip_users (
  id UUID PRIMARY KEY,
  trip_id UUID REFERENCES trips(id),
  user_id UUID REFERENCES auth.users(id),  -- NULL for pending invitations
  email TEXT,                               -- Used for pending invitations
  role TEXT NOT NULL,                       -- 'owner' | 'editor' | 'viewer'
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,                  -- NULL for pending invitations
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  
  -- Either user_id or email must be provided
  CONSTRAINT trip_users_user_or_email CHECK (
    (user_id IS NOT NULL) OR (email IS NOT NULL)
  )
);
```

### Row Level Security (RLS)

All trip-related tables have been updated to support multi-user access:

- **trips**: Users can view/edit trips they own or have been granted access to
- **trip_people**: Accessible based on trip access
- **trip_items**: Accessible based on trip access (viewers can update packed status)
- **trip_rule_overrides**: Accessible based on trip access

### Helper Functions

The migration includes several PostgreSQL functions:

- `get_user_trip_role(trip_id, user_id)`: Returns the user's role for a trip
- `user_can_edit_trip(trip_id, user_id)`: Returns true if user can edit
- `user_can_view_trip(trip_id, user_id)`: Returns true if user can view
- `migrate_trip_ownership()`: Migrates existing trip owners to the new system

## API Usage

### TripUsersService

The `TripUsersService` class provides methods for managing trip users:

```typescript
import { TripUsersService } from '@packing-list/supabase';

// Get all users for a trip
const users = await TripUsersService.getTripUsers(tripId);

// Get only accepted users (excludes pending invitations)
const acceptedUsers = await TripUsersService.getAcceptedTripUsers(tripId);

// Get pending invitations
const pendingInvites = await TripUsersService.getPendingInvitations(tripId);

// Invite a user by email
const invitation = await TripUsersService.inviteUserToTrip(
  tripId,
  'user@example.com',
  'viewer',
  currentUserId
);

// Add an existing user directly
const tripUser = await TripUsersService.addUserToTrip(
  tripId,
  userId,
  'editor',
  currentUserId
);

// Update a user's role
const updated = await TripUsersService.updateTripUserRole(
  tripUserId,
  'editor'
);

// Remove a user from a trip
await TripUsersService.removeUserFromTrip(tripUserId);

// Accept a pending invitation
const accepted = await TripUsersService.acceptInvitation(
  tripId,
  userId,
  email
);

// Check permissions
const role = await TripUsersService.getUserTripRole(tripId, userId);
const canEdit = await TripUsersService.canUserEditTrip(tripId, userId);
const canView = await TripUsersService.canUserViewTrip(tripId, userId);
```

## TypeScript Types

```typescript
import type { TripUser, TripRole } from '@packing-list/model';

// TripUser type
type TripUser = {
  id: string;
  tripId: string;
  userId?: string;
  email?: string;
  role: TripRole;
  invitedAt: string;
  acceptedAt?: string;
  invitedBy?: string;
  createdAt: string;
  updatedAt: string;
};

// Role types
type TripRole = 'owner' | 'editor' | 'viewer';

// Helper types
type PendingTripInvitation = { /* email-based invitation */ };
type AcceptedTripUser = { /* accepted user */ };
type TripUserWithProfile = { /* with user profile info */ };
```

## Migration Guide

### Existing Trips

When the migration runs, all existing trips are automatically migrated:
- The trip owner (from `trips.user_id`) is added to `trip_users` with role 'owner'
- Existing trips continue to work without any changes required

### Application Integration

To integrate trip invitations into your application:

1. **Import the service**:
   ```typescript
   import { TripUsersService } from '@packing-list/supabase';
   ```

2. **Check permissions before operations**:
   ```typescript
   const canEdit = await TripUsersService.canUserEditTrip(tripId, userId);
   if (!canEdit) {
     throw new Error('Permission denied');
   }
   ```

3. **Display trip members in UI**:
   ```typescript
   const users = await TripUsersService.getAcceptedTripUsers(tripId);
   // Render users in your UI
   ```

4. **Handle invitations**:
   ```typescript
   // When user logs in, check for pending invitations
   const pendingInvites = await TripUsersService.getPendingInvitations(tripId);
   // Allow user to accept/reject
   ```

## Security Considerations

- All operations are protected by Row Level Security (RLS) policies
- Only trip owners can manage trip members
- Editors cannot escalate their own permissions
- Viewers cannot modify content (except packed status)
- All database functions use `SECURITY DEFINER` for consistent permission checks

## Future Enhancements

- [ ] Email notifications via Supabase Edge Functions
- [ ] Invitation acceptance workflow in UI
- [ ] Auto-add user profile templates to trips
- [ ] Trip sharing links
- [ ] Public trip viewing (read-only)
- [ ] Activity log for shared trips

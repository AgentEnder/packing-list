# Trip Collaboration Feature Plan

## Overview

This document outlines the implementation of multi-user trip collaboration for the Packing List application. The feature enables trip owners to invite other users to collaborate on their trips, with different permission levels and a complete invitation workflow.

## Architecture

### Database Schema

#### trip_users Table

```sql
CREATE TABLE trip_users (
    id UUID PRIMARY KEY,
    trip_id UUID REFERENCES trips(id),
    user_id UUID REFERENCES auth.users(id),
    email TEXT NOT NULL,
    role TEXT CHECK (role IN ('owner', 'editor')),
    status TEXT CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    version INTEGER,
    is_deleted BOOLEAN
);
```

### Permission Model

1. **Owner**: Full control over the trip

   - Can edit trip metadata (name, description, dates)
   - Can invite/remove users
   - Can pack/unpack items
   - Can manage packing rules

2. **Editor**: Can manage trip contents
   - Can pack/unpack items
   - Can add/remove people
   - Cannot edit trip metadata
   - Cannot invite/remove users

## User Flows

### Invitation Flow

1. **Sending Invitations**

   - Owner opens trip settings
   - Clicks "Invite User"
   - Enters email and selects role
   - Optionally checks "Add user's profile to trip"
   - Invitation is sent

2. **Receiving Invitations**

   - User signs in/up
   - Sees pending invitations on home page
   - Can accept or decline each invitation
   - If accepted with profile option, their profile is added to the trip

3. **Managing Members**
   - Owners can view all trip members
   - Can remove members (except themselves)
   - Can resend pending invitations

### Permission Enforcement

1. **UI Level**

   - PermissionGuard component conditionally renders features
   - usePermissions hook provides permission checks
   - Disabled controls for unauthorized actions

2. **API Level**
   - RLS policies enforce permissions at database level
   - Helper functions check user roles
   - All queries filtered by user access

## Implementation Details

### State Management

The trip users state is managed through:

- Redux slice: `trip-users-slice.ts`
- Offline storage: `trip-users-storage.ts`
- Sync integration for real-time updates

### Key Components

1. **TripInviteModal**: Form for inviting users
2. **TripMembersList**: Display and manage trip members
3. **PendingInvitationsCard**: Show pending invitations
4. **PermissionGuard**: Conditionally render based on permissions
5. **usePermissions**: Hook for permission checks

### Database Functions

1. `invite_user_to_trip()`: Create invitations
2. `accept_trip_invitation()`: Accept pending invitations
3. `decline_trip_invitation()`: Decline invitations
4. `get_user_trip_invitations()`: List pending invitations
5. `remove_user_from_trip()`: Remove members

### Security Considerations

1. **Row Level Security**: All data access controlled by RLS policies
2. **Email Validation**: Basic email format validation
3. **Role Restrictions**: Only 'editor' role for invitations (no 'owner' transfer)
4. **Unique Constraints**: Prevent duplicate invitations

## Migration Strategy

1. **Existing Data**: All current trips automatically have owners in trip_users
2. **Backward Compatibility**: Direct ownership still checked alongside trip_users
3. **Incremental Rollout**: Feature can be enabled per trip

## Future Enhancements

1. **Email Notifications**: Send actual emails for invitations
2. **Role Management**: Allow changing member roles
3. **Viewer Role**: Read-only access for some users
4. **Activity Log**: Track who made what changes
5. **Bulk Invitations**: Invite multiple users at once
6. **Public Links**: Shareable read-only links

## Testing Strategy

1. **Unit Tests**: Permission logic, state management
2. **Integration Tests**: Database functions, RLS policies
3. **E2E Tests**: Complete invitation and collaboration flows
4. **Performance Tests**: Multi-user sync scenarios

## Troubleshooting

### Common Issues

1. **Invitations Not Showing**: Check email matching and RLS policies
2. **Permission Denied**: Verify user role and trip membership
3. **Sync Conflicts**: Multiple users editing simultaneously

### Debug Queries

```sql
-- Check user's trips
SELECT * FROM trip_users WHERE user_id = ?;

-- Check trip members
SELECT * FROM trip_users WHERE trip_id = ?;

-- Check pending invitations
SELECT * FROM trip_users WHERE email = ? AND status = 'pending';
```

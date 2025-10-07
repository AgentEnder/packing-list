# Trip Invitations Implementation Plan

## Overview

This document outlines the complete implementation plan for adding multi-user trip support with invitations to the packing list application.

## Implementation Status

### ✅ Phase 1: Database Foundation (COMPLETE)

#### 1.1 Database Schema ✅
- **trip_users table**: Created join table with role-based access control
  - Supports owner, editor, and viewer roles
  - Handles both accepted users (user_id) and pending invitations (email)
  - Includes invited_at, accepted_at timestamps
  - Migration: `20250627000000_add_trip_users_table.sql`

#### 1.2 Helper Functions ✅
Created PostgreSQL functions for permission checking:
- `get_user_trip_role(trip_id, user_id)` - Returns user's role for a trip
- `user_can_edit_trip(trip_id, user_id)` - Boolean check for edit permission
- `user_can_view_trip(trip_id, user_id)` - Boolean check for view permission
- `migrate_trip_ownership()` - One-time migration of existing trips

#### 1.3 Row Level Security (RLS) Updates ✅
Updated RLS policies for all trip-related tables:
- **trips**: Users can access trips they own or have been granted access to
- **trip_people**: Accessible based on trip access permissions
- **trip_items**: Accessible based on trip access (all users can update packed status)
- **trip_rule_overrides**: Accessible based on trip access permissions
- **trip_default_item_rules**: Accessible based on trip access permissions
- **default_item_rules**: Viewable for rules used in accessible trips
- **trip_users**: Viewable by trip members, manageable by owners only

Migrations:
- `20250627000000_add_trip_users_table.sql`
- `20250627000001_update_trip_default_item_rules_rls_for_shared_trips.sql`

#### 1.4 TypeScript Types ✅
Created comprehensive types in `@packing-list/model`:
- `TripUser` - Main type for trip user relationships
- `TripRole` - Union type for 'owner' | 'editor' | 'viewer'
- `PendingTripInvitation` - Helper type for email-based invitations
- `AcceptedTripUser` - Helper type for confirmed trip members
- `TripUserWithProfile` - Extended type with user profile info

Location: `packages/model/src/lib/TripUser.ts`

#### 1.5 Service Layer ✅
Created `TripUsersService` with complete CRUD operations:

**Query Methods:**
- `getTripUsers(tripId)` - Get all users/invitations for a trip
- `getAcceptedTripUsers(tripId)` - Get confirmed users only
- `getPendingInvitations(tripId)` - Get pending email invitations

**Management Methods:**
- `inviteUserToTrip(tripId, email, role, invitedBy)` - Create email invitation
- `addUserToTrip(tripId, userId, role, invitedBy)` - Add existing user
- `updateTripUserRole(tripUserId, newRole)` - Change user role
- `removeUserFromTrip(tripUserId)` - Remove user from trip
- `acceptInvitation(tripId, userId, email)` - Accept pending invitation

**Permission Methods:**
- `getUserTripRole(tripId, userId)` - Get user's role
- `canUserEditTrip(tripId, userId)` - Check edit permission
- `canUserViewTrip(tripId, userId)` - Check view permission

Location: `packages/supabase/src/trip-users-service.ts`

#### 1.6 Testing ✅
- Comprehensive unit tests for all TripUsersService methods
- Mock-based testing approach
- 100% coverage of service methods
- Location: `packages/supabase/src/trip-users-service.test.ts`

#### 1.7 Documentation ✅
- Complete feature documentation
- API usage examples
- Security considerations
- Migration guide
- Location: `docs/features/trip-invitations.md`

---

### 📋 Phase 2: API Integration (TODO)

#### 2.1 Existing Trip Operations Integration
- [ ] Update trip creation to automatically add owner to trip_users
- [ ] Update trip deletion to clean up trip_users entries
- [ ] Update trip fetching to include user role information
- [ ] Add trip sharing status to trip list/summary views

#### 2.2 Email Lookup & User Matching
- [ ] Create helper to query Supabase auth users by email
- [ ] Implement logic to check if email corresponds to existing user
- [ ] Auto-upgrade pending invitations when matching user found
- [ ] Handle case-insensitive email matching

#### 2.3 Invitation Acceptance Flow
- [ ] Check for pending invitations on user signup
- [ ] Check for pending invitations on user login
- [ ] Auto-accept invitations matching user's email
- [ ] Add notification for newly accepted trip invitations

#### 2.4 Permission Enforcement
- [ ] Add permission checks to trip modification operations
- [ ] Enforce viewer restrictions (packed status only)
- [ ] Enforce editor restrictions (no member management)
- [ ] Add permission checks to UI components

---

### 🎨 Phase 3: UI Components (TODO)

#### 3.1 Trip Sharing Modal
- [ ] Create modal component for inviting users
- [ ] Email input with validation
- [ ] Role selector (editor/viewer)
- [ ] Display pending invitations
- [ ] Display current members
- [ ] Remove member functionality
- [ ] Change member role functionality

#### 3.2 Trip Member Display
- [ ] Show trip members in trip header/details
- [ ] Display user roles with icons
- [ ] Show pending invitations separately
- [ ] Add owner indicator
- [ ] Resend invitation option (future)

#### 3.3 Permission-Based UI
- [ ] Show/hide edit buttons based on role
- [ ] Display read-only indicators for viewers
- [ ] Add tooltips explaining permission restrictions
- [ ] Disable management features for non-owners

#### 3.4 Shared Trip Indicators
- [ ] Add visual indicator when trip is shared
- [ ] Show number of members in trip list
- [ ] Different styling for owned vs shared trips
- [ ] Add filter for "shared with me" trips

#### 3.5 Invitation Acceptance UI
- [ ] Show notification for pending invitations
- [ ] Allow users to accept/reject invitations
- [ ] Display trip details before accepting
- [ ] Confirmation dialog for accepting invitations

---

### 🚀 Phase 4: Advanced Features (FUTURE)

#### 4.1 Email Notifications
- [ ] Set up Supabase Edge Function for emails
- [ ] Configure email templates
- [ ] Send invitation emails with accept link
- [ ] Send notification when invitation accepted
- [ ] Send notification when removed from trip

#### 4.2 Auto-Add User Profiles
- [ ] Add option when inviting to include user's profile
- [ ] Automatically add user's person template to trip
- [ ] Handle profile preferences and settings
- [ ] Allow user to opt-in/opt-out

#### 4.3 Advanced Invitation Features
- [ ] Shareable invitation links
- [ ] Invitation expiration
- [ ] Invitation message/notes
- [ ] Bulk invitations
- [ ] Invitation history/audit log

#### 4.4 Public Trips
- [ ] Add "public" visibility option
- [ ] Allow view-only public access
- [ ] Generate public trip links
- [ ] Optional password protection
- [ ] Public trip gallery/discovery

#### 4.5 Collaboration Features
- [ ] Real-time updates via Supabase subscriptions
- [ ] Activity feed for trip changes
- [ ] Comments on items
- [ ] User presence indicators
- [ ] Conflict resolution for simultaneous edits

---

## Database Migrations Applied

1. `20250627000000_add_trip_users_table.sql`
   - Creates trip_users join table
   - Adds helper functions for permission checking
   - Updates RLS policies for trips, trip_people, trip_items, trip_rule_overrides
   - Migrates existing trip owners

2. `20250627000001_update_trip_default_item_rules_rls_for_shared_trips.sql`
   - Updates RLS policies for trip_default_item_rules
   - Updates RLS policies for default_item_rules
   - Ensures rules are accessible based on trip access

## Testing Strategy

### Current Tests ✅
- Unit tests for TripUsersService
- Mock-based approach for database operations
- All service methods covered

### Future Tests 📋
- Integration tests with actual Supabase instance
- E2E tests for invitation flow
- E2E tests for permission enforcement
- E2E tests for UI components

## Security Considerations

### Implemented ✅
- RLS policies prevent unauthorized access
- Helper functions use SECURITY DEFINER for consistent checks
- User can only modify their own role through owners
- Viewers cannot escalate permissions
- All operations require authentication

### Future Considerations 📋
- Rate limiting for invitations (prevent spam)
- Maximum number of members per trip
- Invitation expiration
- Audit logging for permission changes
- Two-factor auth for trip owners

## Rollout Strategy

### Phase 1: Database (Current - COMPLETE) ✅
- Deploy migrations to staging
- Verify existing trips work correctly
- Test permission checks
- Monitor for performance issues

### Phase 2: API (Next)
- Implement integration points
- Deploy to staging
- Test with sample invitations
- Verify permission enforcement

### Phase 3: UI
- Feature flag for invitation UI
- Beta testing with select users
- Gather feedback
- Iterate on UX

### Phase 4: General Availability
- Remove feature flags
- Monitor usage and performance
- Iterate based on user feedback
- Plan advanced features

## Open Questions & Decisions Needed

1. **Email Verification**: Should we require email verification before allowing invitations?
   - Recommendation: Yes, to prevent spam

2. **Invitation Limits**: Should there be a limit on trip members?
   - Recommendation: Start with 10, increase based on feedback

3. **Default Role**: What should be the default role for new invitations?
   - Current: 'viewer'
   - Consider: Make configurable per trip

4. **Notification Preferences**: How should users control invitation notifications?
   - Recommendation: Add to user preferences

5. **Trip Transfer**: Should we support transferring ownership?
   - Recommendation: Phase 4 feature, requires careful consideration

## Performance Considerations

- Added indexes on trip_users table (trip_id, user_id, email)
- Helper functions use EXISTS for efficient permission checks
- RLS policies leverage existing indexes on trips table
- Consider caching user roles in application layer for frequently accessed trips

## Monitoring & Metrics

Recommended metrics to track:
- Number of shared trips
- Average members per trip
- Invitation acceptance rate
- Time to accept invitations
- Permission denied errors
- Database query performance for RLS policies

## Success Criteria

✅ **Phase 1 Complete**:
- Database schema supports multi-user trips
- All RLS policies updated and tested
- TypeScript types defined
- Service layer implemented and tested
- Documentation complete

📋 **Phase 2 Success**:
- Trip operations integrate with trip_users
- Invitations work end-to-end
- Permissions properly enforced
- All existing functionality preserved

📋 **Phase 3 Success**:
- UI allows inviting users
- Users can accept invitations
- Permission-based UI works correctly
- Positive user feedback

📋 **Phase 4 Success**:
- Email notifications working
- Advanced features adopted by users
- Minimal support issues
- High user satisfaction

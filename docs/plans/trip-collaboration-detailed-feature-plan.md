I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end. Make sure you fix all the linting, compilation or validation issues after successful implementation of the plan.

### Observations

Based on my analysis of the GitHub ticket and codebase exploration, this is a substantial feature request to add multi-user trip collaboration to a packing list application. The current system supports single-user trips with offline-first sync via Supabase. The codebase has a mature architecture with Redux state management, comprehensive sync system, and established patterns for database migrations and UI components. The feature needs to be broken down into manageable phases while maintaining the existing offline-first approach and data integrity.

### Approach

I'll structure this as a phased implementation plan that builds incrementally from database schema through backend logic to frontend UI. Each phase delivers working functionality while setting up for the next phase. The approach prioritizes data integrity, maintains offline-first sync capabilities, and establishes clear permission patterns. I'll break this large feature into 4 main phases: Database Foundation, Invitation System, Permission Framework, and UI Enhancement, with each phase containing multiple focused tasks.

### Reasoning

I analyzed the GitHub ticket requirements and explored the codebase structure. I examined the current database schema in the multi-trip migration files, reviewed the sync system implementation in the state package, checked existing permission patterns (finding none), and looked at current people management UI components. I also reviewed the authentication system and existing user management patterns to understand how invitations could integrate with the current auth flow.

## Mermaid Diagram

sequenceDiagram
participant Owner as Trip Owner
participant System as Packing List App
participant DB as Supabase DB
participant Invitee as Invited User
participant Email as Email Service

    Owner->>System: Open Trip Settings
    Owner->>System: Click "Invite User"
    Owner->>System: Enter email, select role
    System->>DB: Create trip_users record (status: pending)
    System->>Email: Send invitation email (optional)
    System->>Owner: Show invitation sent confirmation

    Invitee->>System: Sign in / Sign up
    System->>DB: Check for pending invitations by email
    DB->>System: Return pending invitations
    System->>Invitee: Show pending invitations card
    Invitee->>System: Accept invitation
    System->>DB: Update trip_users status to 'accepted'
    System->>DB: Add user's profile to trip (if requested)
    System->>Invitee: Redirect to trip with appropriate permissions

    Invitee->>System: View trip content
    System->>DB: Check user role in trip
    DB->>System: Return role (owner/editor)
    System->>Invitee: Show UI based on permissions

## Proposed File Changes

### packages/supabase/supabase/migrations/20250102000000_add_trip_users_table.sql(NEW)

References:

- packages/supabase/supabase/migrations/20250608055917_multi_trip_schema.sql

Create the core `trip_users` join table to support multi-user trips. The table will include columns for `id`, `trip_id`, `user_id`, `email`, `role`, `status`, `created_at`, `updated_at`, `version`, and `is_deleted`. Add proper foreign key constraints, indexes for performance, and RLS policies to ensure users can only see trip memberships they're authorized for. Include a unique constraint on `(trip_id, user_id)` and `(trip_id, email)` to prevent duplicate invitations. The `status` field will track invitation states: 'pending', 'accepted', 'declined'.

### packages/supabase/supabase/migrations/20250102000001_update_trip_rls_policies.sql(NEW)

References:

- packages/supabase/supabase/migrations/20250608055917_multi_trip_schema.sql

Update all existing RLS policies for trips, trip_people, trip_items, and trip_rule_overrides to support multi-user access. Modify policies to check both direct ownership (`trips.user_id = auth.uid()`) AND membership through the trip_users table. Create helper functions to check if a user has access to a trip and what role they have. Update policies to allow 'editor' role users to view and modify trip data while restricting trip metadata changes to 'owner' role only.

### packages/supabase/supabase/migrations/20250102000002_backfill_trip_owners.sql(NEW)

References:

- packages/supabase/supabase/migrations/20250608055917_multi_trip_schema.sql

Create a migration to backfill existing trips by adding the current trip owner to the trip_users table with 'owner' role and 'accepted' status. This ensures all existing trips have proper ownership records in the new join table. Include proper error handling and logging for the backfill process.

### packages/supabase/supabase/migrations/20250102000003_trip_invitation_functions.sql(NEW)

References:

- packages/supabase/supabase/migrations/20250616000000_fix_rule_pack_tracking.sql

Create Supabase functions for trip invitation management: `invite_user_to_trip(trip_id, email, role, add_profile)` to create invitations, `accept_trip_invitation(trip_id)` to accept pending invitations, `get_user_trip_invitations()` to list pending invitations for the current user, and `populate_pending_invitations(user_email, user_id)` to link pending email invitations to new user accounts. Include proper permission checks and error handling in all functions.

### packages/model/src/lib/TripUser.ts(NEW)

References:

- packages/model/src/lib/Trip.ts

Create the TripUser model type to represent trip membership relationships. Include fields for `id`, `tripId`, `userId`, `email`, `role` ('owner' | 'editor'), `status` ('pending' | 'accepted' | 'declined'), and standard sync fields (`createdAt`, `updatedAt`, `version`, `isDeleted`). Add helper types for invitation status and user roles.

### packages/model/src/index.ts(MODIFY)

References:

- packages/model/src/lib/TripUser.ts(NEW)

Add export for the new TripUser model type to make it available throughout the application.

### packages/supabase/src/database-types.ts(MODIFY)

References:

- packages/supabase/supabase/migrations/20250102000000_add_trip_users_table.sql(NEW)

Update the database types to include the new `trip_users` table schema. Run `supabase gen types typescript` to regenerate types after the migration is applied. Ensure the new table structure matches the migration schema exactly.

### packages/state/src/lib/sync/types.ts(MODIFY)

References:

- packages/model/src/lib/TripUser.ts(NEW)

Extend the sync system to support TripUser entities. Add `TripUser` to the imports from `@packing-list/model`. Add new sync action types for trip user operations: `MERGE_SYNCED_TRIP_USER`, `TRACK_TRIP_USER_CHANGE`. Update the `EntityCallbacks` interface to include `onTripUserUpsert` callback. Add trip user existence check to `EntityExistence` interface.

### packages/offline-storage/src/lib/trip-users-storage.ts(NEW)

References:

- packages/offline-storage/src/lib/trip-storage.ts
- packages/offline-storage/src/lib/person-storage.ts

Create offline storage module for trip users following the same patterns as `trip-storage.ts` and `person-storage.ts`. Implement functions for storing, retrieving, updating, and deleting trip user records in IndexedDB. Include methods for querying trip users by trip ID and user ID. Ensure proper error handling and consistency with existing storage patterns.

### packages/offline-storage/src/lib/database.ts(MODIFY)

References:

- packages/offline-storage/src/lib/trip-users-storage.ts(NEW)

Add the `trip_users` table to the IndexedDB schema. Update the database version and include proper migration logic for existing databases. Add indexes for efficient querying by trip_id and user_id. Follow the same patterns used for other entity tables in the database schema.

### packages/offline-storage/src/index.ts(MODIFY)

References:

- packages/offline-storage/src/lib/trip-users-storage.ts(NEW)

Export the new trip users storage functions to make them available to other packages.

### packages/state/src/trip-users-slice.ts(NEW)

References:

- packages/state/src/user-people-slice.ts

Create a new Redux slice for managing trip users state. Include state for trip memberships, pending invitations, and current user's role in each trip. Implement actions for inviting users, accepting/declining invitations, and managing trip memberships. Add selectors for getting trip members, user's role in a trip, and pending invitations. Follow the same patterns used in existing slices.

### packages/state/src/store.ts(MODIFY)

References:

- packages/state/src/trip-users-slice.ts(NEW)

Add the trip users slice to the Redux store configuration. Import the trip users reducer and include it in the store setup. Ensure proper integration with existing middleware and sync functionality.

### packages/state/src/selectors.ts(MODIFY)

References:

- packages/state/src/trip-users-slice.ts(NEW)

Add selectors for trip user functionality: `selectTripMembers(tripId)` to get all members of a trip, `selectUserRoleInTrip(tripId)` to get current user's role, `selectPendingInvitations()` to get user's pending invitations, `selectCanEditTrip(tripId)` and `selectCanEditItems(tripId)` for permission checks. Export these selectors for use in components.

### packages/state/src/action-handlers/trip-invitation-handlers.ts(NEW)

References:

- packages/state/src/action-handlers/trip-management.ts

Create action handlers for trip invitation functionality. Implement handlers for inviting users to trips, accepting/declining invitations, and removing users from trips. Include proper error handling, optimistic updates, and sync integration. Follow the patterns established in existing action handlers like `trip-management.ts`.

### packages/state/src/actions.ts(MODIFY)

References:

- packages/state/src/action-handlers/trip-invitation-handlers.ts(NEW)

Add new action types for trip invitation functionality: `INVITE_USER_TO_TRIP`, `ACCEPT_TRIP_INVITATION`, `DECLINE_TRIP_INVITATION`, `REMOVE_USER_FROM_TRIP`, `LOAD_TRIP_MEMBERS`, `LOAD_PENDING_INVITATIONS`. Include proper TypeScript types for action payloads.

### packages/shared-components/src/permissions/PermissionGuard.tsx(NEW)

References:

- packages/state/src/selectors.ts(MODIFY)

Create a reusable permission guard component that conditionally renders children based on user permissions. Accept props for required role, trip ID, and fallback content. Use the permission selectors to determine if the current user has the required permissions. This component will be used throughout the UI to show/hide features based on user roles.

### packages/shared-components/src/permissions/usePermissions.ts(NEW)

References:

- packages/state/src/selectors.ts(MODIFY)

Create a custom hook for checking user permissions in components. Provide functions like `canEditTrip(tripId)`, `canEditItems(tripId)`, `canInviteUsers(tripId)`, and `getUserRole(tripId)`. Use the Redux selectors internally and provide a clean API for components to check permissions.

### packages/shared-components/src/index.ts(MODIFY)

References:

- packages/shared-components/src/permissions/PermissionGuard.tsx(NEW)
- packages/shared-components/src/permissions/usePermissions.ts(NEW)

Export the new permission components and hooks to make them available throughout the application.

### packages/frontend/components/TripInviteModal.tsx(NEW)

References:

- packages/frontend/components/RulePackModal.tsx

Create a modal component for inviting users to trips. Include form fields for email address, role selection (editor/viewer), and optional checkbox to add the user's profile to the trip. Implement form validation, submission handling, and error display. Use the existing modal patterns from components like `RulePackModal.tsx`. Include loading states and success feedback.

### packages/frontend/components/TripMembersList.tsx(NEW)

References:

- packages/frontend/pages/people/components/PersonList.tsx

Create a component to display trip members with their roles and status. Show user avatars, names, email addresses, and roles. Include actions for trip owners to remove members or change roles. Display pending invitations separately with options to resend or cancel. Use consistent styling with existing list components.

### packages/frontend/components/PendingInvitationsCard.tsx(NEW)

References:

- packages/shared-components/src/auth/UserManagement.tsx

Create a card component to display pending trip invitations for the current user. Show trip details, inviter information, and actions to accept or decline invitations. Include proper loading states and error handling. Style consistently with existing card components.

### packages/frontend/pages/trips/@tripId/settings/+Page.tsx(MODIFY)

References:

- packages/frontend/components/TripMembersList.tsx(NEW)
- packages/frontend/components/TripInviteModal.tsx(NEW)
- packages/shared-components/src/permissions/PermissionGuard.tsx(NEW)

Add trip member management to the trip settings page. Include the `TripMembersList` component and an "Invite User" button that opens the `TripInviteModal`. Use the `PermissionGuard` component to only show invitation features to trip owners. Integrate with existing trip settings layout and styling.

### packages/frontend/pages/people/components/PersonCard.tsx(MODIFY)

References:

- packages/frontend/pages/people/components/PersonList.tsx

Update the PersonCard component to show indicators for people who are linked to user accounts vs. template people. Add visual badges or icons to distinguish between "real users" and "templates". Show user avatars for linked accounts and template icons for non-linked people. Update styling to make the distinction clear.

### packages/frontend/pages/packing-list/+Page.tsx(MODIFY)

References:

- packages/shared-components/src/permissions/usePermissions.ts(NEW)

Update the packing list page to respect user permissions. Use the `usePermissions` hook to check if the current user can edit items. Disable edit controls (pack/unpack buttons, add items, etc.) for users who only have viewer permissions. Show appropriate messaging when features are disabled due to permissions.

### packages/frontend/pages/defaults/+Page.tsx(MODIFY)

References:

- packages/shared-components/src/permissions/PermissionGuard.tsx(NEW)

Update the packing rules page to support user-specific rules for non-owners. Allow editor users to create rules that are scoped to themselves only. Use permission guards to show/hide global rule management features. Update the rule creation form to include a "scope" option for non-owners (self-only vs. trip-wide).

### packages/frontend/pages/index/+Page.tsx(MODIFY)

References:

- packages/frontend/components/PendingInvitationsCard.tsx(NEW)

Add the `PendingInvitationsCard` component to the home page to show pending trip invitations. Position it prominently so users can easily see and respond to invitations. Include proper loading states and handle the case when there are no pending invitations.

### e2e/frontend-e2e/src/trip-collaboration.spec.ts(NEW)

References:

- e2e/frontend-e2e/src/trip-management.spec.ts

Create comprehensive end-to-end tests for trip collaboration features. Test the complete invitation flow: owner invites user, user receives and accepts invitation, user can access trip with appropriate permissions. Test permission enforcement: editors can pack items but not edit trip settings, viewers can only view. Test edge cases like duplicate invitations, invalid emails, and invitation cancellation.

### e2e/frontend-e2e/src/page-objects/TripInviteModal.ts(NEW)

References:

- e2e/frontend-e2e/src/page-objects/RulePackModal.ts

Create page object for the trip invite modal to support e2e testing. Include methods for filling out the invitation form, selecting roles, submitting invitations, and verifying success/error states. Follow the patterns established in existing page objects.

### docs/plans/trip-collaboration-feature-plan.md(NEW)

References:

- docs/plans/multi-trip-architecture.md

Create comprehensive documentation for the trip collaboration feature. Include architecture decisions, database schema design, permission model, user flows, and implementation details. Document the invitation process, role definitions, and integration points with existing systems. Include troubleshooting guide and future enhancement possibilities.

# Reusable People Implementation Checklist - Vertical Slices

## Sprint 1: User Profile Management

**Goal**: Complete profile management functionality
**User Value**: Users can create and manage their personal profile

### Database Schema (Profile-Focused)

- [x] Create schema: `20250125000000_add_user_profile.sql`
- [x] Add `user_people` table (profile-focused, `is_user_profile` defaults to TRUE)
- [x] Add performance indexes for user profile queries
- [x] Add RLS policies for `user_people`
- [x] Test schema with user profile data

### UserPerson Model & Sync

- [x] Create `packages/model/src/lib/UserPerson.ts`
- [x] Add `UserPersonChange` to `packages/model/src/lib/SyncTypes.ts`
- [x] Create basic sync handler for user profiles only
- [x] Update `packages/model/src/index.ts` exports
- [x] Write unit tests for UserPerson model

### Profile State Management

- [x] Create `packages/state/src/user-profile-slice.ts` (profile-only, not templates yet)
- [x] Add `selectUserProfile` selector
- [x] Add profile CRUD action handlers
- [x] Update `packages/state/src/store.ts` to include slice
- [x] Unit tests for profile slice

### Profile Management UI

- [x] Create `packages/frontend/pages/profile/+Page.tsx`
- [x] Create profile form component (`UserProfileForm.tsx`)
- [x] Create profile display component (`UserProfileCard.tsx`)
- [x] Add navigation to profile page
- [x] Handle profile creation/editing/saving

### Validation & Demo

- [x] Test complete profile workflow
- [x] User can create profile with name, age, gender
- [x] User can edit existing profile
- [x] Profile persists across page refreshes
- [x] Sync works offline/online
- [x] E2E test for profile management

**Sprint 1 Demo**: User goes to /profile, creates/edits personal info, sees it persist

---

## Sprint 2: Profile Auto-Added to Trips

**Goal**: User's profile automatically appears in new trips  
**User Value**: No need to manually add yourself to every trip

### Enhanced Person Model

- [x] Update `packages/model/src/lib/Person.ts` to add `userPersonId?` field
- [x] Add `isPersonFromTemplate` helper function
- [x] Update Person sync types to handle userPersonId
- [x] Add database column: `ALTER TABLE trip_people ADD user_person_id UUID REFERENCES user_people(id)`

### Trip Creation Enhancement

- [x] Update `packages/state/src/action-handlers/trip-creation.ts`
- [x] Implement auto-add profile to new trips
- [x] Handle case where user has no profile (prompt to create)
- [x] Update trip creation actions

### Trip People UI Updates

- [x] Update `packages/frontend/pages/people/+Page.tsx` to show profile badge
- [x] Add profile indicator in person list (show "You" or profile icon)
- [x] Update person card to show when person is from profile
- [x] Handle profile vs non-profile people differently in UI

### Trip Creation Flow

- [x] Update trip creation to show profile will be added
- [x] Add profile indicator in trip wizard
- [x] Show profile in trip confirmation

### Validation & Demo

- [x] Test trip creation with existing profile
- [x] Test trip creation with no profile (should prompt)
- [x] Verify profile appears in trip people list with indicator
- [x] Profile person should be distinguishable from regular trip people
- [x] E2E test for trip creation → profile auto-added

**Sprint 2 Demo**: Create new trip → user's profile automatically appears in travelers list

---

## Sprint 3: Person Templates & Reuse

**Goal**: Save and reuse people across multiple trips
**User Value**: Quickly add frequent travel companions

### Extended Database Schema

- [x] Update schema to support multiple people per user
- [x] Change `is_user_profile` default to FALSE (allow both profile and templates)
- [x] Add migration to support existing profiles + new templates
- [x] Test with multiple people per user

### Enhanced State Management

- [x] Rename slice to `user-people-slice.ts` (supports multiple people)
- [x] Add `selectUserPeople` selector (all user's people)
- [x] Add `selectUserProfile` selector (just the profile)
- [x] Add template CRUD operations
- [x] Update sync to handle multiple user people

### Person Template UI

- [x] Update `packages/frontend/pages/people/manage/+Page.tsx` for multiple people
- [x] Create template selector component (`PersonTemplateSelector.tsx`)
- [x] Add "Save as template" functionality to person forms
- [x] Show template vs profile distinction in UI

### Enhanced Person Management

- [x] Update person creation flow to offer "Save as template"
- [x] Add "Quick Add" from templates when adding people to trips
  - [x] When typing in the person name, offer known people from templates as suggestions
- [x] Template management (edit/delete templates)
- [x] Bulk template operations

### Trip Integration

- [x] Add template picker to trip person creation
- [x] Show available templates when adding people
- [x] "Add from template" vs "Create new person" options
- [x] Handle template updates vs trip person independence

### Validation & Demo

- [x] Create multiple people as templates
- [x] Use templates across different trips
- [x] Edit template and verify it doesn't affect existing trip people
- [x] Test "Save as template" from trip person
- [x] Full E2E workflow: profile + templates + multiple trips

**Sprint 3 Demo**: Save family members as templates → quickly add them to any new trip

---

## Success Metrics

### Sprint 1 Metrics

- [x] Users create profiles within first session
- [x] Profile completion rate (name, age, gender)
- [x] Profile edit frequency

### Sprint 2 Metrics

- [x] Trips with auto-added profile vs manual addition
- [x] User satisfaction with automatic profile addition
- [x] Profile creation rate when prompted during trip creation

### Sprint 3 Metrics

- [x] Template creation rate
- [x] Template reuse across trips
- [x] Time saved in trip person setup
- [x] User adoption of template features

## Definition of Done

Each sprint item is considered complete when:

- [x] Feature works end-to-end for users
- [x] Unit tests pass with >90% coverage
- [x] Integration tests pass
- [x] E2E tests pass for the user workflow
- [x] Code follows project style guidelines
- [x] Performance impact is acceptable
- [x] Accessibility requirements are met
- [x] Feature can be demoed successfully

## Risk Mitigation

### Sprint-by-Sprint Risks

**Sprint 1**:

- **Profile Schema Risk**: Test thoroughly with various profile combinations
- **UX Risk**: Make profile creation intuitive and optional

**Sprint 2**:

- **Trip Creation Risk**: Ensure auto-add doesn't break existing trip flows
- **Profile Missing Risk**: Graceful handling when user has no profile

**Sprint 3**:

- **Template Complexity**: Keep template selection simple and fast
- **Performance Risk**: Test with users who have many templates

### Overall Rollback Plan

- [x] Feature flag for each slice independently
- [x] Database rollback for each schema change
- [x] Monitoring alerts for each feature
- [x] User feedback collection at each sprint

## Vertical Slice Benefits

✅ **Sprint 1**: Users get immediate value (profile management)
✅ **Sprint 2**: Users see profile automation in action  
✅ **Sprint 3**: Users get full template functionality

Each sprint delivers working, demonstrable user value!

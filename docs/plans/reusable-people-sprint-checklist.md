# Reusable People Implementation Checklist - Vertical Slices

## Sprint 1: User Profile Management

**Goal**: Complete profile management functionality
**User Value**: Users can create and manage their personal profile

### Database Schema (Profile-Focused)

- [ ] Create schema: `20250125000000_add_user_profile.sql`
- [ ] Add `user_people` table (profile-focused, `is_user_profile` defaults to TRUE)
- [ ] Add performance indexes for user profile queries
- [ ] Add RLS policies for `user_people`
- [ ] Test schema with user profile data

### UserPerson Model & Sync

- [ ] Create `packages/model/src/lib/UserPerson.ts`
- [ ] Add `UserPersonChange` to `packages/model/src/lib/SyncTypes.ts`
- [ ] Create basic sync handler for user profiles only
- [ ] Update `packages/model/src/index.ts` exports
- [ ] Write unit tests for UserPerson model

### Profile State Management

- [ ] Create `packages/state/src/user-profile-slice.ts` (profile-only, not templates yet)
- [ ] Add `selectUserProfile` selector
- [ ] Add profile CRUD action handlers
- [ ] Update `packages/state/src/store.ts` to include slice
- [ ] Unit tests for profile slice

### Profile Management UI

- [ ] Create `packages/frontend/pages/profile/+Page.tsx`
- [ ] Create profile form component (`UserProfileForm.tsx`)
- [ ] Create profile display component (`UserProfileCard.tsx`)
- [ ] Add navigation to profile page
- [ ] Handle profile creation/editing/saving

### Validation & Demo

- [ ] Test complete profile workflow
- [ ] User can create profile with name, age, gender
- [ ] User can edit existing profile
- [ ] Profile persists across page refreshes
- [ ] Sync works offline/online
- [ ] E2E test for profile management

**Sprint 1 Demo**: User goes to /profile, creates/edits personal info, sees it persist

---

## Sprint 2: Profile Auto-Added to Trips

**Goal**: User's profile automatically appears in new trips  
**User Value**: No need to manually add yourself to every trip

### Enhanced Person Model

- [ ] Update `packages/model/src/lib/Person.ts` to add `userPersonId?` field
- [ ] Add `isPersonFromTemplate` helper function
- [ ] Update Person sync types to handle userPersonId
- [ ] Add database column: `ALTER TABLE trip_people ADD user_person_id UUID REFERENCES user_people(id)`

### Trip Creation Enhancement

- [ ] Update `packages/state/src/action-handlers/trip-creation.ts`
- [ ] Implement auto-add profile to new trips
- [ ] Handle case where user has no profile (prompt to create)
- [ ] Update trip creation actions

### Trip People UI Updates

- [ ] Update `packages/frontend/pages/people/+Page.tsx` to show profile badge
- [ ] Add profile indicator in person list (show "You" or profile icon)
- [ ] Update person card to show when person is from profile
- [ ] Handle profile vs non-profile people differently in UI

### Trip Creation Flow

- [ ] Update trip creation to show profile will be added
- [ ] Add profile indicator in trip wizard
- [ ] Show profile in trip confirmation

### Validation & Demo

- [ ] Test trip creation with existing profile
- [ ] Test trip creation with no profile (should prompt)
- [ ] Verify profile appears in trip people list with indicator
- [ ] Profile person should be distinguishable from regular trip people
- [ ] E2E test for trip creation → profile auto-added

**Sprint 2 Demo**: Create new trip → user's profile automatically appears in travelers list

---

## Sprint 3: Person Templates & Reuse

**Goal**: Save and reuse people across multiple trips
**User Value**: Quickly add frequent travel companions

### Extended Database Schema

- [ ] Update schema to support multiple people per user
- [ ] Change `is_user_profile` default to FALSE (allow both profile and templates)
- [ ] Add migration to support existing profiles + new templates
- [ ] Test with multiple people per user

### Enhanced State Management

- [ ] Rename slice to `user-people-slice.ts` (supports multiple people)
- [ ] Add `selectUserPeople` selector (all user's people)
- [ ] Add `selectUserProfile` selector (just the profile)
- [ ] Add template CRUD operations
- [ ] Update sync to handle multiple user people

### Person Template UI

- [ ] Update `packages/frontend/pages/people/manage/+Page.tsx` for multiple people
- [ ] Create template selector component (`PersonTemplateSelector.tsx`)
- [ ] Add "Save as template" functionality to person forms
- [ ] Show template vs profile distinction in UI

### Enhanced Person Management

- [ ] Update person creation flow to offer "Save as template"
- [ ] Add "Quick Add" from templates when adding people to trips
  - [ ] When typing in the person name, offer known people from templates as suggestions
- [ ] Template management (edit/delete templates)
- [ ] Bulk template operations

### Trip Integration

- [ ] Add template picker to trip person creation
- [ ] Show available templates when adding people
- [ ] "Add from template" vs "Create new person" options
- [ ] Handle template updates vs trip person independence

### Validation & Demo

- [ ] Create multiple people as templates
- [ ] Use templates across different trips
- [ ] Edit template and verify it doesn't affect existing trip people
- [ ] Test "Save as template" from trip person
- [ ] Full E2E workflow: profile + templates + multiple trips

**Sprint 3 Demo**: Save family members as templates → quickly add them to any new trip

---

## Success Metrics

### Sprint 1 Metrics

- [ ] Users create profiles within first session
- [ ] Profile completion rate (name, age, gender)
- [ ] Profile edit frequency

### Sprint 2 Metrics

- [ ] Trips with auto-added profile vs manual addition
- [ ] User satisfaction with automatic profile addition
- [ ] Profile creation rate when prompted during trip creation

### Sprint 3 Metrics

- [ ] Template creation rate
- [ ] Template reuse across trips
- [ ] Time saved in trip person setup
- [ ] User adoption of template features

## Definition of Done

Each sprint item is considered complete when:

- [ ] Feature works end-to-end for users
- [ ] Unit tests pass with >90% coverage
- [ ] Integration tests pass
- [ ] E2E tests pass for the user workflow
- [ ] Code follows project style guidelines
- [ ] Performance impact is acceptable
- [ ] Accessibility requirements are met
- [ ] Feature can be demoed successfully

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

- [ ] Feature flag for each slice independently
- [ ] Database rollback for each schema change
- [ ] Monitoring alerts for each feature
- [ ] User feedback collection at each sprint

## Vertical Slice Benefits

✅ **Sprint 1**: Users get immediate value (profile management)
✅ **Sprint 2**: Users see profile automation in action  
✅ **Sprint 3**: Users get full template functionality

Each sprint delivers working, demonstrable user value!

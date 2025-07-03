# Reusable People Feature Implementation Plan

## Overview

Add support to save people for use between trips, including the user's profile, person management UI, and trip-person selection improvements.

## Current State Analysis

### Existing Architecture

- **Person Model**: Currently trip-scoped with `tripId` foreign key
- **Database**: `trip_people` table with trip-specific people
- **Sync System**: Supports person changes with trip-based sync
- **UI**: Basic person management per trip in `/people` page

### Key Constraints

- Must work offline-first
- Must support conflict resolution
- No production data migration needed (pre-launch)

## Implementation Plan - Vertical Slices

### Slice 1: User Profile Management

**Goal**: Users can create and manage their personal profile
**User Value**: Personal profile setup and editing

#### Database & Models

- Create `user_people` table (profile-focused)
- Create `UserPerson` model
- Basic sync support for user profile

#### State Management

- Basic user profile slice
- `selectUserProfile` selector
- CRUD actions for user profile only

#### Frontend

- Profile management page (`/profile`)
- Profile creation/editing form
- Profile display component

**Demo**: User can create profile, edit their info, see it persist

---

### Slice 2: Profile Auto-Added to Trips

**Goal**: User's profile automatically appears in new trips
**User Value**: No need to manually add yourself to every trip

#### Enhanced Models

- Add `userPersonId` to Person model
- Update trip creation logic

#### State Management

- Auto-add profile to new trips
- Enhanced trip creation actions

#### Frontend

- Update trip creation flow
- Show profile in trip people list
- Profile badge/indicator in people list

**Demo**: Create trip → user's profile automatically added as traveler

---

### Slice 3: Person Templates & Reuse

**Goal**: Save and reuse people across multiple trips
**User Value**: Quickly add frequent travel companions

#### Enhanced Database

- Extend `user_people` for multiple people (not just profile)
- Full sync implementation for all user people

#### Enhanced State Management

- Full user people management
- Template selection and creation
- "Save as template" functionality

#### Enhanced Frontend

- Person template selector
- "Quick add" from saved people
- "Save as template" option
- Enhanced person management page

**Demo**: Save mom/dad/kids as templates → quickly add them to any trip

## Implementation Sequence

### Sprint 1: User Profile Management (Slice 1)

**Deliverable**: Working profile management page

1. Database schema for user profile
2. UserPerson model and basic sync
3. Profile state management (slice + selectors)
4. Profile management UI (/profile page)
5. Profile CRUD operations

**User can**: Create and edit their personal profile

### Sprint 2: Profile in Trips (Slice 2)

**Deliverable**: Profile auto-added to new trips

1. Add userPersonId to Person model
2. Update trip creation to auto-add profile
3. Show profile in trip people list
4. Profile indicator/badge in UI

**User can**: See their profile automatically added when creating trips

### Sprint 3: Person Templates (Slice 3)

**Deliverable**: Full person template functionality

1. Extend user_people for multiple people
2. Enhanced person management page
3. Template selector for adding people to trips
4. "Save as template" functionality

**User can**: Save and reuse people across multiple trips

## Testing Strategy

### Unit Tests

- Model validation and transformations
- Sync conflict resolution
- State management actions and selectors

### Integration Tests

- Sync with server integration
- Person template creation/usage flows

### E2E Tests

- Complete person management workflow
- Trip creation with user profile
- Person template reuse across trips

## Rollout Strategy

### Feature Flag

- `ENABLE_REUSABLE_PEOPLE` environment variable
- Enable for all users (pre-launch)

### Performance Considerations

- Lazy load user people on first access
- Cache user profile
- Optimize queries with proper indexing

## Success Metrics

### User Experience

- Reduction in time to set up trip people
- Increased person reuse across trips
- User profile completion rates

### Technical Metrics

- No regressions in sync performance
- Successful offline-online transitions
- Reliable sync performance

## Risk Mitigation

### Data Integrity

- Comprehensive testing of new schema
- Monitoring for sync conflicts

### Performance

- Query optimization review
- Memory usage monitoring
- Offline storage impact assessment

### User Experience

- User feedback collection
- Iterative improvements based on usage

# Reusable People Technical Specification

## Architecture Overview

This document details the technical implementation for adding reusable people functionality to the packing list application.

### Current State

- People are currently trip-specific (stored in `trip_people` table)
- No persistence between trips
- No default user person concept
- Basic person management UI per trip

### Target State

- User-level people templates for reuse across trips
- Default user person auto-added to new trips
- Enhanced person management UI
- Backward compatibility with existing data

## Database Schema Changes

### 1. New `user_people` Table

```sql
CREATE TABLE public.user_people (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  is_user_profile BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT FALSE,

  CONSTRAINT user_people_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT user_people_age_valid CHECK (age IS NULL OR (age >= 0 AND age <= 150)),
  CONSTRAINT user_people_gender_valid CHECK (gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer-not-to-say'))
);

-- Add reference from trip_people to user_people
ALTER TABLE public.trip_people
ADD COLUMN user_person_id UUID REFERENCES public.user_people(id) ON DELETE SET NULL;
```

### 2. Performance Indexes

```sql
CREATE INDEX idx_user_people_user_id ON public.user_people(user_id);
CREATE INDEX idx_user_people_user_active ON public.user_people(user_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_user_people_profile ON public.user_people(user_id, is_user_profile) WHERE is_user_profile = TRUE;
CREATE INDEX idx_trip_people_user_person ON public.trip_people(user_person_id);
```

## Model Updates

### 1. New UserPerson Model

```typescript
// packages/model/src/lib/UserPerson.ts
export type UserPerson = {
  id: string;
  userId: string;
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  settings?: Record<string, unknown>;
  isUserProfile: boolean;

  // Sync tracking
  createdAt: string;
  updatedAt: string;
  version: number;
  isDeleted: boolean;
};
```

### 2. Enhanced Person Model

```typescript
// packages/model/src/lib/Person.ts (additions)
export type Person = {
  // ... existing fields
  userPersonId?: string; // NEW: Reference to UserPerson template
};

export const isPersonFromTemplate = (person: Person): boolean => {
  return !!person.userPersonId;
};
```

## Sync Layer Implementation

### 1. New Sync Types

```typescript
// packages/model/src/lib/SyncTypes.ts
export type UserPersonChange = BaseChange & {
  entityType: 'user_person';
  entityId: string;
  data: Partial<UserPerson> & { id?: string };
  tripId?: never; // User people are not trip-specific
};
```

### 2. Sync Handler

```typescript
// packages/state/src/lib/sync/user-people-sync.ts
export class UserPeopleSync {
  async syncUserPeople(userId: string, lastSyncTime: number) {
    const { data: serverChanges } = await supabase
      .from('user_people')
      .select('*')
      .eq('user_id', userId)
      .gte('updated_at', new Date(lastSyncTime).toISOString());

    return this.processServerChanges(serverChanges);
  }
}
```

## State Management

### 1. User People Slice

```typescript
// packages/state/src/user-people-slice.ts
interface UserPeopleState {
  byId: Record<string, UserPerson>;
  allIds: string[];
  defaultUserId: string | null;
  isLoading: boolean;
  error: string | null;
}

const userPeopleSlice = createSlice({
  name: 'userPeople',
  initialState,
  reducers: {
    setUserPeople,
    addUserPerson,
    updateUserPerson,
    removeUserPerson,
  },
});
```

### 2. Enhanced Selectors

```typescript
// packages/state/src/selectors.ts
export const selectUserPeople = (state: RootState): UserPerson[] => {
  return state.userPeople.allIds.map((id) => state.userPeople.byId[id]);
};

export const selectUserProfile = (state: RootState): UserPerson | null => {
  const profileId = state.userPeople.userProfileId;
  return profileId ? state.userPeople.byId[profileId] : null;
};
```

## Frontend Implementation

### 1. Person Management Page

```tsx
// packages/frontend/pages/people/manage/+Page.tsx
export default function ManagePeoplePage() {
  const userPeople = useAppSelector(selectUserPeople);
  const userProfile = useAppSelector(selectUserProfile);

  return (
    <PageContainer>
      <PageHeader title="Manage People" />
      <YourProfileSection person={userProfile} />
      <AllPeopleSection people={userPeople} />
    </PageContainer>
  );
}
```

### 2. Enhanced Person Selection

```tsx
// packages/frontend/pages/people/components/PersonTemplateSelector.tsx
export const PersonTemplateSelector: React.FC<Props> = ({
  onSelectTemplate,
  onCreateNew,
}) => {
  const userPeople = useAppSelector(selectUserPeople);

  return (
    <div className="person-template-selector">
      <h3>Add Person to Trip</h3>
      {userPeople.map((person) => (
        <TemplateButton
          key={person.id}
          person={person}
          onClick={() => onSelectTemplate(person)}
        />
      ))}
      <button onClick={onCreateNew}>Create New Person</button>
    </div>
  );
};
```

### 3. Auto-Add Default User

```typescript
// packages/state/src/action-handlers/trip-creation.ts
export const createTripWithDefaults = createAsyncThunk(
  'trips/createWithDefaults',
  async (tripData, { getState, dispatch }) => {
    const trip = await dispatch(createTrip(tripData)).unwrap();

    const userProfile = selectUserProfile(getState());
    if (userProfile) {
      await dispatch(
        createPersonFromTemplate({
          tripId: trip.id,
          userPersonId: userProfile.id,
        })
      );
    }

    return trip;
  }
);
```

## Onboarding Strategy

### User Profile Setup

During user registration or first-time setup, prompt users to create their profile:

```tsx
// packages/frontend/pages/onboarding/profile/+Page.tsx
export const ProfileSetupPage: React.FC = () => {
  return (
    <div className="onboarding-profile">
      <h2>Set Up Your Profile</h2>
      <p>
        This helps us provide better packing recommendations for your trips.
      </p>
      <UserProfileForm />
    </div>
  );
};
```

## Implementation Phases (Vertical Slices)

### Slice 1: User Profile Management

**Goal**: Complete profile management functionality

#### Database Schema (Minimal)

```sql
-- Start with basic user profile support
CREATE TABLE public.user_people (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  is_user_profile BOOLEAN DEFAULT TRUE, -- Start with only user profiles
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT FALSE
);
```

#### Complete Stack for Profile

- UserPerson model
- Basic sync for user profiles only
- Profile state slice + selectors
- Profile management page
- CRUD operations

**Demo**: User creates profile, edits it, sees changes persist

### Slice 2: Profile Auto-Added to Trips

**Goal**: Profile automatically appears in trips

#### Enhanced Models

```typescript
// Add to existing Person model
export type Person = {
  // ... existing fields
  userPersonId?: string; // Link to user profile
};
```

#### Trip Integration

- Update trip creation logic
- Auto-add profile to new trips
- Show profile in trip people list
- Profile badge/indicator

**Demo**: Create trip → see your profile automatically added

### Slice 3: Person Templates & Reuse

**Goal**: Full template functionality

#### Extended Database

```sql
-- Allow multiple people per user (not just profile)
ALTER TABLE public.user_people
ALTER COLUMN is_user_profile SET DEFAULT FALSE;
-- Now supports both user profile AND other people
```

#### Enhanced Features

- Multiple people per user
- Template selection UI
- "Save as template" functionality
- Enhanced person management page

**Demo**: Save family members → quickly add to any trip

## Testing Strategy

### Unit Tests

- Model validation and transformations
- Sync conflict resolution scenarios
- State management actions and selectors
- Component logic and rendering

### Integration Tests

- Sync between offline and online states
- Person template creation and usage
- Trip creation with user profile

### E2E Tests

- Complete person management workflow
- Cross-trip person reuse scenarios
- Onboarding flow
- Performance under load

## Performance Considerations

### Database

- Proper indexing on foreign keys
- Query optimization for person lookups
- Efficient migration strategy

### Frontend

- Lazy loading of person management
- Memoized selectors to prevent re-renders
- Optimistic updates for better UX

### Sync

- Batch operations for bulk changes
- Conflict resolution for user people
- Efficient change detection

## Risk Mitigation

### Data Integrity

- Non-destructive migration approach
- Comprehensive rollback plan
- Monitoring for sync conflicts

### Performance

- Query performance testing
- Memory usage monitoring
- Offline storage impact assessment

### User Experience

- Gradual feature rollout
- A/B testing for UI changes
- User feedback collection and iteration

This technical specification provides the foundation for implementing reusable people functionality while maintaining compatibility with the existing system architecture.

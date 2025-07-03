# Reusable People Technical Specification

## Architecture Overview

### Data Model Changes

#### 1. New Database Tables

```sql
-- User-level reusable people templates
CREATE TABLE public.user_people (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  is_default_user BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT FALSE,

  CONSTRAINT user_people_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT user_people_age_valid CHECK (age IS NULL OR (age >= 0 AND age <= 150)),
  CONSTRAINT user_people_gender_valid CHECK (gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer-not-to-say')),
  CONSTRAINT user_people_one_default_per_user UNIQUE (user_id, is_default_user) DEFERRABLE INITIALLY DEFERRED
);

-- Add reference to user_people in trip_people
ALTER TABLE public.trip_people
ADD COLUMN user_person_id UUID REFERENCES public.user_people(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX idx_user_people_user_id ON public.user_people(user_id);
CREATE INDEX idx_user_people_user_active ON public.user_people(user_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_user_people_default ON public.user_people(user_id, is_default_user) WHERE is_default_user = TRUE;
CREATE INDEX idx_trip_people_user_person ON public.trip_people(user_person_id);
```

#### 2. RLS Policies

```sql
-- User people policies
CREATE POLICY "Users can view their own people" ON public.user_people
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own people" ON public.user_people
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own people" ON public.user_people
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own people" ON public.user_people
  FOR DELETE USING (auth.uid() = user_id);
```

### TypeScript Models

#### 1. UserPerson Model

```typescript
// packages/model/src/lib/UserPerson.ts
export type UserPerson = {
  id: string;
  userId: string;
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  settings?: Record<string, unknown>;
  isDefaultUser: boolean;

  // Sync tracking
  createdAt: string;
  updatedAt: string;
  version: number;
  isDeleted: boolean;
};

export type CreateUserPersonInput = Omit<
  UserPerson,
  'id' | 'createdAt' | 'updatedAt' | 'version' | 'isDeleted'
>;

export type UpdateUserPersonInput = Partial<CreateUserPersonInput> & {
  id: string;
};
```

#### 2. Enhanced Person Model

```typescript
// packages/model/src/lib/Person.ts (updated)
export type Person = {
  id: string;
  tripId: string;
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  settings?: Record<string, unknown>;

  // NEW: Reference to user person template
  userPersonId?: string; // Reference to UserPerson

  // Sync tracking
  createdAt: string;
  updatedAt: string;
  version: number;
  isDeleted: boolean;
};

// Helper to check if person is from template
export const isPersonFromTemplate = (person: Person): boolean => {
  return !!person.userPersonId;
};
```

### Sync Layer Implementation

#### 1. New Sync Types

```typescript
// packages/model/src/lib/SyncTypes.ts (additions)
export type UserPersonChange = BaseChange & {
  entityType: 'user_person';
  entityId: string;
  data: Partial<UserPerson> & { id?: string };
  tripId?: never; // User people are not trip-specific
};

// Update the Change union type
export type Change =
  | TripChange
  | PersonChange
  | ItemChange
  | RuleOverrideChange
  | DefaultItemRuleChange
  | RulePackChange
  | TripRuleChange
  | PackingStatusChange
  | BulkPackingChange
  | UserPersonChange; // NEW
```

#### 2. Sync Handler

```typescript
// packages/state/src/lib/sync/user-people-sync.ts
import { UserPerson, UserPersonChange } from '@packing-list/model';
import { supabase } from '@packing-list/supabase';

export class UserPeopleSync {
  async syncUserPeople(
    userId: string,
    lastSyncTime: number
  ): Promise<{
    changes: UserPersonChange[];
    serverData: UserPerson[];
  }> {
    // Fetch server changes since last sync
    const { data: serverChanges, error } = await supabase
      .from('user_people')
      .select('*')
      .eq('user_id', userId)
      .gte('updated_at', new Date(lastSyncTime).toISOString());

    if (error) throw error;

    // Convert to change objects
    const changes: UserPersonChange[] = serverChanges.map((person) => ({
      id: `user_person_${person.id}_${person.version}`,
      entityType: 'user_person',
      entityId: person.id,
      operation: person.is_deleted ? 'delete' : 'update',
      data: person,
      timestamp: new Date(person.updated_at).getTime(),
      userId,
      version: person.version,
      synced: true,
    }));

    return { changes, serverData: serverChanges };
  }

  async pushUserPersonChanges(changes: UserPersonChange[]): Promise<void> {
    for (const change of changes) {
      const { data, error } = await supabase
        .from('user_people')
        .upsert(change.data, { onConflict: 'id' });

      if (error) throw error;
    }
  }
}
```

### State Management

#### 1. User People Slice

```typescript
// packages/state/src/user-people-slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserPerson } from '@packing-list/model';

interface UserPeopleState {
  byId: Record<string, UserPerson>;
  allIds: string[];
  defaultUserId: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserPeopleState = {
  byId: {},
  allIds: [],
  defaultUserId: null,
  isLoading: false,
  error: null,
};

const userPeopleSlice = createSlice({
  name: 'userPeople',
  initialState,
  reducers: {
    setUserPeople: (state, action: PayloadAction<UserPerson[]>) => {
      state.byId = {};
      state.allIds = [];

      action.payload.forEach((person) => {
        state.byId[person.id] = person;
        state.allIds.push(person.id);

        if (person.isDefaultUser) {
          state.defaultUserId = person.id;
        }
      });
    },

    addUserPerson: (state, action: PayloadAction<UserPerson>) => {
      const person = action.payload;
      state.byId[person.id] = person;

      if (!state.allIds.includes(person.id)) {
        state.allIds.push(person.id);
      }

      if (person.isDefaultUser) {
        state.defaultUserId = person.id;
      }
    },

    updateUserPerson: (state, action: PayloadAction<UserPerson>) => {
      const person = action.payload;
      state.byId[person.id] = person;

      if (person.isDefaultUser) {
        state.defaultUserId = person.id;
      }
    },

    removeUserPerson: (state, action: PayloadAction<string>) => {
      const personId = action.payload;
      delete state.byId[personId];
      state.allIds = state.allIds.filter((id) => id !== personId);

      if (state.defaultUserId === personId) {
        state.defaultUserId = null;
      }
    },
  },
});

export const {
  setUserPeople,
  addUserPerson,
  updateUserPerson,
  removeUserPerson,
} = userPeopleSlice.actions;
export default userPeopleSlice.reducer;
```

#### 2. Enhanced Selectors

```typescript
// packages/state/src/selectors.ts (additions)
import { RootState } from './store';
import { UserPerson, Person } from '@packing-list/model';

export const selectUserPeople = (state: RootState): UserPerson[] => {
  return state.userPeople.allIds.map((id) => state.userPeople.byId[id]);
};

export const selectDefaultUserPerson = (
  state: RootState
): UserPerson | null => {
  const defaultId = state.userPeople.defaultUserId;
  return defaultId ? state.userPeople.byId[defaultId] : null;
};

export const selectUserPersonById = (
  state: RootState,
  personId: string
): UserPerson | null => {
  return state.userPeople.byId[personId] || null;
};

export const selectAvailablePeopleForTrip = (
  state: RootState,
  tripId: string
): {
  userPeople: UserPerson[];
  tripPeople: Person[];
} => {
  const userPeople = selectUserPeople(state);
  const tripPeople = selectPeopleByTripId(state, tripId);

  return { userPeople, tripPeople };
};
```

### Frontend Implementation

#### 1. Person Management Page

```tsx
// packages/frontend/pages/people/manage/+Page.tsx
import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@packing-list/state';
import { UserPersonCard } from '../components/UserPersonCard';
import { UserPersonForm } from '../components/UserPersonForm';
import { PageHeader } from '../../../components/PageHeader';
import { PageContainer } from '../../../components/PageContainer';

export default function ManagePeoplePage() {
  const dispatch = useAppDispatch();
  const userPeople = useAppSelector(selectUserPeople);
  const defaultUserPerson = useAppSelector(selectDefaultUserPerson);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePerson = (personData: CreateUserPersonInput) => {
    dispatch(createUserPerson(personData));
    setIsCreating(false);
  };

  const handleSetDefault = (personId: string) => {
    dispatch(setDefaultUserPerson(personId));
  };

  return (
    <PageContainer>
      <PageHeader title="Manage People" />

      <div className="space-y-4">
        <div className="bg-base-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Default Person</h3>
          <p className="text-sm text-base-content/70 mb-4">
            Your default person will be automatically added to new trips.
          </p>

          {defaultUserPerson ? (
            <UserPersonCard
              person={defaultUserPerson}
              isDefault={true}
              onEdit={() => {
                /* TODO */
              }}
              onDelete={() => {
                /* TODO */
              }}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-base-content/70 mb-4">No default person set</p>
              <button
                className="btn btn-primary"
                onClick={() => setIsCreating(true)}
              >
                Create Default Person
              </button>
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">All People</h3>
            <button
              className="btn btn-secondary"
              onClick={() => setIsCreating(true)}
            >
              Add Person
            </button>
          </div>

          <div className="grid gap-4">
            {userPeople.map((person) => (
              <UserPersonCard
                key={person.id}
                person={person}
                isDefault={person.isDefaultUser}
                onEdit={() => {
                  /* TODO */
                }}
                onDelete={() => {
                  /* TODO */
                }}
                onSetDefault={() => handleSetDefault(person.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {isCreating && (
        <UserPersonForm
          onSubmit={handleCreatePerson}
          onCancel={() => setIsCreating(false)}
        />
      )}
    </PageContainer>
  );
}
```

#### 2. Enhanced Person Selection Component

```tsx
// packages/frontend/pages/people/components/PersonTemplateSelector.tsx
import React from 'react';
import { UserPerson } from '@packing-list/model';
import { useAppSelector } from '@packing-list/state';

interface PersonTemplateSelectorProps {
  onSelectTemplate: (template: UserPerson) => void;
  onCreateNew: () => void;
}

export const PersonTemplateSelector: React.FC<PersonTemplateSelectorProps> = ({
  onSelectTemplate,
  onCreateNew,
}) => {
  const userPeople = useAppSelector(selectUserPeople);

  return (
    <div className="bg-base-100 rounded-lg p-4 border">
      <h3 className="text-lg font-semibold mb-4">Add Person to Trip</h3>

      {userPeople.length > 0 && (
        <>
          <h4 className="text-sm font-medium mb-2">Quick Add from Templates</h4>
          <div className="grid gap-2 mb-4">
            {userPeople.map((person) => (
              <button
                key={person.id}
                className="btn btn-outline btn-sm justify-start"
                onClick={() => onSelectTemplate(person)}
              >
                <span className="font-medium">{person.name}</span>
                {person.age && <span className="text-xs">({person.age})</span>}
                {person.isDefaultUser && (
                  <span className="badge badge-primary badge-xs">Default</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      <button className="btn btn-primary w-full" onClick={onCreateNew}>
        Create New Person
      </button>
    </div>
  );
};
```

#### 3. Auto-Add Default User to New Trips

```typescript
// packages/state/src/action-handlers/trip-creation.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { CreateTripInput, Trip } from '@packing-list/model';
import { RootState } from '../store';
import { selectDefaultUserPerson } from '../selectors';

export const createTripWithDefaults = createAsyncThunk<
  Trip,
  CreateTripInput,
  { state: RootState }
>('trips/createWithDefaults', async (tripData, { getState, dispatch }) => {
  // Create the trip first
  const trip = await dispatch(createTrip(tripData)).unwrap();

  // Auto-add default user person if exists
  const defaultUserPerson = selectDefaultUserPerson(getState());
  if (defaultUserPerson) {
    await dispatch(
      createPersonFromTemplate({
        tripId: trip.id,
        userPersonId: defaultUserPerson.id,
        overrides: {}, // No overrides for default user
      })
    );
  }

  return trip;
});
```

## Migration Strategy

### 1. Database Migration

```sql
-- Migration function to populate user_people from existing trip_people
CREATE OR REPLACE FUNCTION migrate_existing_people_to_user_people()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  person_record RECORD;
  first_person_id UUID;
BEGIN
  -- For each user, find their most common person names and create user_people
  FOR user_record IN
    SELECT DISTINCT t.user_id
    FROM trips t
    JOIN trip_people tp ON t.id = tp.trip_id
    WHERE tp.is_deleted = FALSE
  LOOP
    -- Find the most frequently used person name for this user
    SELECT tp.name, tp.age, tp.gender, tp.settings, tp.id
    INTO person_record
    FROM trip_people tp
    JOIN trips t ON tp.trip_id = t.id
    WHERE t.user_id = user_record.user_id
      AND tp.is_deleted = FALSE
    GROUP BY tp.name, tp.age, tp.gender, tp.settings, tp.id
    ORDER BY COUNT(*) DESC
    LIMIT 1;

    IF person_record.name IS NOT NULL THEN
      -- Create user person (assume first one found is the default user)
      INSERT INTO user_people (user_id, name, age, gender, settings, is_default_user)
      VALUES (
        user_record.user_id,
        person_record.name,
        person_record.age,
        person_record.gender,
        person_record.settings,
        TRUE -- First person becomes default
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the migration
SELECT migrate_existing_people_to_user_people();
```

### 2. Frontend Migration Banner

```tsx
// packages/frontend/components/PeopleMigrationBanner.tsx
import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@packing-list/state';

export const PeopleMigrationBanner: React.FC = () => {
  const dispatch = useAppDispatch();
  const [isVisible, setIsVisible] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);

  const handleMigrate = async () => {
    setIsMigrating(true);
    try {
      await dispatch(migrateTripPeopleToUserPeople()).unwrap();
      setIsVisible(false);
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="alert alert-info mb-4">
      <div className="flex-1">
        <h3 className="font-semibold">New Feature: Reusable People</h3>
        <p className="text-sm">
          We can now save people from your trips for reuse. Would you like to
          import your existing people as templates?
        </p>
      </div>
      <div className="flex gap-2">
        <button
          className="btn btn-sm btn-primary"
          onClick={handleMigrate}
          disabled={isMigrating}
        >
          {isMigrating ? 'Migrating...' : 'Import People'}
        </button>
        <button
          className="btn btn-sm btn-ghost"
          onClick={() => setIsVisible(false)}
        >
          Skip
        </button>
      </div>
    </div>
  );
};
```

## Testing Strategy

### 1. Unit Tests

```typescript
// packages/state/src/__tests__/user-people-slice.test.ts
import { configureStore } from '@reduxjs/toolkit';
import userPeopleReducer, {
  setUserPeople,
  addUserPerson,
  updateUserPerson,
  removeUserPerson,
} from '../user-people-slice';
import { UserPerson } from '@packing-list/model';

describe('userPeopleSlice', () => {
  const mockUserPerson: UserPerson = {
    id: '1',
    userId: 'user1',
    name: 'John Doe',
    age: 30,
    gender: 'male',
    settings: {},
    isDefaultUser: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    version: 1,
    isDeleted: false,
  };

  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: { userPeople: userPeopleReducer },
    });
  });

  it('should set user people correctly', () => {
    store.dispatch(setUserPeople([mockUserPerson]));

    const state = store.getState().userPeople;
    expect(state.byId['1']).toEqual(mockUserPerson);
    expect(state.allIds).toEqual(['1']);
    expect(state.defaultUserId).toBe('1');
  });

  it('should add user person correctly', () => {
    store.dispatch(addUserPerson(mockUserPerson));

    const state = store.getState().userPeople;
    expect(state.byId['1']).toEqual(mockUserPerson);
    expect(state.allIds).toContain('1');
  });

  // More tests...
});
```

### 2. E2E Tests

```typescript
// e2e/frontend-e2e/src/reusable-people.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Reusable People Feature', () => {
  test('should create and reuse people across trips', async ({ page }) => {
    // Setup: Login and create a person template
    await page.goto('/people/manage');
    await page.click('text=Add Person');
    await page.fill('[data-testid=person-name]', 'John Doe');
    await page.fill('[data-testid=person-age]', '30');
    await page.selectOption('[data-testid=person-gender]', 'male');
    await page.click('[data-testid=set-as-default]');
    await page.click('text=Save');

    // Test: Create new trip and verify default person is added
    await page.goto('/trips/new');
    await page.fill('[data-testid=trip-title]', 'Test Trip');
    await page.click('text=Create Trip');

    // Verify default person was auto-added
    await page.goto('/people');
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(
      page.locator('[data-testid=default-person-badge]')
    ).toBeVisible();

    // Test: Create another trip and quick-add from template
    await page.goto('/trips/new');
    await page.fill('[data-testid=trip-title]', 'Another Trip');
    await page.click('text=Create Trip');

    await page.goto('/people');
    await page.click('text=Add Person');
    await page.click('text=John Doe'); // Quick add from template

    // Verify person was added from template
    await expect(page.locator('text=John Doe').nth(1)).toBeVisible();
  });

  test('should handle person template updates', async ({ page }) => {
    // Test updating a person template and verifying it affects future uses
    // but not existing trip people
    await page.goto('/people/manage');
    await page.click('[data-testid=edit-person-1]');
    await page.fill('[data-testid=person-name]', 'John Smith');
    await page.click('text=Save');

    // Create new trip and verify updated template is used
    await page.goto('/trips/new');
    await page.fill('[data-testid=trip-title]', 'New Trip');
    await page.click('text=Create Trip');

    await page.goto('/people');
    await expect(page.locator('text=John Smith')).toBeVisible();
  });
});
```

## Performance Considerations

### 1. Query Optimization

```sql
-- Ensure efficient queries for user people
EXPLAIN ANALYZE SELECT * FROM user_people WHERE user_id = $1 AND is_deleted = FALSE;

-- Index on composite columns for common queries
CREATE INDEX idx_user_people_user_active_default
ON user_people(user_id, is_deleted, is_default_user)
WHERE is_deleted = FALSE;
```

### 2. Frontend Optimization

```typescript
// Memoized selectors to prevent unnecessary re-renders
import { createSelector } from '@reduxjs/toolkit';

export const selectUserPeopleMemoized = createSelector(
  [
    (state: RootState) => state.userPeople.byId,
    (state: RootState) => state.userPeople.allIds,
  ],
  (byId, allIds) => allIds.map((id) => byId[id])
);

// Lazy loading for person management page
const ManagePeoplePage = lazy(() => import('./pages/people/manage/+Page'));
```

This technical specification provides a complete implementation roadmap for the reusable people feature, ensuring compatibility with the existing sync system while adding powerful new functionality for user experience improvement.

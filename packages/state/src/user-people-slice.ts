// User People State Management - Sprint 3
// Enhanced slice supporting user profile + multiple people templates

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserPerson } from '@packing-list/model';
import { HydrateOfflineAction } from './action-handlers/hydrate-offline.js';

import { uuid } from '@packing-list/shared-utils';

// State interface for user people management (Sprint 3)
interface UserPeopleState {
  people: UserPerson[]; // All user's people (profile + templates)
  isLoading: boolean;
  error: string | null;
  hasTriedToLoad: boolean; // Track if we've attempted to load people
}

const initialState: UserPeopleState = {
  people: [],
  isLoading: false,
  error: null,
  hasTriedToLoad: false,
};

// Enhanced people slice with template support
const userPeopleSlice = createSlice({
  name: 'userPeople',
  initialState,
  reducers: {
    // Set all user people (used by sync integration)
    setUserPeople: (state, action: PayloadAction<UserPerson[]>) => {
      state.people = action.payload;
      state.hasTriedToLoad = true;
      state.error = null;
      state.isLoading = false;
    },

    // Add or update a single user person
    upsertUserPerson: (state, action: PayloadAction<UserPerson>) => {
      const index = state.people.findIndex((p) => p.id === action.payload.id);
      if (index >= 0) {
        state.people[index] = action.payload;
      } else {
        state.people.push(action.payload);
      }
      state.hasTriedToLoad = true;
      state.error = null;
    },

    createUserPerson: (
      state,
      action: PayloadAction<
        Omit<
          UserPerson,
          'id' | 'createdAt' | 'updatedAt' | 'version' | 'isDeleted'
        >
      >
    ) => {
      state.people.push({
        ...action.payload,
        id: uuid(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        isDeleted: false,
      });
      state.hasTriedToLoad = true;
      state.error = null;
    },

    // Remove a user person
    removeUserPerson: (state, action: PayloadAction<string>) => {
      state.people = state.people.filter((p) => p.id !== action.payload);
    },

    // Clear all people
    clearUserPeople: (state) => {
      state.people = [];
      state.error = null;
      state.isLoading = false;
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Reset entire state
    resetPeopleState: (state) => {
      state.people = [];
      state.isLoading = false;
      state.error = null;
      state.hasTriedToLoad = false;
    },

    // Mark as tried to load (used when sync completes)
    markAsTriedToLoad: (state) => {
      state.hasTriedToLoad = true;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    // Handle sync actions that update user people
    builder
      .addCase('HYDRATE_OFFLINE', (state, action: HydrateOfflineAction) => {
        const { userPeople } = action.payload;
        if (userPeople) {
          if (userPeople.people) {
            state.people = userPeople.people;
            state.hasTriedToLoad = true;
            state.error = null;
            state.isLoading = false;
          }
        }
      })
      .addCase(
        'BULK_UPSERT_SYNCED_ENTITIES',
        (
          state,
          action: {
            type: 'BULK_UPSERT_SYNCED_ENTITIES';
            payload: {
              userPeople?: UserPerson[];
            };
          }
        ) => {
          const { userPeople } = action.payload || {};

          if (userPeople && userPeople.length > 0) {
            console.log(
              `👥 [USER PEOPLE REDUCER] Updating ${userPeople.length} user people from sync`,
              userPeople
            );

            // Replace with synced people
            state.people = userPeople.filter((p) => !p.isDeleted);
            state.hasTriedToLoad = true;
            state.error = null;
            state.isLoading = false;

            console.log(
              `✅ [USER PEOPLE REDUCER] Updated user people state with ${state.people.length} people`
            );
          }
        }
      )
      .addCase(
        'MERGE_SYNCED_USER_PERSON',
        (
          state,
          action: { type: 'MERGE_SYNCED_USER_PERSON'; payload: UserPerson }
        ) => {
          const person = action.payload;
          if (person.isDeleted) {
            state.people = state.people.filter((p) => p.id !== person.id);
          } else {
            const index = state.people.findIndex((p) => p.id === person.id);
            if (index >= 0) {
              state.people[index] = person;
            } else {
              state.people.push(person);
            }
          }
          state.hasTriedToLoad = true;
          state.error = null;
          state.isLoading = false;
        }
      );
  },
});

// Action creators
export const {
  setUserPeople,
  upsertUserPerson,
  removeUserPerson,
  clearUserPeople,
  setLoading,
  setError,
  clearError,
  resetPeopleState,
  markAsTriedToLoad,
  createUserPerson,
} = userPeopleSlice.actions;

// Reducer
export default userPeopleSlice.reducer;

// Enhanced selectors for Sprint 3
export const selectUserPeople = (state: { userPeople: UserPeopleState }) =>
  state.userPeople.people;

export const selectUserProfile = (state: { userPeople: UserPeopleState }) =>
  state.userPeople.people.find((p) => p.isUserProfile) || null;

export const selectUserTemplates = (state: { userPeople: UserPeopleState }) =>
  state.userPeople.people.filter((p) => !p.isUserProfile);

export const selectUserPeopleLoading = (state: {
  userPeople: UserPeopleState;
}) => state.userPeople.isLoading;

export const selectUserPeopleError = (state: { userPeople: UserPeopleState }) =>
  state.userPeople.error;

export const selectHasUserProfile = (state: { userPeople: UserPeopleState }) =>
  state.userPeople.people.some((p) => p.isUserProfile);

export const selectUserPeopleState = (state: { userPeople: UserPeopleState }) =>
  state.userPeople;

export const selectUserPersonById = (
  state: { userPeople: UserPeopleState },
  id: string
) => state.userPeople.people.find((p) => p.id === id) || null;

// Type exports for use in components
export type { UserPeopleState };

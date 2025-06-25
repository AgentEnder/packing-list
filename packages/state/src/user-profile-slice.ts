// User Profile State Management - Sprint 1
// Simplified slice - sync integration handles persistence

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserPerson } from '@packing-list/model';

// State interface for user profile management (Sprint 1)
interface UserProfileState {
  profile: UserPerson | null;
  isLoading: boolean;
  error: string | null;
  hasTriedToLoad: boolean; // Track if we've attempted to load profile
}

const initialState: UserProfileState = {
  profile: null,
  isLoading: false,
  error: null,
  hasTriedToLoad: false,
};

// Profile slice with simple reducers
const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState,
  reducers: {
    // Set profile (used by sync integration)
    setUserProfile: (state, action: PayloadAction<UserPerson>) => {
      state.profile = action.payload;
      state.hasTriedToLoad = true;
      state.error = null;
      state.isLoading = false;
    },

    // Clear profile
    clearUserProfile: (state) => {
      state.profile = null;
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
    resetProfileState: (state) => {
      state.profile = null;
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
    // Handle sync actions that update user profile
    builder
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
            for (const syncedUserPerson of userPeople) {
              // Update user profile state if this is a user profile
              if (syncedUserPerson.isUserProfile) {
                console.log(
                  `👤 [USER PROFILE REDUCER] Updating profile from sync: ${syncedUserPerson.name} (${syncedUserPerson.id}) for user ${syncedUserPerson.userId}`,
                  syncedUserPerson
                );

                // Only update if this synced user person matches the current user
                // or if we don't have a profile yet
                if (
                  syncedUserPerson.userId === state.profile?.userId ||
                  !state.profile
                ) {
                  state.profile = syncedUserPerson;
                  state.hasTriedToLoad = true;
                  state.error = null;
                  state.isLoading = false;

                  console.log(
                    `✅ [USER PROFILE REDUCER] Updated user profile state for user: ${syncedUserPerson.userId}`,
                    state.profile
                  );
                }
              }
            }
          }
        }
      )
      .addCase(
        'MERGE_SYNCED_USER_PERSON',
        (
          state,
          action: { type: 'MERGE_SYNCED_USER_PERSON'; payload: UserPerson }
        ) => {
          if (action.payload.isUserProfile) {
            state.profile = action.payload;
            state.hasTriedToLoad = true;
            state.error = null;
            state.isLoading = false;
          }
        }
      );
  },
});

// Action creators
export const {
  setUserProfile,
  clearUserProfile,
  setLoading,
  setError,
  clearError,
  resetProfileState,
  markAsTriedToLoad,
} = userProfileSlice.actions;

// Reducer
export default userProfileSlice.reducer;

// Selectors
export const selectUserProfile = (state: { userProfile: UserProfileState }) =>
  state.userProfile.profile;

export const selectUserProfileLoading = (state: {
  userProfile: UserProfileState;
}) => state.userProfile.isLoading;

export const selectUserProfileError = (state: {
  userProfile: UserProfileState;
}) => state.userProfile.error;

export const selectHasUserProfile = (state: {
  userProfile: UserProfileState;
}) => state.userProfile.profile !== null;

export const selectUserProfileState = (state: {
  userProfile: UserProfileState;
}) => state.userProfile;

// Type exports for use in components
export type { UserProfileState };

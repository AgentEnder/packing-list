// User Profile State Management - Sprint 1
// Profile-only implementation (not full templates yet)

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  UserPerson,
  CreateUserPersonInput,
  UpdateUserPersonInput,
  validateUserPerson,
} from '@packing-list/model';

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

// Async thunks for profile operations
export const createUserProfile = createAsyncThunk<
  UserPerson,
  CreateUserPersonInput,
  { rejectValue: string }
>('userProfile/create', async (profileData, { rejectWithValue }) => {
  try {
    // Validate input
    const errors = validateUserPerson(profileData);
    if (errors.length > 0) {
      return rejectWithValue(errors.join(', '));
    }

    // TODO: Replace with actual API call to Supabase
    // For now, create a mock profile with generated ID
    const mockProfile: UserPerson = {
      id: `profile_${Date.now()}`,
      ...profileData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      isDeleted: false,
    };

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return mockProfile;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to create profile'
    );
  }
});

export const updateUserProfile = createAsyncThunk<
  UserPerson,
  UpdateUserPersonInput,
  { rejectValue: string }
>('userProfile/update', async (updateData, { rejectWithValue }) => {
  try {
    // Validate input - convert to CreateUserPersonInput format for validation
    const validationData: CreateUserPersonInput = {
      userId: updateData.userId || 'temp', // Provide default for validation
      name: updateData.name || 'temp',
      age: updateData.age,
      gender: updateData.gender,
      settings: updateData.settings,
      isUserProfile: updateData.isUserProfile ?? true,
    };
    const errors = validateUserPerson(validationData);
    if (errors.length > 0) {
      return rejectWithValue(errors.join(', '));
    }

    // TODO: Replace with actual API call to Supabase
    // For now, simulate update
    const mockUpdatedProfile: UserPerson = {
      id: updateData.id,
      userId: updateData.userId || 'user1', // Default for mock
      name: updateData.name || 'Unknown',
      age: updateData.age,
      gender: updateData.gender,
      settings: updateData.settings || {},
      isUserProfile: updateData.isUserProfile ?? true,
      createdAt: '2025-01-25T00:00:00Z', // Mock timestamp
      updatedAt: new Date().toISOString(),
      version: 2, // Increment version
      isDeleted: false,
    };

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return mockUpdatedProfile;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to update profile'
    );
  }
});

export const loadUserProfile = createAsyncThunk<
  UserPerson | null,
  string, // userId
  { rejectValue: string }
>('userProfile/load', async (userId, { rejectWithValue }) => {
  try {
    // TODO: Replace with actual API call to Supabase
    // For now, return null (no profile found)
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Mock: Return null to simulate no existing profile
    return null;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to load profile'
    );
  }
});

export const deleteUserProfile = createAsyncThunk<
  void,
  string, // profileId
  { rejectValue: string }
>('userProfile/delete', async (profileId, { rejectWithValue }) => {
  try {
    // TODO: Replace with actual API call to Supabase
    // For now, just simulate deletion
    await new Promise((resolve) => setTimeout(resolve, 100));
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to delete profile'
    );
  }
});

// Profile slice
const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetProfileState: (state) => {
      state.profile = null;
      state.isLoading = false;
      state.error = null;
      state.hasTriedToLoad = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create profile
      .addCase(createUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.error = null;
        state.hasTriedToLoad = true;
      })
      .addCase(createUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to create profile';
      })

      // Update profile
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to update profile';
      })

      // Load profile
      .addCase(loadUserProfile.pending, (state) => {
        if (!state.hasTriedToLoad) {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(loadUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.error = null;
        state.hasTriedToLoad = true;
      })
      .addCase(loadUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to load profile';
        state.hasTriedToLoad = true;
      })

      // Delete profile
      .addCase(deleteUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUserProfile.fulfilled, (state) => {
        state.isLoading = false;
        state.profile = null;
        state.error = null;
      })
      .addCase(deleteUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to delete profile';
      });
  },
});

// Action creators
export const { clearError, resetProfileState } = userProfileSlice.actions;

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

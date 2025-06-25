import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import userProfileReducer, {
  clearError,
  resetProfileState,
  selectUserProfile,
  selectUserProfileLoading,
  selectUserProfileError,
  selectHasUserProfile,
} from '../user-profile-slice.js';

interface UserProfileTestState {
  userProfile: {
    profile: unknown;
    isLoading: boolean;
    error: string | null;
    hasTriedToLoad: boolean;
  };
}

describe('userProfileSlice', () => {
  it('should have correct initial state', () => {
    const store = configureStore({
      reducer: { userProfile: userProfileReducer },
    });

    const state = store.getState() as UserProfileTestState;
    expect(state.userProfile).toEqual({
      profile: null,
      isLoading: false,
      error: null,
      hasTriedToLoad: false,
    });
  });

  it('should clear error state', () => {
    const store = configureStore({
      reducer: { userProfile: userProfileReducer },
    });

    // Clear error
    store.dispatch(clearError());
    const state = store.getState() as UserProfileTestState;
    expect(state.userProfile.error).toBeNull();
  });

  it('should reset profile state', () => {
    const store = configureStore({
      reducer: { userProfile: userProfileReducer },
    });

    store.dispatch(resetProfileState());
    const state = store.getState() as UserProfileTestState;
    expect(state.userProfile).toEqual({
      profile: null,
      isLoading: false,
      error: null,
      hasTriedToLoad: false,
    });
  });

  describe('selectors', () => {
    const mockState = {
      userProfile: {
        profile: {
          id: '1',
          userId: 'user1',
          name: 'John Doe',
          age: 30,
          gender: 'male' as const,
          settings: {},
          isUserProfile: true,
          createdAt: '2025-01-25T00:00:00Z',
          updatedAt: '2025-01-25T00:00:00Z',
          version: 1,
          isDeleted: false,
        },
        isLoading: false,
        error: null,
        hasTriedToLoad: true,
      },
    };

    it('selectUserProfile should return profile', () => {
      expect(selectUserProfile(mockState)).toEqual(
        mockState.userProfile.profile
      );
    });

    it('selectUserProfileLoading should return loading state', () => {
      expect(selectUserProfileLoading(mockState)).toBe(false);
    });

    it('selectUserProfileError should return error state', () => {
      expect(selectUserProfileError(mockState)).toBeNull();
    });

    it('selectHasUserProfile should return true when profile exists', () => {
      expect(selectHasUserProfile(mockState)).toBe(true);
    });

    it('selectHasUserProfile should return false when profile is null', () => {
      const stateWithoutProfile = {
        userProfile: {
          ...mockState.userProfile,
          profile: null,
        },
      };
      expect(selectHasUserProfile(stateWithoutProfile)).toBe(false);
    });
  });
});

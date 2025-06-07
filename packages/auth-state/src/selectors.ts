import { createSelector } from '@reduxjs/toolkit';
import type { AuthState } from './auth-slice.js';

// Type for the root state that includes auth
export interface RootState {
  auth: AuthState;
}

// Base selectors
export const selectAuth = (state: RootState) => state.auth;

// Derived selectors
export const selectUser = createSelector([selectAuth], (auth) => auth.user);

export const selectSession = createSelector(
  [selectAuth],
  (auth) => auth.session
);

export const selectIsAuthenticated = createSelector(
  [selectUser],
  (user) => !!user
);

export const selectIsLoading = createSelector(
  [selectAuth],
  (auth) => auth.loading
);

export const selectIsAuthenticating = createSelector(
  [selectAuth],
  (auth) => auth.isAuthenticating
);

export const selectError = createSelector([selectAuth], (auth) => auth.error);

export const selectLastError = createSelector(
  [selectAuth],
  (auth) => auth.lastError
);

export const selectIsOfflineMode = createSelector(
  [selectAuth],
  (auth) => auth.isOfflineMode
);

export const selectConnectivityState = createSelector(
  [selectAuth],
  (auth) => auth.connectivityState
);

export const selectIsOnline = createSelector(
  [selectConnectivityState],
  (connectivity) => connectivity.isOnline
);

export const selectIsConnected = createSelector(
  [selectConnectivityState],
  (connectivity) => connectivity.isConnected
);

export const selectIsInitialized = createSelector(
  [selectAuth],
  (auth) => auth.isInitialized
);

export const selectUserEmail = createSelector(
  [selectUser],
  (user) => user?.email
);

export const selectUserName = createSelector(
  [selectUser],
  (user) => user?.name
);

export const selectUserAvatar = createSelector(
  [selectUser],
  (user) => user?.avatar_url
);

// Composite selectors
export const selectAuthStatus = createSelector(
  [
    selectIsAuthenticated,
    selectIsLoading,
    selectIsInitialized,
    selectIsOfflineMode,
  ],
  (isAuthenticated, isLoading, isInitialized, isOfflineMode) => ({
    isAuthenticated,
    isLoading,
    isInitialized,
    isOfflineMode,
  })
);

export const selectConnectivityStatus = createSelector(
  [selectIsOnline, selectIsConnected, selectIsOfflineMode],
  (isOnline, isConnected, isOfflineMode) => ({
    isOnline,
    isConnected,
    isOfflineMode,
    canUseRemoteAuth: isConnected && !isOfflineMode,
  })
);

export const selectOfflineAccounts = (state: RootState) =>
  state.auth.offlineAccounts;
export const selectHasOfflinePasscode = (state: RootState) =>
  state.auth.hasOfflinePasscode;
export const selectForceOfflineMode = (state: RootState) =>
  state.auth.forceOfflineMode;

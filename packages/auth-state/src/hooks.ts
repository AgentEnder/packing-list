import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  clearError,
  updateConnectivityState,
  updateAuthState,
  initializeAuth,
  signInWithGooglePopup,
  signInWithPassword,
  signInOfflineWithoutPassword,
  signUp,
  signOut,
  setOfflinePasscode,
  removeOfflinePasscode,
  checkConnectivity,
  setForceOfflineMode as setForceOfflineModeAction,
  deleteAccount,
  useAuthDispatch,
  type AuthState,
} from './auth-slice.js';
import {
  selectUser,
  selectSession,
  selectIsAuthenticated,
  selectIsLoading,
  selectIsAuthenticating,
  selectError,
  selectLastError,
  selectIsOfflineMode,
  selectConnectivityState,
  selectIsOnline,
  selectIsConnected,
  selectIsInitialized,
  selectUserEmail,
  selectUserName,
  selectUserAvatar,
  selectAuthStatus,
  selectConnectivityStatus,
  selectOfflineAccounts,
  selectHasOfflinePasscode,
  selectForceOfflineMode,
} from './selectors.js';
import {
  authService,
  LocalAuthService,
  LocalAuthState,
  ConnectivityState,
  getConnectivityService,
} from '@packing-list/auth';

// Create service instances
const localAuthService = new LocalAuthService();
const connectivityService = getConnectivityService(
  import.meta.env.PUBLIC_ENV__SUPABASE_URL
);

// Check if we're on the server (SSR)
const isServer = (import.meta as { env?: { SSR?: boolean } }).env?.SSR;

// SSR-safe hook that provides fallback values when Redux is not available
function useSSRSafeSelector<T, T2>(
  selector: (state: { auth: AuthState }) => T,
  fallbackValue: T2
): T | T2 {
  try {
    if (isServer) {
      return fallbackValue;
    }
    return useSelector(selector);
  } catch {
    return fallbackValue;
  }
}

function useSSRSafeDispatch() {
  try {
    if (isServer) {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return () => {}; // No-op function for SSR
    }
    return useAuthDispatch();
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return () => {}; // No-op function if Redux context is not available
  }
}

export function useAuth() {
  const dispatch = useSSRSafeDispatch();

  // Selectors with SSR-safe fallbacks
  const user = useSSRSafeSelector(selectUser, null);
  const session = useSSRSafeSelector(selectSession, null);
  const isAuthenticated = useSSRSafeSelector(selectIsAuthenticated, false);
  const loading = useSSRSafeSelector(selectIsLoading, true);
  const isAuthenticating = useSSRSafeSelector(selectIsAuthenticating, false);
  const error = useSSRSafeSelector(selectError, null);
  const lastError = useSSRSafeSelector(selectLastError, null);
  const isOfflineMode = useSSRSafeSelector(selectIsOfflineMode, false);
  const forceOfflineMode = useSSRSafeSelector(selectForceOfflineMode, false);
  const connectivityState = useSSRSafeSelector(selectConnectivityState, null);
  const isOnline = useSSRSafeSelector(selectIsOnline, true);
  const isConnected = useSSRSafeSelector(selectIsConnected, false);
  const isInitialized = useSSRSafeSelector(selectIsInitialized, false);
  const userEmail = useSSRSafeSelector(selectUserEmail, null);
  const userName = useSSRSafeSelector(selectUserName, null);
  const userAvatar = useSSRSafeSelector(selectUserAvatar, null);
  const authStatus = useSSRSafeSelector(selectAuthStatus, {
    isAuthenticated: false,
    isLoading: true,
    isInitialized: false,
    isOfflineMode: false,
  });
  const connectivityStatus = useSSRSafeSelector(selectConnectivityStatus, {
    isOnline: true,
    isConnected: false,
    isOfflineMode: false,
    canUseRemoteAuth: false,
  });
  const offlineAccounts = useSSRSafeSelector(selectOfflineAccounts, []);
  const hasOfflinePasscode = useSSRSafeSelector(
    selectHasOfflinePasscode,
    false
  );

  // Helper function to determine if sign-in options should be shown
  const shouldShowSignInOptions = useMemo(() => {
    if (!user) return true;

    // Always show sign-in options for shared account
    if (
      user.id === 'local-shared-user' ||
      user.email === 'shared@local.device' ||
      user.isShared === true
    ) {
      return true;
    }

    // Don't show sign-in options for authenticated users
    return false;
  }, [user]);

  // Track if user is remotely authenticated (signed in with Google)
  const isRemotelyAuthenticated = useMemo(() => {
    if (isServer || isOfflineMode) return false;
    try {
      return authService.isRemotelyAuthenticated();
    } catch {
      return false;
    }
  }, [isOfflineMode]);

  // Initialize auth on mount and set up subscriptions (client-side only)
  useEffect(() => {
    if (isServer) return;

    // Initialize auth state
    dispatch(initializeAuth(undefined));

    // Subscribe to auth service changes (only for online auth state)
    const unsubscribeAuth = authService.subscribe((authState) => {
      if (!isOfflineMode) {
        dispatch(updateAuthState(authState));
      }
    });

    // Subscribe to local auth service changes (only for offline auth state)
    const unsubscribeLocalAuth = localAuthService.subscribe(
      (localAuthState: LocalAuthState) => {
        if (isOfflineMode) {
          dispatch(
            updateAuthState({
              user: localAuthState.user
                ? {
                    id: localAuthState.user.id,
                    email: localAuthState.user.email,
                    name: localAuthState.user.name,
                    avatar_url: localAuthState.user.avatar_url,
                    created_at: localAuthState.user.created_at,
                  }
                : null,
              session: localAuthState.session,
              loading: localAuthState.loading,
              error: localAuthState.error,
            })
          );
        }
      }
    );

    // Subscribe to connectivity changes
    const unsubscribeConnectivity = connectivityService.subscribe(
      (connectivityState: ConnectivityState) => {
        dispatch(updateConnectivityState(connectivityState));
      }
    );

    return () => {
      unsubscribeAuth();
      unsubscribeLocalAuth();
      unsubscribeConnectivity();
    };
  }, [dispatch, isOfflineMode]);

  const signInWithGooglePopupAuth = async () => {
    return dispatch(signInWithGooglePopup(undefined));
  };

  const signOutUser = async () => {
    return dispatch(signOut(undefined));
  };

  const setOfflinePass = async (
    currentPassword: string | undefined,
    newPasscode: string,
    userId?: string
  ) => {
    return dispatch(
      setOfflinePasscode({ currentPassword, newPasscode, userId })
    );
  };

  const removeOfflinePass = async (
    currentPasscode: string,
    userId?: string
  ) => {
    return dispatch(removeOfflinePasscode({ currentPasscode, userId }));
  };

  const deleteUserAccount = async () => {
    return dispatch(deleteAccount(undefined));
  };

  const checkConnectivityNow = async () => {
    return dispatch(checkConnectivity(undefined));
  };

  const clearErrorAction = () => {
    dispatch(clearError(null));
  };

  return {
    // State
    user,
    session,
    isAuthenticated,
    loading,
    isAuthenticating,
    error,
    lastError,
    isOfflineMode,
    forceOfflineMode,
    connectivityState,
    isOnline,
    isConnected,
    isInitialized,
    userEmail,
    userName,
    userAvatar,
    authStatus,
    connectivityStatus,
    offlineAccounts,
    hasOfflinePasscode,
    shouldShowSignInOptions,
    isRemotelyAuthenticated,

    // Actions - return thunks directly for better TypeScript support
    signInWithGooglePopup: () => dispatch(signInWithGooglePopup(undefined)),
    signInWithPassword: (email: string, password: string) =>
      dispatch(signInWithPassword({ email, password })),
    signInOfflineWithoutPassword: (email: string) =>
      dispatch(signInOfflineWithoutPassword({ email })),
    signUp: (email: string, password: string, metadata?: { name?: string }) =>
      dispatch(signUp({ email, password, metadata })),
    signOut: () => dispatch(signOut(undefined)),
    setOfflinePasscode: (
      currentPassword: string | undefined,
      newPasscode: string,
      userId?: string
    ) => dispatch(setOfflinePasscode({ currentPassword, newPasscode, userId })),
    removeOfflinePasscode: (currentPasscode: string, userId?: string) =>
      dispatch(removeOfflinePasscode({ currentPasscode, userId })),
    deleteAccount: () => dispatch(deleteAccount(undefined)),
    checkConnectivity: () => dispatch(checkConnectivity(undefined)),
    setForceOfflineMode: (force: boolean) =>
      dispatch(setForceOfflineModeAction(force)),
    clearError: () => dispatch(clearError(null)),

    // Deprecated - keeping for backward compatibility but prefer the direct thunks above
    signInWithGooglePopupAuth,
    signOutUser,
    setOfflinePass,
    removeOfflinePass,
    deleteUserAccount,
    checkConnectivityNow,
    clearErrorAction,
  };
}

// Selector hooks for more granular usage (also SSR-safe)
export const useAuthUser = () => useSSRSafeSelector(selectUser, null);
export const useAuthSession = () => useSSRSafeSelector(selectSession, null);
export const useIsAuthenticated = () =>
  useSSRSafeSelector(selectIsAuthenticated, false);
export const useAuthLoading = () => useSSRSafeSelector(selectIsLoading, true);
export const useAuthError = () => useSSRSafeSelector(selectError, null);
export const useIsOfflineMode = () =>
  useSSRSafeSelector(selectIsOfflineMode, false);
export const useConnectivityState = () =>
  useSSRSafeSelector(selectConnectivityState, null);
export const useAuthStatus = () =>
  useSSRSafeSelector(selectAuthStatus, {
    isAuthenticated: false,
  });
export const useConnectivityStatus = () =>
  useSSRSafeSelector(selectConnectivityStatus, 'unknown');

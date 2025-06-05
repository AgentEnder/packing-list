import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  clearError,
  updateConnectivityState,
  updateAuthState,
  initializeAuth,
  signInWithPassword,
  signInOfflineWithoutPassword,
  signUp,
  signInWithGoogle,
  signInWithGooglePopup,
  signOut,
  setOfflinePasscode,
  removeOfflinePasscode,
  checkConnectivity,
  setForceOfflineMode as setForceOfflineModeAction,
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
  ConnectivityService,
  ConnectivityState,
} from '@packing-list/auth';

// Create service instances
const localAuthService = new LocalAuthService();
const connectivityService = new ConnectivityService();

// Check if we're on the server (SSR)
const isServer = (import.meta as any).env?.SSR;

// SSR-safe hook that provides fallback values when Redux is not available
function useSSRSafeSelector<T>(selector: any, fallbackValue: T): T {
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
    return useDispatch();
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
  const authStatus = useSSRSafeSelector(selectAuthStatus, 'loading');
  const connectivityStatus = useSSRSafeSelector(
    selectConnectivityStatus,
    'unknown'
  );
  const offlineAccounts = useSSRSafeSelector(selectOfflineAccounts, []);
  const hasOfflinePasscode = useSSRSafeSelector(
    selectHasOfflinePasscode,
    false
  );

  // Initialize auth on mount and set up subscriptions (client-side only)
  useEffect(() => {
    if (isServer) return;

    // Initialize auth state
    (dispatch as any)(initializeAuth());

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

  // Auth action methods
  const signIn = async (email: string, password: string) => {
    return (dispatch as any)(signInWithPassword({ email, password }));
  };

  const signInOfflineWithoutPass = async (email: string) => {
    return (dispatch as any)(signInOfflineWithoutPassword({ email }));
  };

  const signUpUser = async (
    email: string,
    password: string,
    metadata?: { name?: string }
  ) => {
    return (dispatch as any)(signUp({ email, password, metadata }));
  };

  const signInWithGoogleAuth = async () => {
    return (dispatch as any)(signInWithGoogle());
  };

  const signInWithGooglePopupAuth = async () => {
    return (dispatch as any)(signInWithGooglePopup());
  };

  const signOutUser = async () => {
    return (dispatch as any)(signOut());
  };

  const setOfflinePass = async (
    currentPassword: string | undefined,
    newPasscode: string
  ) => {
    return (dispatch as any)(
      setOfflinePasscode({ currentPassword, newPasscode })
    );
  };

  const removeOfflinePass = async (currentPasscode: string) => {
    return (dispatch as any)(removeOfflinePasscode({ currentPasscode }));
  };

  const checkConnectivityNow = async () => {
    return (dispatch as any)(checkConnectivity());
  };

  const setForceOfflineMode = (force: boolean) => {
    dispatch(setForceOfflineModeAction(force));
  };

  const clearErrorAction = () => {
    dispatch(clearError());
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

    // Actions
    signIn,
    signInOfflineWithoutPassword: signInOfflineWithoutPass,
    signUp: signUpUser,
    signInWithGoogle: signInWithGoogleAuth,
    signInWithGooglePopup: signInWithGooglePopupAuth,
    signOut: signOutUser,
    setOfflinePasscode: setOfflinePass,
    removeOfflinePasscode: removeOfflinePass,
    checkConnectivity: checkConnectivityNow,
    setForceOfflineMode,
    clearError: clearErrorAction,
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
  useSSRSafeSelector(selectAuthStatus, 'loading');
export const useConnectivityStatus = () =>
  useSSRSafeSelector(selectConnectivityStatus, 'unknown');

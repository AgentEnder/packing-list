import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  Slice,
  ThunkDispatch,
  UnknownAction,
} from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import {
  authService,
  AuthUser,
  AuthState as BaseAuthState,
} from '@packing-list/auth';
import { LocalAuthService, LocalAuthUser } from '@packing-list/auth';
import {
  ConnectivityService,
  ConnectivityState,
  getConnectivityService,
} from '@packing-list/auth';

// Create service instances
const localAuthService = new LocalAuthService();
const connectivityService = getConnectivityService(
  import.meta.env.PUBLIC_ENV__SUPABASE_URL
);

export interface AuthState {
  // User and session info
  user: AuthUser | null;
  session: unknown | null;

  // UI state
  loading: boolean;
  error: string | null;
  lastError: string | null;
  isAuthenticating: boolean;
  isInitialized: boolean;

  // Mode state
  isOfflineMode: boolean;
  forceOfflineMode: boolean;
  connectivityState: ConnectivityState;

  // Offline account state
  offlineAccounts: LocalAuthUser[];
  hasOfflinePasscode: boolean;
}

const initialState: AuthState = {
  user: null,
  session: null,
  loading: true,
  error: null,
  lastError: null,
  isAuthenticating: false,
  isInitialized: false,
  isOfflineMode: false,
  forceOfflineMode: false,
  connectivityState: { isOnline: true, isConnected: true },
  offlineAccounts: [],
  hasOfflinePasscode: false,
};

// Helper functions
function transformLocalUserToAuthUser(localUser: LocalAuthUser): AuthUser {
  // Check if this is the shared account
  const isShared =
    localUser.id === 'local-shared-user' ||
    localUser.email === 'shared@local.device';

  return {
    id: localUser.id,
    email: localUser.email,
    name: localUser.name,
    avatar_url: localUser.avatar_url,
    created_at: localUser.created_at,
    type: 'local',
    isShared,
  };
}

async function createOfflineAccountForOnlineUser(
  onlineUser: AuthUser
): Promise<void> {
  console.log('Creating offline account for online user:', onlineUser);

  // Check if offline account already exists
  const existingOfflineUsers = await localAuthService.getLocalUsers();
  console.log('Existing offline users:', existingOfflineUsers);

  const existingOfflineUser = existingOfflineUsers.find(
    (u: LocalAuthUser) => u.email === onlineUser.email
  );

  if (!existingOfflineUser) {
    console.log('No existing offline user found, creating new one');
    // Create offline account without password (will use passwordless access until passcode is set)
    const result = await localAuthService.createOfflineAccountForOnlineUser({
      id: onlineUser.id,
      email: onlineUser.email,
      name: onlineUser.name,
      avatar_url: onlineUser.avatar_url,
    });
    console.log('Offline account creation result:', result);
  } else {
    console.log('Offline user already exists:', existingOfflineUser);
  }
}

// Async Thunks
export const initializeAuth = createAsyncThunk(
  'auth/initializeAuth',
  async (_, { getState, rejectWithValue }) => {
    // Check connectivity with timeout to prevent blocking auth init
    let connectivityState: ConnectivityState;
    try {
      const connectivityPromise = connectivityService.checkNow();
      const timeoutPromise = new Promise<ConnectivityState>((_, reject) =>
        setTimeout(() => reject(new Error('Connectivity check timeout')), 2000)
      );

      connectivityState = await Promise.race([
        connectivityPromise,
        timeoutPromise,
      ]);
    } catch (error) {
      // If connectivity check times out or fails, assume online for better UX
      // Better to err on the side of trying remote auth first
      connectivityState = { isOnline: true, isConnected: true };
    }

    // Get current state to check forceOfflineMode
    const currentState = getState() as { auth: AuthState };

    // Determine if we should start in offline mode
    const shouldUseOfflineMode =
      currentState.auth.forceOfflineMode ||
      !connectivityState.isConnected ||
      !connectivityState.isOnline;

    // Get offline accounts
    const offlineAccounts = await localAuthService.getLocalUsers();

    if (shouldUseOfflineMode) {
      // When going offline, we need to check the current auth service state
      // to determine if user should be on shared account or personal account
      const authServiceState = authService.getState();

      if (authServiceState.user.isShared) {
        // If user is currently using shared account, keep them on shared account in offline mode
        await authService.getLocalAuthService().signOut();
        await authService
          .getLocalAuthService()
          .signInWithoutPassword('shared@local.device', true);
      } else if (
        authServiceState.user &&
        authServiceState.isRemoteAuthenticated
      ) {
        // If user has a real account, try to switch to their personal local account
        const personalLocalUserId = `local-${authServiceState.user.id}`;
        const personalLocalUser = offlineAccounts.find(
          (u: LocalAuthUser) => u.id === personalLocalUserId
        );

        if (personalLocalUser) {
          // Switch to personal local account
          console.log(
            '🔧 [AUTH SLICE] Switching to personal local account for offline mode:',
            personalLocalUser.email
          );
          await localAuthService.signInWithoutPassword(
            personalLocalUser.email,
            true
          );
        } else {
          // No personal local account found, fall back to shared account
          console.log(
            '🔧 [AUTH SLICE] No personal local account found, switching to shared account'
          );
          await authService.getLocalAuthService().signOut();
          await authService
            .getLocalAuthService()
            .signInWithoutPassword('shared@local.device', true);
        }
      }
      // If neither shared nor remotely authenticated, just use current local state

      // Get the current local auth state
      const localState = localAuthService.getState();

      return {
        user: localState.user
          ? transformLocalUserToAuthUser(localState.user)
          : null,
        session: localState.session,
        loading: false,
        error: localState.error,
        isOfflineMode: true,
        connectivityState,
        offlineAccounts,
        hasOfflinePasscode: localState.user
          ? !!localState.user.passcode_hash
          : false,
      };
    } else {
      // Start with remote auth state
      const remoteState = authService.getState();

      // Check if current user has an offline passcode
      let hasOfflinePasscode = false;
      if (remoteState.user) {
        hasOfflinePasscode = await localAuthService.hasPasscode(
          remoteState.user.id
        );
      }

      return {
        user: remoteState.user,
        session: remoteState.session,
        loading: remoteState.loading,
        error: remoteState.error,
        isOfflineMode: false,
        connectivityState,
        offlineAccounts,
        hasOfflinePasscode,
      };
    }
  }
);

export const checkConnectivity = createAsyncThunk(
  'auth/checkConnectivity',
  async () => {
    return await connectivityService.checkNow();
  }
);

export const signInWithGooglePopup = createAsyncThunk(
  'auth/signInWithGooglePopup',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };

    if (state.auth.isOfflineMode) {
      return rejectWithValue('Google sign-in not available in offline mode');
    }

    console.log('Starting Google popup sign-in');
    const result = await authService.signInWithGooglePopup();
    if (result.error) {
      return rejectWithValue(result.error);
    }

    const remoteState = authService.getState();
    console.log('Google popup sign-in remote state:', remoteState);

    // Auto-create offline account for Google user
    if (remoteState.user) {
      console.log(
        'Creating offline account for Google popup user:',
        remoteState.user
      );
      await createOfflineAccountForOnlineUser(remoteState.user);
    } else {
      console.log('No user in Google popup sign-in remote state');
    }

    const finalOfflineAccounts = await localAuthService.getLocalUsers();
    console.log(
      'Final offline accounts after Google popup sign-in:',
      finalOfflineAccounts
    );

    return {
      user: remoteState.user,
      session: remoteState.session,
      loading: false,
      error: null,
      offlineAccounts: finalOfflineAccounts,
    };
  }
);

export const signInWithPassword = createAsyncThunk(
  'auth/signInWithPassword',
  async (
    { email, password }: { email: string; password: string },
    { getState, rejectWithValue }
  ) => {
    const state = getState() as { auth: AuthState };

    if (state.auth.isOfflineMode) {
      const result = await localAuthService.signIn(email, password);
      if (result.error) {
        return rejectWithValue(result.error);
      }
      const localState = localAuthService.getState();
      return {
        user: localState.user
          ? transformLocalUserToAuthUser(localState.user)
          : null,
        session: localState.session,
        loading: false,
        error: null,
        offlineAccounts: await localAuthService.getLocalUsers(),
      };
    }

    // For online mode, we only support Google sign-in now
    return rejectWithValue('Password sign-in only available in offline mode');
  }
);

export const signInOfflineWithoutPassword = createAsyncThunk(
  'auth/signInOfflineWithoutPassword',
  async ({ email }: { email: string }, { getState, rejectWithValue }) => {
    const result = await localAuthService.signInWithoutPassword(email);
    if (result.error) {
      return rejectWithValue(result.error);
    }

    const localState = localAuthService.getState();
    return {
      user: localState.user
        ? transformLocalUserToAuthUser(localState.user)
        : null,
      session: localState.session,
      loading: false,
      error: null,
      offlineAccounts: await localAuthService.getLocalUsers(),
    };
  }
);

export const signUp = createAsyncThunk(
  'auth/signUp',
  async (
    {
      email,
      password,
      metadata,
    }: {
      email: string;
      password: string;
      metadata?: { name?: string };
    },
    { getState, rejectWithValue }
  ) => {
    const state = getState() as { auth: AuthState };

    if (state.auth.isOfflineMode) {
      const result = await localAuthService.signUp(email, password, metadata);
      if (result.error) {
        return rejectWithValue(result.error);
      }
      const localState = localAuthService.getState();
      return {
        user: localState.user
          ? transformLocalUserToAuthUser(localState.user)
          : null,
        session: localState.session,
        loading: false,
        error: null,
        offlineAccounts: await localAuthService.getLocalUsers(),
      };
    }

    // For online mode, we only support Google sign-in now
    return rejectWithValue('Sign-up only available in offline mode');
  }
);

export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };

    if (state.auth.isOfflineMode) {
      // In offline mode, sign out and switch to shared account
      await localAuthService.signOut();

      const result = await localAuthService.signInWithoutPassword(
        'shared@local.device',
        true
      ); // bypass passcode for automatic transition
      if (result.error) {
        return rejectWithValue(result.error);
      }

      // Get the shared account state
      const localState = localAuthService.getState();
      return {
        user: localState.user
          ? transformLocalUserToAuthUser(localState.user)
          : null,
        session: null,
        loading: false,
        error: null,
      };
    } else {
      // In online mode, sign out from remote auth
      const result = await authService.signOut();
      if (result.error) {
        return rejectWithValue(result.error);
      }

      // The auth service will handle switching back to shared account
      // Return the current auth service state
      const authServiceState = authService.getState();
      return {
        user: authServiceState.user,
        session: authServiceState.session,
        loading: false,
        error: null,
      };
    }
  }
);

export const setOfflinePasscode = createAsyncThunk(
  'auth/setOfflinePasscode',
  async (
    {
      currentPassword,
      newPasscode,
      userId,
    }: { currentPassword?: string; newPasscode: string; userId?: string },
    { rejectWithValue }
  ) => {
    const result = await localAuthService.setPasscode(
      currentPassword,
      newPasscode,
      userId
    );
    if (result.error) {
      return rejectWithValue(result.error);
    }

    return {
      hasOfflinePasscode: true,
      offlineAccounts: await localAuthService.getLocalUsers(),
    };
  }
);

export const removeOfflinePasscode = createAsyncThunk(
  'auth/removeOfflinePasscode',
  async (
    { currentPasscode, userId }: { currentPasscode: string; userId?: string },
    { rejectWithValue }
  ) => {
    const result = await localAuthService.removePasscode(
      currentPasscode,
      userId
    );
    if (result.error) {
      return rejectWithValue(result.error);
    }

    return {
      hasOfflinePasscode: false,
      offlineAccounts: await localAuthService.getLocalUsers(),
    };
  }
);

export const deleteAccount = createAsyncThunk(
  'auth/deleteAccount',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };

    if (state.auth.isOfflineMode) {
      const result = await localAuthService.deleteAccount();
      if (result.error) {
        return rejectWithValue(result.error);
      }
    } else {
      // For remote accounts, we only support Google sign-in now
      return rejectWithValue('Account deletion only available in offline mode');
    }

    return {
      user: null,
      session: null,
      loading: false,
      error: null,
      offlineAccounts: await localAuthService.getLocalUsers(),
    };
  }
);

// Create the auth slice
export const authSlice: Slice<AuthState> = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Sync state updates
    updateAuthState: (state, action: PayloadAction<Partial<AuthState>>) => {
      Object.assign(state, action.payload);
    },

    updateConnectivityState: (
      state,
      action: PayloadAction<ConnectivityState>
    ) => {
      state.connectivityState = action.payload;

      // Automatically determine if we should switch modes
      const shouldUseOfflineMode =
        state.forceOfflineMode ||
        !action.payload.isConnected ||
        !action.payload.isOnline;

      if (shouldUseOfflineMode !== state.isOfflineMode) {
        state.isOfflineMode = shouldUseOfflineMode;
      }
    },

    setForceOfflineMode: (state, action: PayloadAction<boolean>) => {
      state.forceOfflineMode = action.payload;
      state.isOfflineMode =
        action.payload ||
        !state.connectivityState.isConnected ||
        !state.connectivityState.isOnline;
    },

    clearError: (state) => {
      state.error = null;
      state.lastError = null;
    },

    resetAuthState: () => {
      return { ...initialState, isInitialized: true };
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize auth
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
        state.isInitialized = false;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.isInitialized = true;
        state.loading = false;
        state.error = null;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.loading = false;
        state.isInitialized = true;
        state.error = action.error.message || 'Initialization failed';
        state.lastError = action.error.message || 'Initialization failed';
      })

      // Check connectivity
      .addCase(checkConnectivity.fulfilled, (state, action) => {
        state.connectivityState = action.payload;

        // Automatically determine if we should switch modes
        const shouldUseOfflineMode =
          state.forceOfflineMode ||
          !action.payload.isConnected ||
          !action.payload.isOnline;

        if (shouldUseOfflineMode !== state.isOfflineMode) {
          state.isOfflineMode = shouldUseOfflineMode;
        }
      })

      // Google popup sign-in
      .addCase(signInWithGooglePopup.pending, (state) => {
        state.isAuthenticating = true;
        state.error = null;
      })
      .addCase(signInWithGooglePopup.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.isAuthenticating = false;
        state.error = null;
      })
      .addCase(signInWithGooglePopup.rejected, (state, action) => {
        state.isAuthenticating = false;
        state.error = action.payload as string;
        state.lastError = action.payload as string;
      })

      // Local sign-in with password
      .addCase(signInWithPassword.pending, (state) => {
        state.isAuthenticating = true;
        state.error = null;
      })
      .addCase(signInWithPassword.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.isAuthenticating = false;
        state.error = null;
      })
      .addCase(signInWithPassword.rejected, (state, action) => {
        state.isAuthenticating = false;
        state.error = action.payload as string;
        state.lastError = action.payload as string;
      })

      // Local sign-in without password
      .addCase(signInOfflineWithoutPassword.pending, (state) => {
        state.isAuthenticating = true;
        state.error = null;
      })
      .addCase(signInOfflineWithoutPassword.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.isAuthenticating = false;
        state.error = null;
      })
      .addCase(signInOfflineWithoutPassword.rejected, (state, action) => {
        state.isAuthenticating = false;
        state.error = action.payload as string;
        state.lastError = action.payload as string;
      })

      // Local sign-up
      .addCase(signUp.pending, (state) => {
        state.isAuthenticating = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.isAuthenticating = false;
        state.error = null;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.isAuthenticating = false;
        state.error = action.payload as string;
        state.lastError = action.payload as string;
      })

      // Sign out
      .addCase(signOut.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signOut.fulfilled, (state, action) => {
        Object.assign(state, {
          ...initialState,
          isInitialized: true,
          loading: false,
          connectivityState: state.connectivityState,
          isOfflineMode: state.isOfflineMode,
          forceOfflineMode: state.forceOfflineMode,
          offlineAccounts: state.offlineAccounts,
          hasOfflinePasscode: state.hasOfflinePasscode,
        });
      })
      .addCase(signOut.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.lastError = action.payload as string;
      })

      // Set offline passcode
      .addCase(setOfflinePasscode.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.error = null;
      })
      .addCase(setOfflinePasscode.rejected, (state, action) => {
        state.error = action.payload as string;
        state.lastError = action.payload as string;
      })

      // Remove offline passcode
      .addCase(removeOfflinePasscode.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.error = null;
      })
      .addCase(removeOfflinePasscode.rejected, (state, action) => {
        state.error = action.payload as string;
        state.lastError = action.payload as string;
      })

      // Delete account
      .addCase(deleteAccount.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.error = null;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.error = action.payload as string;
        state.lastError = action.payload as string;
      });
  },
});

export const {
  updateAuthState,
  updateConnectivityState,
  setForceOfflineMode,
  clearError,
  resetAuthState,
} = authSlice.actions;

// Create a typed dispatch for auth actions
export type AuthDispatch = ThunkDispatch<AuthState, unknown, UnknownAction>;

// Custom typed dispatch hook for auth actions
export const useAuthDispatch = () => useDispatch<AuthDispatch>();

export default authSlice.reducer;

import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  Slice,
} from '@reduxjs/toolkit';
import {
  authService,
  AuthUser,
  AuthState as BaseAuthState,
} from '@packing-list/auth';
import { LocalAuthService, LocalAuthUser } from '@packing-list/auth';
import { ConnectivityService, ConnectivityState } from '@packing-list/auth';

// Create service instances
const localAuthService = new LocalAuthService();
const connectivityService = new ConnectivityService();

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

// Async thunks
export const initializeAuth = createAsyncThunk('auth/initialize', async () => {
  // Check connectivity first
  const connectivityState = await connectivityService.checkNow();

  // Get offline accounts
  const offlineAccounts = await localAuthService.getLocalUsers();

  // Determine if we should start in offline mode
  const shouldUseOfflineMode =
    !connectivityState.isConnected || !connectivityState.isOnline;

  if (shouldUseOfflineMode) {
    // Start with local auth state
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
});

export const checkConnectivity = createAsyncThunk(
  'auth/checkConnectivity',
  async () => {
    return await connectivityService.checkNow();
  }
);

export const signInWithPassword = createAsyncThunk(
  'auth/signInWithPassword',
  async (
    { email, password }: { email: string; password: string },
    { getState, rejectWithValue }
  ) => {
    try {
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
      } else {
        console.log('Signing in online user with auth service');
        const result = await authService.signInWithPassword(email, password);
        if (result.error) {
          return rejectWithValue(result.error);
        }
        const remoteState = authService.getState();
        console.log('Remote auth state after sign in:', remoteState);

        // Auto-create offline account for online user
        if (remoteState.user) {
          console.log('Creating offline account for user:', remoteState.user);
          await createOfflineAccountForOnlineUser(remoteState.user);
        } else {
          console.log(
            'No user in remote state, skipping offline account creation'
          );
        }

        const finalOfflineAccounts = await localAuthService.getLocalUsers();
        console.log(
          'Final offline accounts after creation:',
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
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Sign in failed'
      );
    }
  }
);

export const signInOfflineWithoutPassword = createAsyncThunk(
  'auth/signInOfflineWithoutPassword',
  async ({ email }: { email: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };

      // Only allow if no passcode is set
      if (state.auth.hasOfflinePasscode) {
        return rejectWithValue('Offline passcode is required');
      }

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
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Passwordless sign in failed'
      );
    }
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
    try {
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
      } else {
        const result = await authService.signUp(email, password, metadata);
        if (result.error) {
          return rejectWithValue(result.error);
        }
        const remoteState = authService.getState();

        // Auto-create offline account for new online user
        if (remoteState.user) {
          await createOfflineAccountForOnlineUser(remoteState.user);
        }

        return {
          user: remoteState.user,
          session: remoteState.session,
          loading: false,
          error: null,
          offlineAccounts: await localAuthService.getLocalUsers(),
        };
      }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Sign up failed'
      );
    }
  }
);

export const signInWithGoogle = createAsyncThunk(
  'auth/signInWithGoogle',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };

      if (state.auth.isOfflineMode) {
        return rejectWithValue('Google sign-in not available in offline mode');
      }

      console.log('Starting Google sign-in');
      const result = await authService.signInWithGoogle();
      if (result.error) {
        return rejectWithValue(result.error);
      }

      const remoteState = authService.getState();
      console.log('Google sign-in remote state:', remoteState);

      // Auto-create offline account for Google user
      if (remoteState.user) {
        console.log(
          'Creating offline account for Google user:',
          remoteState.user
        );
        await createOfflineAccountForOnlineUser(remoteState.user);
      } else {
        console.log('No user in Google sign-in remote state');
      }

      const finalOfflineAccounts = await localAuthService.getLocalUsers();
      console.log(
        'Final offline accounts after Google sign-in:',
        finalOfflineAccounts
      );

      return {
        user: remoteState.user,
        session: remoteState.session,
        loading: false,
        error: null,
        offlineAccounts: finalOfflineAccounts,
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Google sign in failed'
      );
    }
  }
);

export const signInWithGooglePopup = createAsyncThunk(
  'auth/signInWithGooglePopup',
  async (_, { getState, rejectWithValue }) => {
    try {
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
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Google sign in failed'
      );
    }
  }
);

export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };

      if (state.auth.isOfflineMode) {
        await localAuthService.signOut();
      } else {
        const result = await authService.signOut();
        if (result.error) {
          return rejectWithValue(result.error);
        }
      }

      return {
        user: null,
        session: null,
        loading: false,
        error: null,
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Sign out failed'
      );
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
    try {
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
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to set offline passcode'
      );
    }
  }
);

export const removeOfflinePasscode = createAsyncThunk(
  'auth/removeOfflinePasscode',
  async (
    { currentPasscode, userId }: { currentPasscode: string; userId?: string },
    { rejectWithValue }
  ) => {
    try {
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
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to remove offline passcode'
      );
    }
  }
);

export const deleteAccount = createAsyncThunk(
  'auth/deleteAccount',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };

      if (state.auth.isOfflineMode) {
        const result = await localAuthService.deleteAccount();
        if (result.error) {
          return rejectWithValue(result.error);
        }
      } else {
        const result = await authService.deleteAccount();
        if (result.error) {
          return rejectWithValue(result.error);
        }
      }

      return {
        user: null,
        session: null,
        loading: false,
        error: null,
        offlineAccounts: await localAuthService.getLocalUsers(),
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Account deletion failed'
      );
    }
  }
);

// Helper functions
function transformLocalUserToAuthUser(localUser: LocalAuthUser): AuthUser {
  return {
    id: localUser.id,
    email: localUser.email,
    name: localUser.name,
    avatar_url: localUser.avatar_url,
    created_at: localUser.created_at,
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

// Create the auth slice
export const authSlice: Slice<AuthState> = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Sync actions
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
        state.error = action.payload as string;
        state.lastError = action.payload as string;
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

      // Sign in with password
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

      // Sign in offline without password
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

      // Sign up
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

      // Google sign in
      .addCase(signInWithGoogle.pending, (state) => {
        state.isAuthenticating = true;
        state.error = null;
      })
      .addCase(signInWithGoogle.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.isAuthenticating = false;
        state.error = null;
      })
      .addCase(signInWithGoogle.rejected, (state, action) => {
        state.isAuthenticating = false;
        state.error = action.payload as string;
        state.lastError = action.payload as string;
      })

      // Google popup sign in
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

export default authSlice.reducer;

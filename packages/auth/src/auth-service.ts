import { getSupabaseClient, isSupabaseAvailable } from '@packing-list/supabase';
import { LocalAuthService, type LocalAuthUser } from './local-auth-service.js';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at?: string;
  type: 'local' | 'remote';
  isShared?: boolean; // true for the default shared local account
}

// Type for remote user from Supabase
interface RemoteUser {
  id: string;
  email?: string;
  created_at?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    display_name?: string;
    avatar_url?: string;
    picture?: string;
  };
  identities?: Array<{
    identity_data?: {
      picture?: string;
    };
  }>;
}

export interface AuthState {
  user: AuthUser; // Always has a user, never null
  session: unknown | null; // Remote session, null for local users
  loading: boolean;
  error: string | null;
  isRemoteAuthenticated: boolean; // true when connected to Google
}

// Generate a consistent ID for the shared local user
function getSharedLocalUserId(): string {
  return 'local-shared-user';
}

// Generate a personal local user ID based on remote user ID
function getPersonalLocalUserId(remoteUserId: string): string {
  console.trace('getPersonalLocalUserId', remoteUserId);
  return `local-${remoteUserId}`;
}

// Create the default shared local user
function createSharedLocalUser(): AuthUser {
  return {
    id: getSharedLocalUserId(),
    email: 'shared@local.device', // Unique email that won't conflict with real users
    name: 'Shared Account',
    type: 'local',
    isShared: true,
    created_at: new Date().toISOString(),
  };
}

// Convert LocalAuthUser to AuthUser
function convertLocalUser(
  localUser: LocalAuthUser,
  isShared = false
): AuthUser {
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

function getBaseUrl(): string {
  if (import.meta.env.PUBLIC_ENV__LOCATION) {
    return import.meta.env.PUBLIC_ENV__LOCATION;
  }

  // Use environment variable for production base URL
  const envBaseUrl = import.meta.env?.PUBLIC_ENV__BASE_URL;

  const origin =
    (typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000') + (envBaseUrl ? envBaseUrl : '');

  if (origin) {
    return origin;
  }

  if (envBaseUrl) {
    return envBaseUrl;
  }

  // Fallback to window.location.origin for development
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
}

export class AuthService {
  private listeners: Array<(state: AuthState) => void> = [];
  private currentState: AuthState = {
    user: createSharedLocalUser(), // Start with shared user, will be updated during init
    session: null,
    loading: true,
    error: null,
    isRemoteAuthenticated: false,
  };
  private supabaseAvailable: boolean;
  private initializationPromise: Promise<void>;
  private localAuthService: LocalAuthService;
  private lastRemoteUser: RemoteUser | null = null; // Track last known remote user for connectivity loss

  constructor() {
    this.supabaseAvailable = isSupabaseAvailable();
    this.localAuthService = new LocalAuthService();
    this.initializationPromise = this.initializeAuth();
  }

  private async initializeAuth() {
    // Check if there's a current local user session
    await new Promise<void>((resolve) => {
      const unsubscribe = this.localAuthService.subscribe((localState) => {
        if (!localState.loading) {
          if (localState.user) {
            // Check if this is the shared local user
            const isShared =
              localState.user.id === getSharedLocalUserId() ||
              localState.user.email === 'shared@local.device';

            // Use the existing local user, properly marking if it's shared
            this.updateState({
              user: convertLocalUser(localState.user, isShared),
            });
          } else {
            // No local user, check if we need to create the shared user
            this.ensureSharedLocalUser();
          }
          unsubscribe();
          resolve();
        }
      });
    });

    if (!this.supabaseAvailable) {
      // If Supabase is not available, just use local user
      this.updateState({
        loading: false,
        error: null,
      });
      return;
    }

    try {
      const supabase = getSupabaseClient();

      // Get initial session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        this.updateState({
          loading: false,
          error: error.message,
        });
        return;
      }

      if (session?.user) {
        // We have a cached session, but we need to validate it's still valid on the server
        // This is important after database resets where local storage has stale tokens
        console.log(
          '🔧 [AUTH SERVICE] Found cached session, validating with server...'
        );

        try {
          // Try to make an authenticated request to validate the session
          const { error: userError } = await supabase.auth.getUser();

          if (userError) {
            // Session is invalid (e.g., after database reset)
            console.log(
              '🔧 [AUTH SERVICE] Cached session is invalid:',
              userError.message
            );
            console.log(
              '🔧 [AUTH SERVICE] Clearing invalid session and switching to shared account...'
            );

            // Clear the invalid session
            await supabase.auth.signOut();

            // Switch to shared local account
            await this.switchToSharedLocalAccount();
            return;
          }

          // Session is valid, proceed with remote user sign-in
          console.log('🔧 [AUTH SERVICE] Session validated successfully');
          await this.handleRemoteUserSignIn(
            session.user as RemoteUser,
            session
          );
        } catch (validationError) {
          // Network error or other issue during validation
          console.log(
            '🔧 [AUTH SERVICE] Session validation failed:',
            validationError
          );
          console.log(
            '🔧 [AUTH SERVICE] Clearing session due to validation failure...'
          );

          // Clear the session and fall back to shared account
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.log(
              '🔧 [AUTH SERVICE] Sign out failed during cleanup:',
              signOutError
            );
          }

          await this.switchToSharedLocalAccount();
          return;
        }
      } else {
        // No remote session, stay with local user
        this.updateState({
          loading: false,
          error: null,
        });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(
        async (event: unknown, session: unknown) => {
          if (
            session &&
            typeof session === 'object' &&
            'user' in session &&
            session?.user &&
            typeof session.user === 'object' &&
            'id' in session.user
          ) {
            // Remote user signed in
            await this.handleRemoteUserSignIn(
              session.user as RemoteUser,
              session
            );
          } else {
            // Remote user signed out, return to shared local user
            await this.handleRemoteUserSignOut();
          }
        }
      );
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.updateState({
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async ensureSharedLocalUser() {
    console.log('🔧 [AUTH SERVICE] Ensuring shared local user exists...');

    try {
      // Check if we're in a build/SSR environment where storage might not be available
      const isBuildTime =
        typeof window === 'undefined' ||
        (import.meta as { env?: { SSR?: boolean } }).env?.SSR;

      if (isBuildTime) {
        console.log(
          '🔧 [AUTH SERVICE] Build/SSR environment detected, using in-memory shared user'
        );
        // In build/SSR environment, just use in-memory user without trying to persist
        // The LocalAuthService will handle state properly for this environment
        const sharedUserData = createSharedLocalUser();

        // Set the user directly in local auth service state without storage
        const localState = this.localAuthService.getState();
        if (
          !localState.user ||
          localState.user.email !== 'shared@local.device'
        ) {
          // Create a proper LocalAuthUser object
          const sharedLocalUser = {
            id: sharedUserData.id,
            email: sharedUserData.email,
            name: sharedUserData.name || 'Shared Account',
            created_at: sharedUserData.created_at || new Date().toISOString(),
            password_hash: '',
            passcode_hash: undefined,
            avatar_url: undefined,
          };

          // Manually update the local auth service state for build time
          this.localAuthService['updateState']?.({
            user: sharedLocalUser,
            session: {
              user: sharedLocalUser,
              expires_at: new Date(
                Date.now() + 24 * 60 * 60 * 1000
              ).toISOString(),
            },
            loading: false,
            error: null,
          });
        }
        return;
      }

      const localUsers = await this.localAuthService.getLocalUsers();
      const sharedUser = localUsers.find(
        (u) =>
          u.id === getSharedLocalUserId() || u.email === 'shared@local.device'
      );

      if (!sharedUser) {
        console.log('🔧 [AUTH SERVICE] Creating new shared local user...');
        const sharedUserData = createSharedLocalUser();

        const result = await this.localAuthService.signUp(
          sharedUserData.email, // Use email for signup
          'local-shared-password', // Default password for shared user
          {
            name: sharedUserData.name,
            id: sharedUserData.id, // Use the deterministic ID
          }
        );

        if (result.error) {
          console.warn(
            '🔧 [AUTH SERVICE] Failed to create shared user via signup:',
            result.error
          );
          // Check if the user was actually created despite the error
          const updatedUsers = await this.localAuthService.getLocalUsers();
          const createdUser = updatedUsers.find(
            (u) =>
              u.id === getSharedLocalUserId() ||
              u.email === 'shared@local.device'
          );

          if (!createdUser) {
            throw new Error(`Failed to create shared user: ${result.error}`);
          }
          console.log(
            '🔧 [AUTH SERVICE] Shared user was created despite error'
          );
        } else {
          console.log('🔧 [AUTH SERVICE] Successfully created shared user');
        }
      } else {
        console.log(
          '🔧 [AUTH SERVICE] Shared user already exists:',
          sharedUser.email
        );
      }

      // Always attempt to sign in as shared user - this ensures we're using it
      console.log('🔧 [AUTH SERVICE] Signing in as shared user...');
      const signInResult = await this.localAuthService.signInWithoutPassword(
        'shared@local.device',
        true // bypass passcode for shared account
      );

      if (signInResult.error) {
        console.warn(
          '🔧 [AUTH SERVICE] Failed to sign in as shared user:',
          signInResult.error
        );

        // Try to find the user by ID as fallback
        const allUsers = await this.localAuthService.getLocalUsers();
        const sharedUserById = allUsers.find(
          (u) => u.id === getSharedLocalUserId()
        );

        if (sharedUserById) {
          console.log(
            '🔧 [AUTH SERVICE] Found shared user by ID, trying alternative sign-in...'
          );
          const altSignInResult =
            await this.localAuthService.signInWithoutPassword(
              sharedUserById.id,
              true
            );

          if (altSignInResult.error) {
            throw new Error(
              `Failed to sign in as shared user: ${altSignInResult.error}`
            );
          }
        } else {
          throw new Error(
            `Failed to sign in as shared user: ${signInResult.error}`
          );
        }
      }

      console.log('🔧 [AUTH SERVICE] Successfully signed in as shared user');
    } catch (error) {
      console.error(
        '🔧 [AUTH SERVICE] Failed to ensure shared local user:',
        error
      );
      throw error; // Re-throw so caller can handle fallback
    }
  }

  private async handleRemoteUserSignIn(
    remoteUser: RemoteUser,
    session: unknown
  ) {
    const personalLocalUserId = getPersonalLocalUserId(remoteUser.id);

    // Track this remote user for connectivity loss scenarios
    this.lastRemoteUser = remoteUser;

    try {
      // Check if personal local user already exists and create/update if needed
      const localUsers = await this.localAuthService.getLocalUsers();
      let personalLocalUser = localUsers.find(
        (u) => u.id === personalLocalUserId
      );

      // Get avatar URL and convert to base64 if available
      const avatarUrl =
        remoteUser.user_metadata?.avatar_url ||
        remoteUser.user_metadata?.picture ||
        remoteUser.identities?.[0]?.identity_data?.picture;

      let base64Avatar: string | undefined;
      if (avatarUrl) {
        base64Avatar = await this.downloadAndConvertToBase64(avatarUrl);
      }

      if (!personalLocalUser) {
        // Create personal local user based on remote user for future offline use
        const result =
          await this.localAuthService.createOfflineAccountForOnlineUser({
            id: personalLocalUserId,
            email: remoteUser.email || '',
            name:
              remoteUser.user_metadata?.full_name ||
              remoteUser.user_metadata?.name ||
              remoteUser.user_metadata?.display_name ||
              'Local User',
            avatar_url: base64Avatar,
          });

        if (result.user) {
          personalLocalUser = result.user;
        }
      } else if (
        base64Avatar &&
        personalLocalUser.avatar_url !== base64Avatar
      ) {
        // Update existing user with new avatar if it's different
        await this.localAuthService.updateProfile({
          avatar_url: base64Avatar,
        });
        personalLocalUser.avatar_url = base64Avatar;
      }

      // Create remote user object for current session
      const remoteAuthUser: AuthUser = {
        id: remoteUser.id,
        email: remoteUser.email || '',
        name:
          remoteUser.user_metadata?.full_name ||
          remoteUser.user_metadata?.name ||
          remoteUser.user_metadata?.display_name ||
          'Remote User',
        avatar_url: base64Avatar,
        created_at: remoteUser.created_at,
        type: 'remote',
        isShared: false,
      };

      // Update state to reflect successful remote authentication
      this.updateState({
        user: remoteAuthUser,
        session: session, // Keep the remote session
        loading: false,
        error: null,
        isRemoteAuthenticated: true, // Successfully authenticated remotely
      });

      console.log(
        '🔧 [AUTH SERVICE] Successfully signed in with remote user:',
        remoteUser.email
      );
      return;
    } catch (error) {
      console.error('Failed to handle remote user sign in:', error);
      this.updateState({
        loading: false,
        error: 'Failed to process remote user account',
      });
    }
  }

  private async downloadAndConvertToBase64(
    imageUrl: string
  ): Promise<string | undefined> {
    try {
      console.log('🔧 [AUTH SERVICE] Downloading avatar from:', imageUrl);

      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.warn(
          'Failed to download avatar:',
          response.status,
          response.statusText
        );
        return undefined;
      }

      const blob = await response.blob();

      // Convert blob to base64 data URI
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          console.log(
            '🔧 [AUTH SERVICE] Avatar converted to base64, size:',
            result.length
          );
          resolve(result);
        };
        reader.onerror = () => {
          console.error('Failed to convert avatar to base64');
          reject(reader.error);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error downloading and converting avatar:', error);
      return undefined;
    }
  }

  private async handleRemoteUserSignOut() {
    // Check if we have a last known remote user and if this might be a connectivity loss
    if (this.lastRemoteUser && this.supabaseAvailable) {
      try {
        // Try to determine if this is connectivity loss vs explicit sign-out
        // If we can't reach Supabase, assume connectivity loss
        const supabase = getSupabaseClient();
        const { error } = await supabase.auth.getSession();

        if (
          error &&
          (error.message.includes('network') || error.message.includes('fetch'))
        ) {
          // This looks like a connectivity issue, switch to personal local account
          await this.switchToPersonalLocalAccount();
          return;
        }
      } catch (networkError) {
        // Network error confirmed, switch to personal local account
        console.log(
          '🔧 [AUTH SERVICE] Network error detected, switching to personal local account:',
          networkError
        );
        await this.switchToPersonalLocalAccount();
        return;
      }
    }

    // This is an explicit sign-out or we have no previous remote user
    // Clear the last remote user and return to shared account
    this.lastRemoteUser = null;
    await this.switchToSharedLocalAccount();
  }

  private async switchToPersonalLocalAccount() {
    if (!this.lastRemoteUser) return;

    try {
      const personalLocalUserId = getPersonalLocalUserId(
        this.lastRemoteUser.id
      );
      const localUsers = await this.localAuthService.getLocalUsers();
      const personalLocalUser = localUsers.find(
        (u) => u.id === personalLocalUserId
      );

      if (personalLocalUser) {
        // Sign in as the personal local user
        await this.localAuthService.signInWithoutPassword(
          personalLocalUser.email,
          true // bypass passcode for automatic transition due to connectivity loss
        );

        this.updateState({
          user: convertLocalUser(personalLocalUser),
          session: null, // No remote session due to connectivity loss
          loading: false,
          error: null,
          isRemoteAuthenticated: false, // Lost remote connection
        });

        console.log(
          '🔧 [AUTH SERVICE] Switched to personal local account due to connectivity loss'
        );
        return;
      }
    } catch (error) {
      console.error('Failed to switch to personal local account:', error);
    }

    // If we can't find/access the personal local account, fall back to shared
    await this.switchToSharedLocalAccount();
  }

  private async switchToSharedLocalAccount() {
    console.log(
      '🔧 [AUTH SERVICE] Starting transition to shared local account...'
    );

    try {
      // First, update state to indicate we're transitioning (not remotely authenticated)
      this.updateState({
        loading: true,
        isRemoteAuthenticated: false,
        session: null,
        error: null,
      });

      // Sign out from current local auth session
      await this.localAuthService.signOut();
      console.log('🔧 [AUTH SERVICE] Signed out from local auth service');

      // Ensure shared local user exists
      await this.ensureSharedLocalUser();
      console.log('🔧 [AUTH SERVICE] Ensured shared local user exists');

      // Wait a moment for the local auth service to complete the sign-in
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get the current local auth state to ensure we have the shared user
      const localState = this.localAuthService.getState();
      if (localState.user && localState.user.email === 'shared@local.device') {
        console.log('🔧 [AUTH SERVICE] Successfully signed in as shared user');

        // Update state with the shared user
        this.updateState({
          user: convertLocalUser(localState.user, true), // Mark as shared
          session: null,
          loading: false,
          error: null,
          isRemoteAuthenticated: false,
        });
      } else {
        // Fallback to creating the shared user in memory
        console.log('🔧 [AUTH SERVICE] Fallback to in-memory shared user');
        this.updateState({
          user: createSharedLocalUser(),
          session: null,
          loading: false,
          error: null,
          isRemoteAuthenticated: false,
        });
      }

      console.log(
        '🔧 [AUTH SERVICE] Successfully switched to shared local account'
      );
    } catch (error) {
      console.error(
        '🔧 [AUTH SERVICE] Error switching to shared local account:',
        error
      );

      // Fallback: ensure we at least have a shared user in memory
      this.updateState({
        user: createSharedLocalUser(),
        session: null,
        loading: false,
        error: `Failed to switch to shared account: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        isRemoteAuthenticated: false,
      });
    }
  }

  private updateState(newState: Partial<AuthState>) {
    this.currentState = { ...this.currentState, ...newState };
    this.listeners.forEach((listener) => listener(this.currentState));
  }

  // Wait for auth initialization to complete
  async waitForInitialization(): Promise<void> {
    await this.initializationPromise;
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);

    // If already initialized, call listener immediately
    if (!this.currentState.loading) {
      listener(this.currentState);
    } else {
      // Wait for initialization, then call listener
      this.initializationPromise.then(() => {
        listener(this.currentState);
      });
    }

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  getState(): AuthState {
    return this.currentState;
  }

  // Get the current local user (always available)
  getCurrentUser(): AuthUser {
    return this.currentState.user;
  }

  // Check if user is remotely authenticated
  isRemotelyAuthenticated(): boolean {
    return this.currentState.isRemoteAuthenticated;
  }

  // Check if using shared local account
  isUsingSharedAccount(): boolean {
    return this.currentState.user.isShared === true;
  }

  // Check if user has a personal local account available (from previous Google sign-in)
  async hasPersonalLocalAccount(): Promise<boolean> {
    if (!this.lastRemoteUser) return false;

    try {
      const personalLocalUserId = getPersonalLocalUserId(
        this.lastRemoteUser.id
      );
      const localUsers = await this.localAuthService.getLocalUsers();
      return localUsers.some((u) => u.id === personalLocalUserId);
    } catch {
      return false;
    }
  }

  // Check if sign-in buttons should be shown
  // Returns true when user is on shared account OR not remotely authenticated
  shouldShowSignInOptions(): boolean {
    return this.isUsingSharedAccount() || !this.isRemotelyAuthenticated();
  }

  // Get access to local auth service for local operations
  getLocalAuthService(): LocalAuthService {
    return this.localAuthService;
  }

  // Google popup authentication (only supported remote auth method)
  async signInWithGooglePopup(): Promise<{ error?: unknown }> {
    if (!this.supabaseAvailable) {
      return { error: 'Remote authentication not available' };
    }

    try {
      console.log('🔧 [AUTH SERVICE] Starting Google popup OAuth request');
      const baseUrl = getBaseUrl();
      const redirectTo = `${baseUrl}/auth/callback`;
      console.log('🔧 [AUTH SERVICE] Base URL:', baseUrl);
      console.log('🔧 [AUTH SERVICE] Redirect URL:', redirectTo);

      const supabase = getSupabaseClient();
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error('🔧 [AUTH SERVICE] OAuth request error:', error);
        return { error: error.message };
      }

      if (data.url) {
        console.log('�� [AUTH SERVICE] Got OAuth URL:', data.url);
        console.log('🔧 [AUTH SERVICE] Opening popup window...');

        // Open popup window for Google OAuth
        const popup = window.open(
          data.url,
          'google-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          console.error('🔧 [AUTH SERVICE] Failed to open popup window');
          return {
            error:
              'Failed to open popup window. Please allow popups for this site.',
          };
        }

        console.log(
          '🔧 [AUTH SERVICE] Popup opened successfully, starting polling...'
        );

        // Listen for auth completion
        return new Promise((resolve) => {
          const checkClosed = setInterval(() => {
            if (popup.closed) {
              console.log(
                '🔧 [AUTH SERVICE] Popup closed, checking session...'
              );
              clearInterval(checkClosed);
              // Check if auth was successful by checking current session
              setTimeout(async () => {
                const { data: sessionData, error: sessionError } =
                  await supabase.auth.getSession();
                console.log('🔧 [AUTH SERVICE] Session check result:', {
                  sessionData: !!sessionData?.session,
                  sessionError,
                });
                if (sessionData?.session && !sessionError) {
                  console.log('🔧 [AUTH SERVICE] Authentication successful!');
                  resolve({});
                } else {
                  console.error(
                    '🔧 [AUTH SERVICE] Authentication failed or cancelled'
                  );
                  resolve({ error: 'Authentication was cancelled or failed' });
                }
              }, 500);
            }
          }, 500);

          // Timeout after 5 minutes
          setTimeout(() => {
            if (!popup.closed) {
              console.error(
                '🔧 [AUTH SERVICE] Authentication timed out, closing popup'
              );
              popup.close();
              clearInterval(checkClosed);
              resolve({ error: 'Authentication timed out' });
            }
          }, 300000);
        });
      }

      console.log('🔧 [AUTH SERVICE] No URL in OAuth response');
      return {};
    } catch (error) {
      console.error(
        '🔧 [AUTH SERVICE] Exception in signInWithGooglePopup:',
        error
      );
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async signOut(): Promise<{ error?: unknown }> {
    if (!this.supabaseAvailable || !this.currentState.isRemoteAuthenticated) {
      // If not remotely authenticated, there's nothing to sign out from
      return {};
    }

    try {
      // Clear the last remote user first to ensure explicit sign-out behavior
      this.lastRemoteUser = null;

      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error: error.message };
      }

      // The auth state change listener will handle transitioning back to shared local user
      return {};
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  destroy() {
    this.listeners = [];
    this.localAuthService.destroy();
  }

  // Email/password authentication methods
  async signUpWithEmail(
    email: string,
    password: string,
    metadata?: { name?: string }
  ): Promise<{ error?: unknown }> {
    if (!this.supabaseAvailable) {
      return { error: 'Remote authentication not available' };
    }

    try {
      console.log('🔧 [AUTH SERVICE] Starting email signup for:', email);
      const supabase = getSupabaseClient();

      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
            ? {
                name: metadata.name,
                full_name: metadata.name,
              }
            : undefined,
        },
      });

      if (error) {
        console.error('🔧 [AUTH SERVICE] Email signup error:', error);
        return { error: error.message };
      }

      if (data.user && !data.user.email_confirmed_at) {
        console.log('🔧 [AUTH SERVICE] Email confirmation required');
        return {
          error:
            'Please check your email and click the confirmation link to complete signup.',
        };
      }

      console.log('🔧 [AUTH SERVICE] Email signup successful!');
      return {};
    } catch (error) {
      console.error('🔧 [AUTH SERVICE] Exception in signUpWithEmail:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async signInWithEmail(
    email: string,
    password: string
  ): Promise<{ error?: unknown }> {
    if (!this.supabaseAvailable) {
      return { error: 'Remote authentication not available' };
    }

    try {
      console.log('🔧 [AUTH SERVICE] Starting email signin for:', email);
      const supabase = getSupabaseClient();

      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('🔧 [AUTH SERVICE] Email signin error:', error);
        return { error: error.message };
      }

      if (data.user) {
        console.log('🔧 [AUTH SERVICE] Email signin successful!');
        // The auth state change listener will handle the user sign-in
        return {};
      }

      return { error: 'No user returned from signin' };
    } catch (error) {
      console.error('🔧 [AUTH SERVICE] Exception in signInWithEmail:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const authService = new AuthService();

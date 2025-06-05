import { supabase } from './supabase-client.js';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface AuthState {
  user: AuthUser | null;
  session: unknown | null;
  loading: boolean;
  error: string | null;
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
      : 'http://localhost:3000') + envBaseUrl;

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
    user: null,
    session: null,
    loading: true,
    error: null,
  };

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // Get initial session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        this.updateState({
          user: null,
          session: null,
          loading: false,
          error: error.message,
        });
        return;
      }

      this.updateState({
        user: session?.user ? this.transformUser(session.user) : null,
        session,
        loading: false,
        error: null,
      });

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event: unknown, session: unknown) => {
        this.updateState({
          user:
            session &&
            typeof session === 'object' &&
            'user' in session &&
            session?.user
              ? this.transformUser(session.user)
              : null,
          session,
          loading: false,
          error: null,
        });
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.updateState({
        user: null,
        session: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private transformUser(user: any): AuthUser {
    const avatarUrl =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      user.identities?.[0]?.identity_data?.picture;

    // If we have a Google avatar, consider caching it
    if (avatarUrl && avatarUrl.includes('googleusercontent.com')) {
      this.cacheUserAvatar(user.id, avatarUrl).catch(console.error);
    }

    return {
      id: user.id,
      email: user.email || '',
      name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.user_metadata?.display_name,
      avatar_url: avatarUrl,
      created_at: user.created_at,
    };
  }

  private async cacheUserAvatar(
    userId: string,
    avatarUrl: string
  ): Promise<string | null> {
    try {
      // Check if we already have a cached version
      const { data: existingFile } = await supabase.storage
        .from('avatars')
        .list('', {
          search: `${userId}`,
        });

      if (existingFile && existingFile.length > 0) {
        // Return the cached URL
        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(`${userId}.jpg`);
        return data.publicUrl;
      }

      // Download the image
      const response = await fetch(avatarUrl);
      if (!response.ok) return null;

      const blob = await response.blob();

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(`${userId}.jpg`, blob, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('Error uploading avatar:', error);
        return null;
      }

      // Get the public URL
      const { data: publicUrl } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      return publicUrl.publicUrl;
    } catch (error) {
      console.error('Error caching avatar:', error);
      return null;
    }
  }

  private updateState(newState: Partial<AuthState>) {
    this.currentState = { ...this.currentState, ...newState };
    this.listeners.forEach((listener) => listener(this.currentState));
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentState);

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

  async signInWithPassword(
    email: string,
    password: string
  ): Promise<{ error?: unknown }> {
    this.updateState({ loading: true, error: null });

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      this.updateState({ loading: false, error: error.message });
      return { error };
    }

    return {};
  }

  async signUp(
    email: string,
    password: string,
    metadata?: { name?: string }
  ): Promise<{ error?: unknown }> {
    this.updateState({ loading: true, error: null });

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      this.updateState({ loading: false, error: error.message });
      return { error };
    }

    return {};
  }

  async signInWithGoogle(): Promise<{ error?: unknown }> {
    this.updateState({ loading: true, error: null });

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${getBaseUrl()}/auth/callback`,
      },
    });

    if (error) {
      this.updateState({ loading: false, error: error.message });
      return { error };
    }

    return {};
  }

  async signInWithGooglePopup(): Promise<{ error?: unknown }> {
    this.updateState({ loading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${getBaseUrl()}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        this.updateState({ loading: false, error: error.message });
        return { error };
      }

      if (data?.url) {
        // Open popup window
        const popup = window.open(
          data.url,
          'google-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          this.updateState({
            loading: false,
            error: 'Popup was blocked. Please enable popups for this site.',
          });
          return { error: 'Popup blocked' };
        }

        // Listen for auth completion with timeout
        return new Promise((resolve) => {
          let resolved = false;

          // Set a timeout to avoid waiting indefinitely
          const timeout = setTimeout(() => {
            if (!resolved) {
              resolved = true;
              subscription?.unsubscribe();
              try {
                popup.close();
              } catch {
                // Ignore COOP errors when closing popup
              }
              this.updateState({
                loading: false,
                error: 'Authentication timed out. Please try again.',
              });
              resolve({ error: 'Authentication timeout' });
            }
          }, 60000); // 60 second timeout

          // Handle auth state change
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange((event, session) => {
            if (
              (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') &&
              session &&
              !resolved
            ) {
              resolved = true;
              clearTimeout(timeout);
              subscription.unsubscribe();

              try {
                popup.close();
              } catch {
                // Ignore COOP errors when closing popup
              }

              this.updateState({ loading: false });
              resolve({});
            }
          });

          // Check if popup was closed manually (with error handling for COOP)
          const checkClosed = setInterval(() => {
            try {
              if (popup.closed && !resolved) {
                resolved = true;
                clearTimeout(timeout);
                clearInterval(checkClosed);
                subscription.unsubscribe();

                // Check if we have a session after popup closes
                supabase.auth.getSession().then(({ data: { session } }) => {
                  if (session) {
                    this.updateState({ loading: false });
                    resolve({});
                  } else {
                    this.updateState({
                      loading: false,
                      error: 'Authentication was cancelled or failed',
                    });
                    resolve({ error: 'Authentication cancelled' });
                  }
                });
              }
            } catch {
              // COOP error - can't access popup.closed
              // This is normal and we'll rely on the auth state change or timeout
            }
          }, 1000);
        });
      }

      this.updateState({ loading: false, error: 'No auth URL received' });
      return { error: 'No auth URL received' };
    } catch (error) {
      this.updateState({
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return { error };
    }
  }

  async signOut(): Promise<{ error?: unknown }> {
    this.updateState({ loading: true, error: null });

    const { error } = await supabase.auth.signOut();

    if (error) {
      this.updateState({ loading: false, error: error.message });
      return { error };
    }

    return {};
  }

  async resetPassword(email: string): Promise<{ error?: unknown }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getBaseUrl()}/auth/reset-password`,
    });

    return { error };
  }

  async updatePassword(password: string): Promise<{ error?: unknown }> {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  }

  async deleteAccount(): Promise<{ error?: unknown }> {
    this.updateState({ loading: true, error: null });

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        this.updateState({ loading: false, error: 'No user found' });
        return { error: 'No user found' };
      }

      // Delete user's cached avatar from storage if it exists
      try {
        await supabase.storage.from('avatars').remove([`${user.id}.jpg`]);
      } catch (error) {
        // Ignore storage errors - avatar might not exist
        console.warn('Could not delete avatar:', error);
      }

      // Note: We would delete user data from other tables here
      // For now, we'll just delete the auth user
      // In a real app, you'd want to delete all associated data:
      // - User preferences
      // - Trip data
      // - Any other user-related records

      // Delete the auth user (this also signs them out)
      const { error } = await supabase.auth.admin.deleteUser(user.id);

      if (error) {
        this.updateState({ loading: false, error: error.message });
        return { error };
      }

      // Clear local state
      this.updateState({
        user: null,
        session: null,
        loading: false,
        error: null,
      });

      return {};
    } catch (error) {
      this.updateState({
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return { error };
    }
  }
}

export const authService = new AuthService();

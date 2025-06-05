import { getSupabaseClient, isSupabaseAvailable } from './supabase-client.js';

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
  private supabaseAvailable: boolean;

  constructor() {
    this.supabaseAvailable = isSupabaseAvailable();
    this.initializeAuth();
  }

  private async initializeAuth() {
    if (!this.supabaseAvailable) {
      // If Supabase is not available, set auth state to not loading and no user
      this.updateState({
        user: null,
        session: null,
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
    if (!this.supabaseAvailable) {
      return null;
    }

    try {
      const supabase = getSupabaseClient();

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
    if (!this.supabaseAvailable) {
      return { error: 'Supabase not available' };
    }

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async signUp(
    email: string,
    password: string,
    metadata?: { name?: string }
  ): Promise<{ error?: unknown }> {
    if (!this.supabaseAvailable) {
      return { error: 'Supabase not available' };
    }

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {},
        },
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async signInWithGoogle(): Promise<{ error?: unknown }> {
    if (!this.supabaseAvailable) {
      return { error: 'Supabase not available' };
    }

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${getBaseUrl()}/auth/callback`,
        },
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async signInWithGooglePopup(): Promise<{ error?: unknown }> {
    if (!this.supabaseAvailable) {
      return { error: 'Supabase not available' };
    }

    try {
      const supabase = getSupabaseClient();
      const { error, data } = await supabase.auth.signInWithOAuth({
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
        return { error: error.message };
      }

      if (data.url) {
        // Open popup window for Google OAuth
        const popup = window.open(
          data.url,
          'google-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          return {
            error:
              'Failed to open popup window. Please allow popups for this site.',
          };
        }

        // Listen for auth completion
        return new Promise((resolve) => {
          const checkClosed = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkClosed);
              // Check if auth was successful by checking current session
              setTimeout(async () => {
                const { data: sessionData, error: sessionError } =
                  await supabase.auth.getSession();
                if (sessionData?.session && !sessionError) {
                  resolve({});
                } else {
                  resolve({ error: 'Authentication was cancelled or failed' });
                }
              }, 1000);
            }
          }, 1000);

          // Timeout after 5 minutes
          setTimeout(() => {
            if (!popup.closed) {
              popup.close();
              clearInterval(checkClosed);
              resolve({ error: 'Authentication timed out' });
            }
          }, 300000);
        });
      }

      return {};
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async signOut(): Promise<{ error?: unknown }> {
    if (!this.supabaseAvailable) {
      // For offline mode, just clear the state
      this.updateState({
        user: null,
        session: null,
        loading: false,
        error: null,
      });
      return {};
    }

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async resetPassword(email: string): Promise<{ error?: unknown }> {
    if (!this.supabaseAvailable) {
      return { error: 'Supabase not available' };
    }

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return error ? { error: error.message } : {};
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async updatePassword(password: string): Promise<{ error?: unknown }> {
    if (!this.supabaseAvailable) {
      return { error: 'Supabase not available' };
    }

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password });
      return error ? { error: error.message } : {};
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async deleteAccount(): Promise<{ error?: unknown }> {
    if (!this.supabaseAvailable) {
      return { error: 'Supabase not available' };
    }

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.rpc('delete_user');
      return error ? { error: error.message } : {};
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  destroy() {
    this.listeners = [];
  }
}

export const authService = new AuthService();

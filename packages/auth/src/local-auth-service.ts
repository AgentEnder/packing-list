export interface LocalAuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  password_hash: string;
}

export interface LocalAuthState {
  user: LocalAuthUser | null;
  session: { user: LocalAuthUser; expires_at: string } | null;
  loading: boolean;
  error: string | null;
}

const LOCAL_USERS_KEY = 'packing_list_local_users';
const LOCAL_SESSION_KEY = 'packing_list_local_session';
const LOCAL_PASSCODE_KEY = 'packing_list_local_passcode';

export class LocalAuthService {
  private listeners: Array<(state: LocalAuthState) => void> = [];
  private currentState: LocalAuthState = {
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
      // Check for existing session
      const session = this.getStoredSession();

      if (session && new Date(session.expires_at) > new Date()) {
        this.updateState({
          user: session.user,
          session,
          loading: false,
          error: null,
        });
      } else {
        // Clear expired session
        this.clearSession();
        this.updateState({
          user: null,
          session: null,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Local auth initialization error:', error);
      this.updateState({
        user: null,
        session: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private getStoredUsers(): LocalAuthUser[] {
    if (typeof window === 'undefined') return [];
    try {
      const users = localStorage.getItem(LOCAL_USERS_KEY);
      return users ? JSON.parse(users) : [];
    } catch {
      return [];
    }
  }

  private saveUsers(users: LocalAuthUser[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  }

  private getStoredSession(): {
    user: LocalAuthUser;
    expires_at: string;
  } | null {
    if (typeof window === 'undefined') return null;
    try {
      const session = localStorage.getItem(LOCAL_SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch {
      return null;
    }
  }

  private saveSession(session: { user: LocalAuthUser; expires_at: string }) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
  }

  private clearSession() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(LOCAL_SESSION_KEY);
  }

  private generateId(): string {
    return (
      'local_' +
      Math.random().toString(36).substr(2, 9) +
      Date.now().toString(36)
    );
  }

  private async hashPassword(password: string): Promise<string> {
    // Simple hash for offline use - in production you'd want something more secure
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'packing_list_salt');
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }

  private createSession(user: LocalAuthUser) {
    const session = {
      user,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };
    this.saveSession(session);
    return session;
  }

  private updateState(newState: Partial<LocalAuthState>) {
    this.currentState = { ...this.currentState, ...newState };
    this.listeners.forEach((listener) => listener(this.currentState));
  }

  subscribe(listener: (state: LocalAuthState) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentState);

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  getState(): LocalAuthState {
    return this.currentState;
  }

  async signUp(
    email: string,
    password: string,
    metadata?: { name?: string }
  ): Promise<{ user?: LocalAuthUser; error?: string }> {
    try {
      // Check if user already exists
      const users = this.getStoredUsers();
      const existingUser = users.find((u) => u.email === email);

      if (existingUser) {
        const error = 'A user with this email already exists';
        this.updateState({ error });
        return { error };
      }

      // Create new user
      const passwordHash = await this.hashPassword(password);
      const user: LocalAuthUser = {
        id: this.generateId(),
        email,
        name: metadata?.name,
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
      };

      // Save user
      users.push(user);
      this.saveUsers(users);

      // Create session
      const session = this.createSession(user);

      this.updateState({
        user,
        session,
        loading: false,
        error: null,
      });

      return { user };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Sign up failed';
      this.updateState({ error: errorMessage });
      return { error: errorMessage };
    }
  }

  async signIn(
    email: string,
    password: string
  ): Promise<{ user?: LocalAuthUser; error?: string }> {
    try {
      const users = this.getStoredUsers();
      const user = users.find((u) => u.email === email);

      if (!user) {
        const error = 'No account found with this email';
        this.updateState({ error });
        return { error };
      }

      const isValidPassword = await this.verifyPassword(
        password,
        user.password_hash
      );
      if (!isValidPassword) {
        const error = 'Invalid password';
        this.updateState({ error });
        return { error };
      }

      // Create session
      const session = this.createSession(user);

      this.updateState({
        user,
        session,
        loading: false,
        error: null,
      });

      return { user };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Sign in failed';
      this.updateState({ error: errorMessage });
      return { error: errorMessage };
    }
  }

  async signOut(): Promise<{ error?: string }> {
    try {
      this.clearSession();
      this.updateState({
        user: null,
        session: null,
        loading: false,
        error: null,
      });
      return {};
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Sign out failed';
      this.updateState({ error: errorMessage });
      return { error: errorMessage };
    }
  }

  async updatePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ error?: string }> {
    try {
      const { user } = this.currentState;
      if (!user) {
        const error = 'No user signed in';
        this.updateState({ error });
        return { error };
      }

      // Verify current password
      const isValidPassword = await this.verifyPassword(
        currentPassword,
        user.password_hash
      );
      if (!isValidPassword) {
        const error = 'Current password is incorrect';
        this.updateState({ error });
        return { error };
      }

      // Update password
      const users = this.getStoredUsers();
      const userIndex = users.findIndex((u) => u.id === user.id);

      if (userIndex === -1) {
        const error = 'User not found';
        this.updateState({ error });
        return { error };
      }

      const newPasswordHash = await this.hashPassword(newPassword);
      users[userIndex].password_hash = newPasswordHash;
      this.saveUsers(users);

      // Update current user state
      const updatedUser = { ...user, password_hash: newPasswordHash };
      const session = this.createSession(updatedUser);

      this.updateState({
        user: updatedUser,
        session,
        error: null,
      });

      return {};
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Password update failed';
      this.updateState({ error: errorMessage });
      return { error: errorMessage };
    }
  }

  async deleteAccount(): Promise<{ error?: string }> {
    try {
      const { user } = this.currentState;
      if (!user) {
        const error = 'No user signed in';
        this.updateState({ error });
        return { error };
      }

      // Remove user from storage
      const users = this.getStoredUsers();
      const filteredUsers = users.filter((u) => u.id !== user.id);
      this.saveUsers(filteredUsers);

      // Clear session
      this.clearSession();

      this.updateState({
        user: null,
        session: null,
        loading: false,
        error: null,
      });

      return {};
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Account deletion failed';
      this.updateState({ error: errorMessage });
      return { error: errorMessage };
    }
  }

  async updateProfile(updates: {
    name?: string;
    avatar_url?: string;
  }): Promise<{ error?: string }> {
    try {
      const { user } = this.currentState;
      if (!user) {
        const error = 'No user signed in';
        this.updateState({ error });
        return { error };
      }

      // Update user in storage
      const users = this.getStoredUsers();
      const userIndex = users.findIndex((u) => u.id === user.id);

      if (userIndex === -1) {
        const error = 'User not found';
        this.updateState({ error });
        return { error };
      }

      const updatedUser = { ...user, ...updates };
      users[userIndex] = updatedUser;
      this.saveUsers(users);

      // Update session
      const session = this.createSession(updatedUser);

      this.updateState({
        user: updatedUser,
        session,
        error: null,
      });

      return {};
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Profile update failed';
      this.updateState({ error: errorMessage });
      return { error: errorMessage };
    }
  }

  // Get all local users (for admin purposes or account switching)
  getLocalUsers(): LocalAuthUser[] {
    return this.getStoredUsers();
  }

  // Passcode management methods
  async hasPasscode(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const passcode = localStorage.getItem(LOCAL_PASSCODE_KEY);
      return !!passcode;
    } catch {
      return false;
    }
  }

  async setPasscode(
    currentPassword: string | undefined,
    newPasscode: string
  ): Promise<{ error?: string }> {
    try {
      // If current user is signed in and has a password, verify it
      if (
        currentPassword &&
        this.currentState.user &&
        this.currentState.user.password_hash
      ) {
        const isValidPassword = await this.verifyPassword(
          currentPassword,
          this.currentState.user.password_hash
        );
        if (!isValidPassword) {
          return { error: 'Current password is incorrect' };
        }
      }

      // Hash and store the passcode
      const passcodeHash = await this.hashPassword(newPasscode);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_PASSCODE_KEY, passcodeHash);
      }

      return {};
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : 'Failed to set passcode',
      };
    }
  }

  async removePasscode(currentPasscode: string): Promise<{ error?: string }> {
    try {
      // Verify current passcode
      const storedPasscodeHash =
        typeof window !== 'undefined'
          ? localStorage.getItem(LOCAL_PASSCODE_KEY)
          : null;

      if (!storedPasscodeHash) {
        return { error: 'No passcode is set' };
      }

      const isValidPasscode = await this.verifyPassword(
        currentPasscode,
        storedPasscodeHash
      );
      if (!isValidPasscode) {
        return { error: 'Current passcode is incorrect' };
      }

      // Remove the passcode
      if (typeof window !== 'undefined') {
        localStorage.removeItem(LOCAL_PASSCODE_KEY);
      }

      return {};
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : 'Failed to remove passcode',
      };
    }
  }

  async signInWithoutPassword(
    email: string
  ): Promise<{ user?: LocalAuthUser; error?: string }> {
    try {
      // Check if passcode is set - if so, require it
      const hasPasscode = await this.hasPasscode();
      if (hasPasscode) {
        return { error: 'Passcode is required for this account' };
      }

      // Find the user
      const users = this.getStoredUsers();
      const user = users.find((u) => u.email === email);

      if (!user) {
        return { error: 'User not found' };
      }

      // Create session
      const session = this.createSession(user);

      this.updateState({
        user,
        session,
        loading: false,
        error: null,
      });

      return { user };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Sign in failed';
      this.updateState({ error: errorMessage });
      return { error: errorMessage };
    }
  }

  async createOfflineAccountForOnlineUser(onlineUser: {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
  }): Promise<{ user?: LocalAuthUser; error?: string }> {
    try {
      // Check if user already exists
      const users = this.getStoredUsers();
      const existingUser = users.find((u) => u.email === onlineUser.email);

      if (existingUser) {
        // User already exists, just return it
        return { user: existingUser };
      }

      // Create new offline user without password hash (will use passwordless access)
      const user: LocalAuthUser = {
        id: onlineUser.id,
        email: onlineUser.email,
        name: onlineUser.name,
        avatar_url: onlineUser.avatar_url,
        password_hash: '', // Empty password hash - indicates no password set
        created_at: new Date().toISOString(),
      };

      // Save user
      users.push(user);
      this.saveUsers(users);

      return { user };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create offline account',
      };
    }
  }

  destroy() {
    this.listeners = [];
  }
}

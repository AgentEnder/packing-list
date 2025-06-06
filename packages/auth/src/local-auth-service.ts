export interface LocalAuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  password_hash: string;
  passcode_hash?: string; // Per-account passcode
}

export interface LocalAuthState {
  user: LocalAuthUser | null;
  session: { user: LocalAuthUser; expires_at: string } | null;
  loading: boolean;
  error: string | null;
}

const DB_NAME = 'packing_list_offline_auth';
const DB_VERSION = 1;
const USERS_STORE = 'users';
const SESSION_STORE = 'session';

export class LocalAuthService {
  private listeners: Array<(state: LocalAuthState) => void> = [];
  private currentState: LocalAuthState = {
    user: null,
    session: null,
    loading: true,
    error: null,
  };
  private db: IDBDatabase | null = null;

  constructor() {
    this.initializeDB().then(() => this.initializeAuth());
  }

  private async initializeDB(): Promise<void> {
    if (typeof window === 'undefined') return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create users store
        if (!db.objectStoreNames.contains(USERS_STORE)) {
          const usersStore = db.createObjectStore(USERS_STORE, {
            keyPath: 'id',
          });
          usersStore.createIndex('email', 'email', { unique: true });
        }

        // Create session store
        if (!db.objectStoreNames.contains(SESSION_STORE)) {
          db.createObjectStore(SESSION_STORE, { keyPath: 'id' });
        }
      };
    });
  }

  private async initializeAuth() {
    try {
      // Check for existing session
      const session = await this.getStoredSession();

      if (session && new Date(session.expires_at) > new Date()) {
        this.updateState({
          user: session.user,
          session,
          loading: false,
          error: null,
        });
      } else {
        // Clear expired session
        await this.clearSession();
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

  private async getStoredUsers(): Promise<LocalAuthUser[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([USERS_STORE], 'readonly');
      const store = transaction.objectStore(USERS_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  private async saveUser(user: LocalAuthUser): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([USERS_STORE], 'readwrite');
      const store = transaction.objectStore(USERS_STORE);
      const request = store.put(user);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteUser(userId: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([USERS_STORE], 'readwrite');
      const store = transaction.objectStore(USERS_STORE);
      const request = store.delete(userId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getUserByEmail(email: string): Promise<LocalAuthUser | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([USERS_STORE], 'readonly');
      const store = transaction.objectStore(USERS_STORE);
      const index = store.index('email');
      const request = index.get(email);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async getStoredSession(): Promise<{
    user: LocalAuthUser;
    expires_at: string;
  } | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSION_STORE], 'readonly');
      const store = transaction.objectStore(SESSION_STORE);
      const request = store.get('current');

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async saveSession(session: {
    user: LocalAuthUser;
    expires_at: string;
  }): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSION_STORE], 'readwrite');
      const store = transaction.objectStore(SESSION_STORE);
      const request = store.put({ id: 'current', ...session });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async clearSession(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSION_STORE], 'readwrite');
      const store = transaction.objectStore(SESSION_STORE);
      const request = store.delete('current');

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
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

  private async createSession(user: LocalAuthUser) {
    const session = {
      user,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };
    await this.saveSession(session);
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
      const users = await this.getStoredUsers();
      const existingUser = await this.getUserByEmail(email);

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
      await this.saveUser(user);

      // Create session
      const session = await this.createSession(user);

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
      const users = await this.getStoredUsers();
      const user = await this.getUserByEmail(email);

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
      const session = await this.createSession(user);

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
      await this.clearSession();
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
      const users = await this.getStoredUsers();
      const userIndex = users.findIndex((u) => u.id === user.id);

      if (userIndex === -1) {
        const error = 'User not found';
        this.updateState({ error });
        return { error };
      }

      const newPasswordHash = await this.hashPassword(newPassword);
      users[userIndex].password_hash = newPasswordHash;
      await this.saveUser(users[userIndex]);

      // Update current user state
      const updatedUser = { ...user, password_hash: newPasswordHash };
      const session = await this.createSession(updatedUser);

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
      await this.deleteUser(user.id);

      // Clear session
      await this.clearSession();

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
      const users = await this.getStoredUsers();
      const userIndex = users.findIndex((u) => u.id === user.id);

      if (userIndex === -1) {
        const error = 'User not found';
        this.updateState({ error });
        return { error };
      }

      const updatedUser = { ...user, ...updates };
      await this.saveUser(updatedUser);

      // Update session
      const session = await this.createSession(updatedUser);

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
  async getLocalUsers(): Promise<LocalAuthUser[]> {
    return await this.getStoredUsers();
  }

  // Passcode management methods - now per-account
  async hasPasscode(userId?: string): Promise<boolean> {
    try {
      if (!userId && this.currentState.user) {
        userId = this.currentState.user.id;
      }

      if (!userId) return false;

      const users = await this.getStoredUsers();
      const user = users.find((u) => u.id === userId);
      return !!user?.passcode_hash;
    } catch {
      return false;
    }
  }

  async setPasscode(
    currentPassword: string | undefined,
    newPasscode: string,
    userId?: string
  ): Promise<{ error?: string }> {
    try {
      // Use current user if no userId specified
      if (!userId && this.currentState.user) {
        userId = this.currentState.user.id;
      }

      if (!userId) {
        return { error: 'No user specified for passcode' };
      }

      const users = await this.getStoredUsers();
      const user = users.find((u) => u.id === userId);

      if (!user) {
        return { error: 'User not found' };
      }

      // If current user has a password, verify it
      if (currentPassword && user.password_hash) {
        const isValidPassword = await this.verifyPassword(
          currentPassword,
          user.password_hash
        );
        if (!isValidPassword) {
          return { error: 'Current password is incorrect' };
        }
      }

      // Hash and store the passcode in the user record
      const passcodeHash = await this.hashPassword(newPasscode);
      const updatedUser = { ...user, passcode_hash: passcodeHash };
      await this.saveUser(updatedUser);

      // Update current state if this is the current user
      if (this.currentState.user?.id === userId) {
        this.updateState({
          user: updatedUser,
        });
      }

      return {};
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : 'Failed to set passcode',
      };
    }
  }

  async removePasscode(
    currentPasscode: string,
    userId?: string
  ): Promise<{ error?: string }> {
    try {
      // Use current user if no userId specified
      if (!userId && this.currentState.user) {
        userId = this.currentState.user.id;
      }

      if (!userId) {
        return { error: 'No user specified for passcode removal' };
      }

      const users = await this.getStoredUsers();
      const user = users.find((u) => u.id === userId);

      if (!user || !user.passcode_hash) {
        return { error: 'No passcode is set for this user' };
      }

      // Verify current passcode
      const isValidPasscode = await this.verifyPassword(
        currentPasscode,
        user.passcode_hash
      );
      if (!isValidPasscode) {
        return { error: 'Current passcode is incorrect' };
      }

      // Remove the passcode from the user record
      const updatedUser = { ...user };
      delete updatedUser.passcode_hash;
      await this.saveUser(updatedUser);

      // Update current state if this is the current user
      if (this.currentState.user?.id === userId) {
        this.updateState({
          user: updatedUser,
        });
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
    emailOrId: string,
    bypassPasscode = false
  ): Promise<{ user?: LocalAuthUser; error?: string }> {
    try {
      // Find the user by email or ID
      let user = await this.getUserByEmail(emailOrId);

      // If not found by email, try to find by ID
      if (!user) {
        const users = await this.getStoredUsers();
        user = users.find((u) => u.id === emailOrId) || null;
      }

      if (!user) {
        return { error: 'User not found' };
      }

      // Check if passcode is set for this specific user - if so, require it
      // UNLESS this is an automatic transition (bypassPasscode = true)
      if (user.passcode_hash && !bypassPasscode) {
        return { error: 'Passcode is required for this account' };
      }

      // Create session
      const session = await this.createSession(user);

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
      const existingUser = await this.getUserByEmail(onlineUser.email);

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
      await this.saveUser(user);

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
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export {
  authService,
  AuthService,
  type AuthUser,
  type AuthState,
} from './auth-service.js';
export { supabase } from './supabase-client.js';

// Local auth exports
export {
  LocalAuthService,
  type LocalAuthUser,
  type LocalAuthState,
} from './local-auth-service.js';

// Connectivity exports
export { ConnectivityService, type ConnectivityState } from './connectivity.js';

export {
  authService,
  AuthService,
  type AuthUser,
  type AuthState,
} from './auth-service.js';

// Local auth exports
export {
  LocalAuthService,
  type LocalAuthUser,
  type LocalAuthState,
} from './local-auth-service.js';

// Re-export connectivity for backward compatibility
export {
  ConnectivityService,
  type ConnectivityState,
  getConnectivityService,
} from '@packing-list/connectivity';

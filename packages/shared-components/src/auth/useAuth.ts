import { useState, useEffect } from 'react';
import { authService, type AuthState } from '@packing-list/auth';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState | null>();

  useEffect(() => {
    setAuthState(authService.getState());
    const unsubscribe = authService.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  return {
    ...authState,
    signIn: authService.signInWithPassword.bind(authService),
    signUp: authService.signUp.bind(authService),
    signInWithGoogle: authService.signInWithGoogle.bind(authService),
    signInWithGooglePopup: authService.signInWithGooglePopup.bind(authService),
    signOut: authService.signOut.bind(authService),
    resetPassword: authService.resetPassword.bind(authService),
    updatePassword: authService.updatePassword.bind(authService),
    deleteAccount: authService.deleteAccount.bind(authService),
  };
}

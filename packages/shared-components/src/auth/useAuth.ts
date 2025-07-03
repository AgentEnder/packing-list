import { useAuth as useReduxAuth, useAuthInitializer as useReduxAuthInitializer } from '@packing-list/auth-state';

export function useAuth() {
  return useReduxAuth();
}

export function useAuthInitializer() {
  return useReduxAuthInitializer();
}

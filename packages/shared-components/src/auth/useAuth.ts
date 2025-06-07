import { useAuth as useReduxAuth } from '@packing-list/auth-state';

export function useAuth() {
  return useReduxAuth();
}

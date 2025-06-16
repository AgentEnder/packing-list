import type { StoreType } from '../store.js';

export type HydrateOfflineAction = {
  type: 'HYDRATE_OFFLINE';
  payload: Omit<StoreType, 'auth' | 'rulePacks' | 'ui' | 'sync'>;
};

export const hydrateOfflineHandler = (
  state: StoreType,
  action: HydrateOfflineAction
): StoreType => {
  console.log('hydrateOfflineHandler', action.payload);
  return {
    ...state,
    ...action.payload,
  };
};

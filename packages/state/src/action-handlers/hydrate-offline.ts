import type { StoreType } from '../store.js';

export type HydrateOfflineAction = {
  type: 'HYDRATE_OFFLINE';
  payload: Omit<StoreType, 'auth'>;
};

export const hydrateOfflineHandler = (
  state: StoreType,
  action: HydrateOfflineAction
): StoreType => {
  return {
    ...state,
    ...action.payload,
  };
};

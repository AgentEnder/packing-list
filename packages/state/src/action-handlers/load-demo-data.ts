import { StoreType } from '../store.js';
import { CREATE_DEMO_DATA } from '../data.js';

export type LoadDemoDataAction = {
  type: 'LOAD_DEMO_DATA';
};

export const loadDemoDataHandler = (state: StoreType): StoreType => {
  // CREATE_DEMO_DATA now returns a complete StoreType, but we need to preserve auth state
  const demoData = CREATE_DEMO_DATA();

  return {
    ...demoData,
    auth: state.auth, // Preserve existing auth state
    userProfile: state.userProfile, // Preserve existing user profile state
  } as StoreType;
};

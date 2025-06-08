import { StoreType } from '../store.js';
import { CREATE_DEMO_DATA } from '../data.js';

export type LoadDemoDataAction = {
  type: 'LOAD_DEMO_DATA';
};

export const loadDemoDataHandler = (
  state: StoreType,
  action: LoadDemoDataAction
): StoreType => {
  // CREATE_DEMO_DATA now returns a complete StoreType, but we need to preserve auth state
  const demoData = CREATE_DEMO_DATA();

  return {
    ...demoData,
    auth: state.auth, // Preserve existing auth state
  } as StoreType;
};

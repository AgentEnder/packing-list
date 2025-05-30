import { StoreType } from '../store.js';
import { DEMO_DATA } from '../data.js';

export type LoadDemoDataAction = {
  type: 'LOAD_DEMO_DATA';
};

export const loadDemoDataHandler = (
  _state: StoreType,
  _action: LoadDemoDataAction
): StoreType => {
  return DEMO_DATA;
};

import { StoreType } from '../store.js';
import { CREATE_DEMO_DATA } from '../data.js';

export type LoadDemoDataAction = {
  type: 'LOAD_DEMO_DATA';
};

export const loadDemoDataHandler = (
  _state: StoreType,
  _action: LoadDemoDataAction
): StoreType => {
  return CREATE_DEMO_DATA();
};

// This file serves as a central hub for re-exporting pre-typed Redux hooks.
import {
  useDispatch,
  useSelector,
  useStore as useReduxStore,
} from 'react-redux';
import type { createStore } from './store.js';

type AppStore = ReturnType<typeof createStore>;
type AppDispatch = AppStore['dispatch'];
type RootState = ReturnType<AppStore['getState']>;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useReduxStore.withTypes<AppStore>();

export const useStore = () => {
  const store = useAppStore();
  const dispatch = useAppDispatch();
  return [store, dispatch] as const;
};

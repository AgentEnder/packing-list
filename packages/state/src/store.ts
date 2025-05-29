import { configureStore, Reducer, UnknownAction } from '@reduxjs/toolkit';
import { Mutations, AllActions, ActionHandler } from './actions.js';
import {
  Item,
  DefaultItemRule,
  Trip,
  Person,
  ItemOverride,
} from '@packing-list/model';
import { DEMO_DATA } from './data.js';

export type StoreType = {
  people: Person[];
  itemOverrides: ItemOverride[];
  defaultItemRules: DefaultItemRule[];
  trip: Trip;
  calculated: {
    defaultItems: Item[];
  };
};

export const initialState: StoreType = DEMO_DATA || {
  people: [],
  itemOverrides: [],
  defaultItemRules: [],
  trip: {
    days: [],
    tripEvents: [],
  },
  calculated: {
    defaultItems: [],
  },
};

const createReducer = <T extends keyof StoreType>(
  key: T,
  initialValue: StoreType[T]
): Reducer<StoreType[T]> => {
  return <T2 extends UnknownAction>(
    state = initialValue,
    action: T2
  ): StoreType[T] => {
    if (isStoreAction(action)) {
      const actionType = action.type;
      const mutation = Mutations[actionType] as ActionHandler<AllActions>;
      const fullState = { ...initialState, [key]: state };
      const result = mutation(fullState, action);
      return result[key] as StoreType[T];
    }
    return state;
  };
};

type PageContext = {
  isClient?: boolean;
  redux?: {
    ssrState?: StoreType;
  };
};

export function createStore(pageContext: PageContext) {
  const preloadedState =
    DEMO_DATA ||
    ('isClient' in pageContext && pageContext.isClient
      ? pageContext.redux?.ssrState ?? initialState
      : initialState);

  return configureStore({
    reducer: {
      defaultItemRules: createReducer(
        'defaultItemRules',
        preloadedState.defaultItemRules
      ),
      people: createReducer('people', preloadedState.people),
      itemOverrides: createReducer(
        'itemOverrides',
        preloadedState.itemOverrides
      ),
      trip: createReducer('trip', preloadedState.trip),
      calculated: createReducer('calculated', preloadedState.calculated),
    },
  });
}

function isStoreAction<T extends UnknownAction>(
  action: T
): action is Extract<AllActions, T> {
  return action.type in Mutations;
}

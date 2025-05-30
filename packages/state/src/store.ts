import { configureStore, Reducer, UnknownAction } from '@reduxjs/toolkit';
import { Mutations } from './actions.js';
import {
  Item,
  DefaultItemRule,
  Trip,
  Person,
  RuleOverride,
  PackingListViewState,
  PackingListItem,
} from '@packing-list/model';

export type StoreType = {
  people: Person[];
  defaultItemRules: DefaultItemRule[];
  trip: Trip;
  calculated: {
    defaultItems: Item[];
    packingListItems: PackingListItem[];
  };
  ruleOverrides: RuleOverride[];
  packingListView: PackingListViewState;
};

export const initialState: StoreType = {
  people: [],
  defaultItemRules: [],
  trip: {
    id: 'new-trip',
    days: [],
    tripEvents: [],
  },
  calculated: {
    defaultItems: [],
    packingListItems: [],
  },
  ruleOverrides: [],
  packingListView: {
    viewMode: 'by-person',
    filters: {
      packed: true,
      unpacked: true,
      excluded: false,
    },
  },
};

function createReducer<K extends keyof StoreType>(
  key: K,
  initialValue: StoreType[K]
): Reducer<StoreType[K]> {
  return (state = initialValue, action: UnknownAction) => {
    if ('type' in action && action.type in Mutations) {
      const mutation = Mutations[action.type as keyof typeof Mutations];
      const newState = mutation(
        { ...initialState, [key]: state } as StoreType,
        action as any
      );
      return newState[key];
    }
    return state;
  };
}

type PageContext = {
  isClient?: boolean;
  redux?: {
    ssrState?: StoreType;
  };
};

export function createStore(pageContext: PageContext) {
  const preloadedState =
    'isClient' in pageContext && pageContext.isClient
      ? pageContext.redux?.ssrState ?? initialState
      : initialState;

  return configureStore({
    reducer: {
      defaultItemRules: createReducer(
        'defaultItemRules',
        preloadedState.defaultItemRules
      ),
      people: createReducer('people', preloadedState.people),
      trip: createReducer('trip', preloadedState.trip),
      calculated: createReducer('calculated', preloadedState.calculated),
      ruleOverrides: createReducer(
        'ruleOverrides',
        preloadedState.ruleOverrides
      ),
      packingListView: createReducer(
        'packingListView',
        preloadedState.packingListView
      ),
    },
  });
}

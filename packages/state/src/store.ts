import {
  configureStore,
  Reducer,
  UnknownAction,
  Store,
} from '@reduxjs/toolkit';
import { Mutations } from './actions.js';
import {
  Item,
  DefaultItemRule,
  Trip,
  Person,
  RuleOverride,
  PackingListViewState,
  PackingListItem,
  RulePack,
} from '@packing-list/model';
import { DEFAULT_RULE_PACKS } from './default-rule-packs.js';

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
  rulePacks: RulePack[];
};

export const initialState: StoreType = {
  people: [],
  defaultItemRules: [],
  trip: {
    id: 'new-trip',
    days: [],
  },
  calculated: {
    defaultItems: [],
    packingListItems: [],
  },
  ruleOverrides: [],
  packingListView: {
    viewMode: 'by-day',
    filters: {
      packed: true,
      unpacked: true,
      excluded: false,
    },
  },
  rulePacks: DEFAULT_RULE_PACKS,
};

function createReducer(preloadedState: StoreType): Reducer<StoreType> {
  return (
    state: StoreType = preloadedState,
    action: UnknownAction
  ): StoreType => {
    if ('type' in action && action.type in Mutations) {
      const mutation = Mutations[action.type as keyof typeof Mutations];
      if (mutation) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return mutation(state, action as any);
      }
      console.warn(`Unknown action: ${action.type}`);
      return state;
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

export function createStore(pageContext: PageContext): Store<StoreType> {
  const preloadedState =
    'isClient' in pageContext && pageContext.isClient
      ? pageContext.redux?.ssrState ?? initialState
      : initialState;

  return configureStore({
    reducer: createReducer(preloadedState),
  });
}

import {
  configureStore,
  Reducer,
  UnknownAction,
  Store,
  combineReducers,
} from '@reduxjs/toolkit';
import { authReducer, type AuthState } from '@packing-list/auth-state';
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
  ui: {
    rulePackModal: {
      isOpen: boolean;
      activeTab: 'browse' | 'manage' | 'details';
      selectedPackId?: string;
    };
    loginModal: {
      isOpen: boolean;
    };
  };
  auth: AuthState;
};

export const initialState: Omit<StoreType, 'auth'> = {
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
  ui: {
    rulePackModal: {
      isOpen: false,
      activeTab: 'browse',
      selectedPackId: undefined,
    },
    loginModal: {
      isOpen: false,
    },
  },
};

function createAppReducer(): Reducer<Omit<StoreType, 'auth'>> {
  return (
    state: Omit<StoreType, 'auth'> = initialState,
    action: UnknownAction
  ): Omit<StoreType, 'auth'> => {
    if ('type' in action && action.type in Mutations) {
      const mutation = Mutations[action.type as keyof typeof Mutations];
      if (mutation) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fullState = { ...state, auth: undefined } as any;
        const result = mutation(fullState, action as any);
        // Remove auth from result and return
        const { auth, ...appResult } = result;
        return appResult;
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
  const appReducer = createAppReducer();

  const rootReducer = (
    state: StoreType | undefined,
    action: UnknownAction
  ): StoreType => {
    const { auth, ...appState } = state || { auth: undefined, ...initialState };

    return {
      ...appReducer(appState, action),
      auth: authReducer(auth, action),
    };
  };

  const preloadedState = pageContext.redux?.ssrState;

  return configureStore({
    reducer: rootReducer,
    preloadedState,
  });
}

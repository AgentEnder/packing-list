import {
  configureStore,
  Reducer,
  UnknownAction,
  Store,
} from '@reduxjs/toolkit';
import { authReducer, type AuthState } from '@packing-list/auth-state';
import { Mutations, type StoreActions } from './actions.js';
import {
  Item,
  DefaultItemRule,
  LegacyTrip as Trip,
  LegacyPerson as Person,
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
    if (
      'type' in action &&
      typeof action.type === 'string' &&
      action.type in Mutations
    ) {
      const actionType = action.type as StoreActions;
      const mutation = Mutations[actionType];
      if (mutation) {
        // Reconstruct full state for mutation handler with proper default auth state
        const defaultAuthState: AuthState = {
          user: null,
          session: null,
          loading: false,
          error: null,
          lastError: null,
          isAuthenticating: false,
          isInitialized: false,
          isOfflineMode: false,
          forceOfflineMode: false,
          connectivityState: { isOnline: true, isConnected: true },
          offlineAccounts: [],
          hasOfflinePasscode: false,
        };

        const fullState: StoreType = {
          ...state,
          auth: defaultAuthState,
        };

        // Type assertion is necessary due to TypeScript's limitation with mapped union types
        // Runtime safety is guaranteed by the check that action.type exists in Mutations
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = mutation(fullState, action as any);

        // Remove auth from result and return
        const { auth, ...appResult } = result;
        void auth; // Explicitly void unused variable
        return appResult;
      }
    }

    if ('type' in action && typeof action.type === 'string') {
      console.warn(`Unknown action: ${action.type}`);
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

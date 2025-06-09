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
  TripSummary,
} from '@packing-list/model';
import { DEFAULT_RULE_PACKS } from './default-rule-packs.js';

// New multi-trip store structure
export type StoreType = {
  // Multi-trip state
  trips: {
    summaries: TripSummary[]; // List of all user's trips
    selectedTripId: string | null; // Currently selected trip ID
    byId: Record<string, TripData>; // Full trip data by ID
  };

  // Global state (not trip-specific)
  rulePacks: RulePack[];

  // UI state
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

  // Auth state
  auth: AuthState;
};

// Trip-specific data structure
export type TripData = {
  // Trip info
  trip: Trip;
  people: Person[];
  defaultItemRules: DefaultItemRule[]; // Moved from global to trip-specific
  ruleOverrides: RuleOverride[];
  packingListView: PackingListViewState;

  // Calculated data
  calculated: {
    defaultItems: Item[];
    packingListItems: PackingListItem[];
  };

  // Loading states
  isLoading: boolean;
  lastSynced?: string;
};

// Helper function to create empty trip data
export function createEmptyTripData(tripId: string): TripData {
  return {
    trip: {
      id: tripId,
      days: [],
    },
    people: [],
    defaultItemRules: [], // Add empty rules array for new trips
    ruleOverrides: [],
    packingListView: {
      viewMode: 'by-day',
      filters: {
        packed: true,
        unpacked: true,
        excluded: false,
      },
    },
    calculated: {
      defaultItems: [],
      packingListItems: [],
    },
    isLoading: false,
  };
}

export const initialState: Omit<StoreType, 'auth'> = {
  trips: {
    summaries: [],
    selectedTripId: null,
    byId: {},
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
      if (
        !action.type.startsWith('@@redux') &&
        !action.type.startsWith('auth')
      ) {
        console.warn(`Unknown action: ${action.type}`);
      }
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

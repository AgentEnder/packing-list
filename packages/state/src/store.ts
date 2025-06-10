import { configureStore, Reducer } from '@reduxjs/toolkit';
import {
  authReducer,
  type AuthState,
  type AuthActions,
  authInitialState,
} from '@packing-list/auth-state';
import { AllActions, Mutations, type StoreActions } from './actions.js';
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
  SyncState,
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

  // Sync state
  sync: {
    syncState: SyncState;
    isInitialized: boolean;
    lastError: string | null;
  };

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
    flow: {
      steps: { path: string; label: string }[];
      current: number | null;
    };
    tripWizard: {
      currentStep: number;
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

export const initialState: StoreType = {
  trips: {
    summaries: [],
    selectedTripId: null,
    byId: {},
  },
  rulePacks: DEFAULT_RULE_PACKS,
  sync: {
    syncState: {
      lastSyncTimestamp: null,
      pendingChanges: [],
      isOnline: true,
      isSyncing: false,
      conflicts: [],
    },
    isInitialized: false,
    lastError: null,
  },
  ui: {
    rulePackModal: {
      isOpen: false,
      activeTab: 'browse',
      selectedPackId: undefined,
    },
    loginModal: {
      isOpen: false,
    },
    flow: {
      steps: [],
      current: null,
    },
    tripWizard: {
      currentStep: 1,
    },
  },
  auth: authInitialState,
};

function createAppReducer(
  initialState: StoreType
): Reducer<StoreType, AllActions | AuthActions> {
  return (
    state: StoreType | undefined,
    action: AllActions | AuthActions
  ): StoreType => {
    if (
      'type' in action &&
      typeof action.type === 'string' &&
      action.type in Mutations
    ) {
      const actionType = action.type as StoreActions;
      const mutation = Mutations[actionType];
      if (mutation) {
        // Type assertion is necessary due to TypeScript's limitation with mapped union types
        // Runtime safety is guaranteed by the check that action.type exists in Mutations
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = mutation(state ?? initialState, action as any);

        // Remove auth from result and return
        return result;
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
    return state ?? initialState;
  };
}

type PageContext = {
  isClient?: boolean;
  redux?: {
    ssrState?: StoreType;
  };
};

export function createStore(pageContext?: PageContext, _state?: StoreType) {
  const preloadedState = _state ?? pageContext?.redux?.ssrState;

  const appReducer = createAppReducer(
    preloadedState ?? { ...initialState, auth: initialState.auth }
  );

  const rootReducer = (
    state: StoreType | undefined,
    action: AllActions | AuthActions
  ): StoreType => {
    return {
      ...appReducer(state, action),
      auth: authReducer(state?.auth, action as AuthActions),
    };
  };

  return configureStore({
    reducer: rootReducer,
    preloadedState,
  });
}

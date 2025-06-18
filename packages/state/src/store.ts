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
  Trip,
  Person,
  RuleOverride,
  PackingListViewState,
  PackingListItem,
  RulePack,
  TripSummary,
  SyncState,
} from '@packing-list/model';
import { DEFAULT_RULE_PACKS } from './default-rule-packs.js';
import { syncTrackingMiddleware } from './middleware/sync-tracking-middleware.js';

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
    confetti: {
      burstId: number;
      source: { x: number; y: number; w: number; h: number } | null;
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
  const now = new Date().toISOString();
  return {
    trip: {
      id: tripId,
      userId: '', // Will be set when user is known
      title: 'New Trip',
      description: '',
      days: [],
      tripEvents: [],
      createdAt: now,
      updatedAt: now,
      lastSyncedAt: undefined,
      settings: {
        defaultTimeZone: 'UTC',
        packingViewMode: 'by-day',
      },
      version: 1,
      isDeleted: false,
      defaultItemRules: [],
    },
    people: [],
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
    confetti: {
      burstId: 0,
      source: null,
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
        console.warn(`🏪 [STORE] Unknown action: ${action.type}`);
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

  const store = configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(syncTrackingMiddleware),
  });

  // Expose store to window for development and e2e testing
  if (
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as Record<string, unknown>).window !== 'undefined'
  ) {
    (globalThis as Record<string, unknown>).__REDUX_STORE__ = store;
  }

  return store;
}

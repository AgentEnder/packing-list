import { StoreType, TripData, createEmptyTripData } from '../store.js';
import { Person, TripSummary } from '@packing-list/model';

export function createTestTripState(options: {
  tripId?: string;
  people?: Person[];
  title?: string;
  description?: string;
  userId?: string;
}): StoreType {
  const tripId = options.tripId || 'test-trip';
  const people = options.people || [];

  const tripSummary: TripSummary = {
    tripId,
    title: options.title || 'Test Trip',
    description: options.description || 'A test trip',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalItems: 0,
    packedItems: 0,
    totalPeople: people.length,
  };

  const tripData: TripData = {
    ...createEmptyTripData(tripId),
    people,
    trip: {
      ...createEmptyTripData(tripId).trip,
      title: options.title || 'Test Trip',
      description: options.description || 'A test trip',
    },
  };

  return {
    trips: {
      summaries: [tripSummary],
      selectedTripId: tripId,
      byId: {
        [tripId]: tripData,
      },
    },
    userPeople: {
      people: [],
      isLoading: false,
      error: null,
      hasTriedToLoad: false,
    },
    rulePacks: [],
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
        currentStep: 0,
      },
      confetti: { burstId: 0, source: null },
    },
    auth: {
      user: options.userId
        ? {
            id: options.userId,
            email: 'test@example.com',
            type: 'local' as const,
          }
        : null,
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
    },
    sync: {
      syncState: {
        lastSyncTimestamp: new Date().getTime(),
        pendingChanges: [],
        conflicts: [],
        isOnline: true,
        isSyncing: false,
      },
      isInitialized: true,
      lastError: null,
    },
    userPreferences: {
      theme: 'light',
      defaultTimeZone: 'America/New_York',
      defaultTripDuration: 7,
      autoSyncEnabled: true,
      serviceWorkerEnabled: true,
      lastSelectedTripId: 'test-trip',
    },
  };
}

export function createTestPerson(overrides: Partial<Person> = {}): Person {
  return {
    id: 'test-person',
    name: 'Test Person',
    age: 30,
    gender: 'other',
    tripId: 'test-trip',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    isDeleted: false,
    settings: {},
    ...overrides,
  };
}

export const getSelectedTripId = (state: StoreType): string => {
  const tripId = state.trips.selectedTripId;
  if (!tripId) {
    throw new Error('No trip selected in test state');
  }
  return tripId;
};

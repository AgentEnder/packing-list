import { StoreType, TripData, createEmptyTripData } from '../store.js';
import { LegacyPerson as Person, TripSummary } from '@packing-list/model';

export function createTestTripState(options: {
  tripId?: string;
  people?: Person[];
  title?: string;
  description?: string;
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
  };

  return {
    trips: {
      summaries: [tripSummary],
      selectedTripId: tripId,
      byId: {
        [tripId]: tripData,
      },
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
    },
    auth: {
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
    },
  };
}

export function createTestPerson(overrides: Partial<Person> = {}): Person {
  return {
    id: 'test-person',
    name: 'Test Person',
    age: 30,
    gender: 'other',
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

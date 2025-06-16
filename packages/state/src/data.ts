import {
  DefaultItemRule,
  PackingListViewState,
  Person,
  TripEvent,
  SyncConflict,
} from '@packing-list/model';
import { StoreType, TripData } from './store.js';
import { enumerateTripDays } from './action-handlers/calculate-days.js';
import { calculateDefaultItems } from './action-handlers/calculate-default-items.js';
import { calculatePackingListHandler } from './action-handlers/calculate-packing-list.js';
import { DEFAULT_RULE_PACKS } from './default-rule-packs.js';

const tripEvents: TripEvent[] = [
  {
    id: 'demo-event-1',
    type: 'leave_home',
    date: '2024-07-25',
    notes: 'Flight departs at 8:30 AM',
  },
  {
    id: 'demo-event-2',
    type: 'arrive_destination',
    date: '2024-07-25',
    location: 'Houston, TX',
    notes: 'Stay at Hotel ZaZa Houston Memorial City',
  },
  {
    id: 'demo-event-3',
    type: 'leave_destination',
    date: '2024-07-28',
    location: 'Houston, TX',
    notes: 'Flight to Miami at 2:15 PM',
  },
  {
    id: 'demo-event-4',
    type: 'arrive_destination',
    date: '2024-07-29',
    location: 'Miami, FL',
    notes: 'Stay at Fontainebleau Miami Beach',
  },
  {
    id: 'demo-event-5',
    type: 'leave_destination',
    date: '2024-07-31',
    location: 'Miami, FL',
    notes: 'Flight home at 6:45 PM',
  },
  {
    id: 'demo-event-6',
    type: 'arrive_home',
    date: '2024-08-02',
    notes: 'Expected arrival 11:30 PM',
  },
];

const defaultItemRules: DefaultItemRule[] = [
  {
    id: 'underwear-rule',
    originalRuleId: 'underwear-rule',
    name: 'Underwear',
    calculation: {
      baseQuantity: 1,
      perDay: true,
      perPerson: true,
      extraItems: {
        quantity: 2,
        perDay: false,
        perPerson: true,
      },
    },
    conditions: [
      {
        type: 'person',
        field: 'age',
        operator: '>=',
        value: 3,
      },
    ],
    categoryId: 'clothing',
    subcategoryId: 'underwear',
  },
  {
    id: 'socks-rule',
    originalRuleId: 'socks-rule',
    name: 'Socks',
    calculation: {
      baseQuantity: 1,
      perDay: true,
      perPerson: true,
      extraItems: {
        quantity: 1,
        perDay: false,
        perPerson: true,
      },
    },
    conditions: [],
    categoryId: 'clothing',
    subcategoryId: 'underwear',
  },
  {
    id: 'tshirt-rule',
    originalRuleId: 'tshirt-rule',
    name: 'T-Shirts',
    calculation: {
      baseQuantity: 1,
      perDay: true,
      perPerson: true,
      extraItems: {
        quantity: 1,
        perDay: false,
        perPerson: true,
      },
    },
    conditions: [],
    categoryId: 'clothing',
    subcategoryId: 'tops',
  },
  {
    id: 'jeans-rule',
    originalRuleId: 'jeans-rule',
    name: 'Jeans/Pants',
    calculation: {
      baseQuantity: 1,
      perDay: true,
      perPerson: true,
      daysPattern: {
        every: 2,
        roundUp: true,
      },
      extraItems: {
        quantity: 1,
        perDay: false,
        perPerson: true,
      },
    },
    notes:
      "Most people can wear jeans multiple times. We'll pack one pair for every 2 days plus an extra pair per person.",
    conditions: [],
    categoryId: 'clothing',
    subcategoryId: 'bottoms',
  },
  {
    id: 'pajamas-rule',
    originalRuleId: 'pajamas-rule',
    name: 'Pajamas',
    calculation: {
      baseQuantity: 1,
      perDay: true,
      perPerson: true,
      daysPattern: {
        every: 3,
        roundUp: true,
      },
    },
    notes:
      'Pajamas can usually be worn for a few nights before needing a wash.',
    conditions: [],
    categoryId: 'clothing',
    subcategoryId: 'underwear',
  },
  {
    id: 'swimsuit-rule',
    originalRuleId: 'swimsuit-rule',
    name: 'Swimsuit',
    calculation: {
      baseQuantity: 1,
      perDay: false,
      perPerson: true,
    },
    conditions: [
      {
        type: 'day',
        field: 'expectedClimate',
        operator: '==',
        value: 'beach',
        notes: 'Only needed for beach destinations or hotels with pools',
      },
    ],
    categoryId: 'clothing',
    subcategoryId: 'swimwear',
  },
  {
    id: 'jacket-rule',
    originalRuleId: 'jacket-rule',
    name: 'Warm Jacket',
    calculation: {
      baseQuantity: 1,
      perDay: false,
      perPerson: true,
    },
    notes:
      'A single warm jacket per person is usually sufficient for cold weather.',
    conditions: [
      {
        type: 'day',
        field: 'expectedClimate',
        operator: '==',
        value: 'cold',
        notes: 'Pack if any destination has cold weather',
      },
    ],
    categoryId: 'clothing',
    subcategoryId: 'outerwear',
  },
  {
    id: 'toothbrush-rule',
    originalRuleId: 'toothbrush-rule',
    name: 'Toothbrush',
    calculation: {
      baseQuantity: 1,
      perDay: false,
      perPerson: true,
    },
    conditions: [],
    categoryId: 'toiletries',
  },
  {
    id: 'toothpaste-rule',
    originalRuleId: 'toothpaste-rule',
    name: 'Toothpaste',
    calculation: {
      baseQuantity: 1,
      perDay: false,
      perPerson: false,
    },
    conditions: [],
    categoryId: 'toiletries',
  },
  {
    id: 'shampoo-rule',
    originalRuleId: 'shampoo-rule',
    name: 'Travel Shampoo',
    calculation: {
      baseQuantity: 1,
      perDay: false,
      perPerson: false,
      daysPattern: {
        every: 7,
        roundUp: true,
      },
    },
    conditions: [],
    categoryId: 'toiletries',
  },
  {
    id: 'laundry-rule',
    originalRuleId: 'laundry-rule',
    name: 'Travel Laundry Detergent',
    calculation: {
      baseQuantity: 1,
      perDay: false,
      perPerson: false,
      daysPattern: {
        every: 7,
        roundUp: true,
      },
    },
    conditions: [],
    categoryId: 'misc',
  },
  {
    id: 'diaper-rule',
    originalRuleId: 'diaper-rule',
    name: 'Diapers',
    calculation: {
      baseQuantity: 6,
      perDay: true,
      perPerson: true,
      extraItems: {
        quantity: 4,
        perDay: false,
        perPerson: true,
      },
    },
    notes:
      'Pack 6 diapers per day plus 4 extra per child for unexpected needs.',
    conditions: [
      {
        type: 'person',
        field: 'age',
        operator: '<=',
        value: 3,
        notes: 'Only needed for toddlers and babies',
      },
    ],
    categoryId: 'misc',
  },
  {
    id: 'charger-rule',
    originalRuleId: 'charger-rule',
    name: 'Phone Charger',
    calculation: {
      baseQuantity: 1,
      perDay: false,
      perPerson: true,
      extraItems: {
        quantity: 2,
        perDay: false,
        perPerson: true,
      },
    },
    conditions: [
      {
        type: 'person',
        field: 'age',
        operator: '>',
        value: 12,
      },
    ],
    categoryId: 'electronics',
  },
] as DefaultItemRule[];

const people: Person[] = [
  {
    id: 'demo-person-1',
    name: 'Sarah Johnson',
    age: 42,
    gender: 'female',
    tripId: 'demo-trip',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    isDeleted: false,
    settings: {},
  },
  {
    id: 'demo-person-2',
    name: 'Mike Johnson',
    age: 45,
    gender: 'male',
    tripId: 'demo-trip',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    isDeleted: false,
    settings: {},
  },
  {
    id: 'demo-person-3',
    name: 'Emma Johnson',
    age: 12,
    gender: 'female',
    tripId: 'demo-trip',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    isDeleted: false,
    settings: {},
  },
  {
    id: 'demo-person-4',
    name: 'Alex Johnson',
    age: 3,
    gender: 'male',
    tripId: 'demo-trip',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    isDeleted: false,
    settings: {},
  },
];

const packingListView: PackingListViewState = {
  viewMode: 'by-person',
  filters: {
    packed: true,
    unpacked: true,
    excluded: false,
  },
};

export const CREATE_DEMO_DATA: () => Partial<StoreType> = () => {
  const tripId = 'DEMO_TRIP';

  // Create mock conflicts for demo
  const mockConflicts: SyncConflict[] = [
    {
      id: 'demo-conflict-1',
      entityType: 'person',
      entityId: 'demo-person-1',
      localVersion: {
        name: 'Sarah Johnson (Local)',
        age: 42,
        gender: 'female',
        timestamp: Date.now() - 1000,
      },
      serverVersion: {
        name: 'Sarah J. Johnson',
        age: 42,
        gender: 'female',
        timestamp: Date.now(),
      },
      conflictType: 'update_conflict',
      timestamp: Date.now(),
    },
    {
      id: 'demo-conflict-2',
      entityType: 'item',
      entityId: 'demo-item-123',
      localVersion: {
        name: 'Beach Towel',
        category: 'beach',
        isPacked: true,
        timestamp: Date.now() - 2000,
      },
      serverVersion: {
        name: 'Large Beach Towel',
        category: 'beach',
        isPacked: false,
        timestamp: Date.now() - 500,
      },
      conflictType: 'update_conflict',
      timestamp: Date.now() - 500,
    },
  ];

  // Create the trip data structure
  const tripData: TripData = {
    trip: {
      id: tripId,
      days: enumerateTripDays(tripEvents),
      tripEvents,
      userId: 'demo-user',
      title: 'Demo Trip: Houston & Miami',
      description:
        'A sample multi-city trip to demonstrate the packing list functionality',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        defaultTimeZone: 'America/New_York',
        packingViewMode: 'by-day',
      },
      version: 1,
      isDeleted: false,
      defaultItemRules,
    },
    people,
    ruleOverrides: [],
    packingListView,
    calculated: {
      defaultItems: [],
      packingListItems: [],
    },
    isLoading: false,
  };

  // Create the trip summary
  const tripSummary = {
    tripId,
    title: 'Demo Trip: Houston & Miami',
    description:
      'A sample multi-city trip to demonstrate the packing list functionality',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalItems: 0,
    packedItems: 0,
    totalPeople: people.length,
  };

  // Create the full state with proper multi-trip structure
  const baseState: StoreType = {
    trips: {
      summaries: [tripSummary],
      selectedTripId: tripId,
      byId: {
        [tripId]: tripData,
      },
    },
    rulePacks: DEFAULT_RULE_PACKS,
    sync: {
      syncState: {
        lastSyncTimestamp: Date.now() - 300000, // 5 minutes ago
        pendingChanges: [],
        isOnline: true,
        isSyncing: false,
        conflicts: mockConflicts,
      },
      isInitialized: true,
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
        current: null,
        steps: [],
      },
      tripWizard: {
        currentStep: 0,
      },
    },
    auth: {
      user: null,
      session: null,
      loading: false,
      error: null,
      isOfflineMode: false,
      connectivityState: { isOnline: false, isConnected: false },
      isInitialized: false,
      lastError: null,
      isAuthenticating: false,
      forceOfflineMode: false,
      offlineAccounts: [],
      hasOfflinePasscode: false,
    },
  };

  // Calculate default items and packing list for the demo trip
  const stateWithDefaultItems = calculateDefaultItems(baseState);
  return calculatePackingListHandler(stateWithDefaultItems);
};

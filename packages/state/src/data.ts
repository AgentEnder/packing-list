import {
  DefaultItemRule,
  PackingListViewState,
  Person,
  Trip,
  TripEvent,
} from '@packing-list/model';
import { StoreType } from './store.js';
import { enumerateTripDays } from './action-handlers/calculate-days.js';
import { calculateDefaultItems } from './action-handlers/calculate-default-items.js';
import { calculatePackingListHandler } from './action-handlers/calculate-packing-list.js';
import { DEFAULT_RULE_PACKS } from './default-rule-packs.js';

const tripEvents: TripEvent[] = [
  {
    id: 'event-1',
    type: 'leave_home',
    date: '2024-07-25',
    notes: 'Flight departs at 8:30 AM',
  },
  {
    id: 'event-2',
    type: 'arrive_destination',
    date: '2024-07-25',
    location: 'Houston, TX',
    notes: 'Stay at Hotel ZaZa Houston Memorial City',
  },
  {
    id: 'event-3',
    type: 'leave_destination',
    date: '2024-07-28',
    location: 'Houston, TX',
    notes: 'Flight to Miami at 2:15 PM',
  },
  {
    id: 'event-4',
    type: 'arrive_destination',
    date: '2024-07-29',
    location: 'Miami, FL',
    notes: 'Stay at Fontainebleau Miami Beach',
  },
  {
    id: 'event-5',
    type: 'leave_destination',
    date: '2024-07-31',
    location: 'Miami, FL',
    notes: 'Flight home at 6:45 PM',
  },
  {
    id: 'event-6',
    type: 'arrive_home',
    date: '2024-08-02',
    notes: 'Expected arrival 11:30 PM',
  },
];

const defaultItemRules: DefaultItemRule[] = [
  {
    id: 'underwear-rule',
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
];

const people: Person[] = [
  {
    id: 'person-1',
    name: 'Sarah Johnson',
    age: 42,
    gender: 'female',
  },
  {
    id: 'person-2',
    name: 'Mike Johnson',
    age: 45,
    gender: 'male',
  },
  {
    id: 'person-3',
    name: 'Emma Johnson',
    age: 12,
    gender: 'female',
  },
  {
    id: 'person-4',
    name: 'Alex Johnson',
    age: 3,
    gender: 'male',
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

const trip: Trip = {
  id: 'DEMO_TRIP',
  days: enumerateTripDays(tripEvents),
  tripEvents,
};

export const CREATE_DEMO_DATA: () => Partial<StoreType> = () =>
  calculatePackingListHandler(
    calculateDefaultItems({
      people,
      ruleOverrides: [],
      packingListView,
      defaultItemRules,
      trip,
      calculated: {
        defaultItems: [],
        packingListItems: [],
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
    })
  );

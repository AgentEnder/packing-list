import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { loadOfflineState } from '../offline-hydration.js';
import {
  TripStorage,
  PersonStorage,
  ItemStorage,
  TripRuleStorage,
  UserPersonStorage,
} from '@packing-list/offline-storage';
import type { Trip, Person, TripItem } from '@packing-list/model';

vi.mock('@packing-list/offline-storage', () => ({
  TripStorage: {
    getUserTripSummaries: vi.fn(),
    getTrip: vi.fn(),
  },
  PersonStorage: { getTripPeople: vi.fn() },
  ItemStorage: { getTripItems: vi.fn() },
  TripRuleStorage: { getTripRulesWithDetails: vi.fn() },
  UserPersonStorage: { getUserPerson: vi.fn() },
}));

type Mocked<T> = { [K in keyof T]: T[K] & Mock };
const tripStorage = TripStorage as unknown as Mocked<typeof TripStorage>;
const personStorage = PersonStorage as unknown as Mocked<typeof PersonStorage>;
const itemStorage = ItemStorage as unknown as Mocked<typeof ItemStorage>;
const tripRuleStorage = TripRuleStorage as unknown as Mocked<
  typeof TripRuleStorage
>;
const userPersonStorage = UserPersonStorage as unknown as Mocked<
  typeof UserPersonStorage
>;

beforeEach(() => {
  vi.clearAllMocks();
  // Set default mock return values
  userPersonStorage.getUserPerson.mockResolvedValue(null);
});

describe('loadOfflineState', () => {
  it('should build state from offline data', async () => {
    const summary = {
      tripId: 't1',
      title: 'Trip One',
      description: '',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      totalItems: 0,
      packedItems: 0,
      totalPeople: 0,
    };
    const trip: Trip = {
      id: 't1',
      userId: 'user-1',
      title: 'Trip One',
      description: '',
      days: [],
      defaultItemRules: [],
      lastSyncedAt: '2024-01-01',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      version: 1,
      isDeleted: false,
      settings: {
        defaultTimeZone: 'UTC',
        packingViewMode: 'by-day',
      },
    };
    const people: Person[] = [
      {
        id: 'p1',
        name: 'Alice',
        tripId: 't1',
        age: 25,
        gender: 'female' as const,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        version: 1,
        isDeleted: false,
      },
    ];
    const items: TripItem[] = [
      {
        id: 'i1',
        name: 'Phone',
        tripId: 't1',
        packed: false,
        dayIndex: 0,
        personId: 'p1',
        notes: '',
        quantity: 1,
        category: 'misc',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        version: 1,
        isDeleted: false,
      },
    ];

    tripStorage.getUserTripSummaries.mockResolvedValue([summary]);
    tripStorage.getTrip.mockResolvedValue(trip);
    personStorage.getTripPeople.mockResolvedValue(people);
    itemStorage.getTripItems.mockResolvedValue(items);
    tripRuleStorage.getTripRulesWithDetails.mockResolvedValue([]);

    const state = await loadOfflineState('user-1');

    expect(state.trips.summaries).toEqual([summary]);
    expect(state.trips.selectedTripId).toBe('t1');
    expect(state.trips.byId['t1']).toBeDefined();
    expect(state.trips.byId['t1'].people).toEqual(people);
    // Since no default item rules are provided, no calculated items should be generated
    // The raw stored items are only used to preserve packed status against calculated items
    expect(state.trips.byId['t1'].calculated.packingListItems).toHaveLength(0);
  });

  it('should preserve trip days when loading from offline state', async () => {
    const tripDays = [
      {
        location: 'San Francisco',
        expectedClimate: 'temperate' as const,
        items: [],
        travel: false,
        date: new Date('2024-01-01').getTime(),
      },
      {
        location: 'Los Angeles',
        expectedClimate: 'temperate' as const,
        items: [],
        travel: true,
        date: new Date('2024-01-02').getTime(),
      },
    ];

    const summary = {
      tripId: 't2',
      title: 'Trip with Days',
      description: 'A trip that has days',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      totalItems: 0,
      packedItems: 0,
      totalPeople: 0,
    };

    const trip: Trip = {
      id: 't2',
      userId: 'user-1',
      title: 'Trip with Days',
      description: 'A trip that has days',
      days: tripDays, // Include actual days data
      defaultItemRules: [],
      tripEvents: [
        {
          id: 'event-1',
          type: 'leave_home',
          date: '2024-01-01',
          notes: 'Start of trip',
        },
      ],
      lastSyncedAt: '2024-01-01',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      version: 1,
      isDeleted: false,
      settings: {
        defaultTimeZone: 'UTC',
        packingViewMode: 'by-day',
      },
    };

    tripStorage.getUserTripSummaries.mockResolvedValue([summary]);
    tripStorage.getTrip.mockResolvedValue(trip);
    personStorage.getTripPeople.mockResolvedValue([]);
    itemStorage.getTripItems.mockResolvedValue([]);
    tripRuleStorage.getTripRulesWithDetails.mockResolvedValue([]);

    const state = await loadOfflineState('user-1');

    // Verify that trip days are preserved
    expect(state.trips.byId['t2'].trip.days).toEqual(tripDays);
    expect(state.trips.byId['t2'].trip.days).toHaveLength(2);
    expect(state.trips.byId['t2'].trip.days[0].location).toBe('San Francisco');
    expect(state.trips.byId['t2'].trip.days[1].location).toBe('Los Angeles');

    // Verify that trip events are also preserved
    expect(state.trips.byId['t2'].trip.tripEvents).toHaveLength(1);
    expect(state.trips.byId['t2'].trip.tripEvents?.[0].type).toBe('leave_home');

    // Verify that the complete Trip object is preserved (including title, settings, etc.)
    const fullTrip = state.trips.byId['t2'].trip as Trip;
    expect(fullTrip.title).toBe('Trip with Days');
    expect(fullTrip.description).toBe('A trip that has days');
    expect(fullTrip.settings?.defaultTimeZone).toBe('UTC');
    expect(fullTrip.settings?.packingViewMode).toBe('by-day');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadOfflineState } from '../offline-hydration.js';
import {
  TripStorage,
  PersonStorage,
  ItemStorage,
} from '@packing-list/offline-storage';
import type { Trip, Person, TripItem } from '@packing-list/model';

vi.mock('@packing-list/offline-storage', () => ({
  TripStorage: {
    getUserTripSummaries: vi.fn(),
    getTrip: vi.fn(),
  },
  PersonStorage: { getTripPeople: vi.fn() },
  ItemStorage: { getTripItems: vi.fn() },
}));

type Mocked<T> = { [K in keyof T]: T[K] & vi.Mock };
const tripStorage = TripStorage as unknown as Mocked<typeof TripStorage>;
const personStorage = PersonStorage as unknown as Mocked<typeof PersonStorage>;
const itemStorage = ItemStorage as unknown as Mocked<typeof ItemStorage>;

beforeEach(() => {
  vi.clearAllMocks();
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

    const state = await loadOfflineState('user-1');

    expect(state.trips.summaries).toEqual([summary]);
    expect(state.trips.selectedTripId).toBe('t1');
    expect(state.trips.byId['t1']).toBeDefined();
    expect(state.trips.byId['t1'].people).toEqual(people);
    expect(state.trips.byId['t1'].calculated.packingListItems).toHaveLength(1);
  });
});

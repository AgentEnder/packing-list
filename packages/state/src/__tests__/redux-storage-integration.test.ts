import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  seedIndexedDB,
  mockSupabase,
  createIntegrationStore,
} from './integration-helpers.js';
import { loadOfflineState } from '../offline-hydration.js';
import {
  TripStorage,
  PersonStorage,
  closeDatabase,
} from '@packing-list/offline-storage';
import type { Trip, Person } from '@packing-list/model';

mockSupabase();

const baseTrip: Trip = {
  id: 't1',
  userId: 'user-1',
  title: 'Seed Trip',
  description: '',
  days: [],
  defaultItemRules: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  version: 1,
  isDeleted: false,
  settings: { defaultTimeZone: 'UTC', packingViewMode: 'by-day' },
};

beforeEach(async () => {
  await seedIndexedDB({ trips: [baseTrip] });
});

afterEach(async () => {
  await closeDatabase();
});

describe('Redux and offline storage integration', () => {
  it('persists person additions to IndexedDB', async () => {
    const offline = await loadOfflineState('user-1');
    const store = createIntegrationStore(offline as any);

    store.dispatch({
      type: 'ADD_PERSON',
      payload: {
        id: 'p1',
        tripId: 't1',
        name: 'Alice',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        isDeleted: false,
      } as Person,
    });

    const people = await PersonStorage.getTripPeople('t1');
    expect(people.some((p) => p.id === 'p1')).toBe(true);
  });

  it('hydrates store from IndexedDB', async () => {
    const offline = await loadOfflineState('user-1');
    const store = createIntegrationStore(offline as any);

    const state = store.getState();
    expect(state.trips.summaries).toHaveLength(1);
    expect(state.trips.byId['t1']).toBeDefined();
  });
});

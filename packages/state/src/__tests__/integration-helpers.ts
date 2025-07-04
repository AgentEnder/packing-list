import {
  initializeDatabase,
  TripStorage,
  PersonStorage,
  ItemStorage,
  UserPreferencesStorage,
} from '@packing-list/offline-storage';
import type {
  Trip,
  Person,
  TripItem,
  UserPreferences,
  UserPerson,
} from '@packing-list/model';
import { vi } from 'vitest';

export async function seedIndexedDB(options: {
  trips?: Trip[];
  people?: Person[];
  items?: TripItem[];
  userPreferences?: UserPreferences;
}): Promise<void> {
  await initializeDatabase();
  if (options.userPreferences) {
    await UserPreferencesStorage.savePreferences(options.userPreferences);
  }
  for (const trip of options.trips || []) {
    await TripStorage.saveTrip(trip);
  }
  for (const person of options.people || []) {
    await PersonStorage.savePerson(person);
  }
  for (const item of options.items || []) {
    await ItemStorage.saveItem(item);
  }
}

export function mockSupabase(
  data: {
    userPreferences?: UserPreferences | null;
    userPeople?: UserPerson[];
    trips?: unknown[];
  } = {}
) {
  const fromMock = vi.fn((table: string) => {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(async () => ({ data: null, error: null })),
      insert: vi.fn().mockResolvedValue({ error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    };

    if (table === 'user_profiles') {
      chain.maybeSingle = vi.fn(async () => ({
        data: data.userPreferences
          ? { preferences: data.userPreferences }
          : null,
        error: null,
      }));
    }
    if (table === 'user_people') {
      chain.order = vi.fn(async () => ({
        data: data.userPeople || [],
        error: null,
      }));
    }
    if (table === 'trips') {
      chain.order = vi.fn(async () => ({
        data: data.trips || [],
        error: null,
      }));
    }
    return chain;
  });

  const supabaseClient = {
    from: fromMock,
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: 'user-1' } },
        error: null,
      })),
    },
  } as const;

  vi.mock('@packing-list/supabase', () => ({
    supabase: supabaseClient,
    isSupabaseAvailable: () => true,
  }));

  return supabaseClient;
}

export function createIntegrationStore(state?: Record<string, unknown>) {
  const { createStore } = require('../store.js');
  return createStore({ isClient: true, redux: { ssrState: state } });
}
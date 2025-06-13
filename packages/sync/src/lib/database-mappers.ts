import type {
  Trip,
  Person,
  TripItem,
  Day,
  TripEvent,
} from '@packing-list/model';
import type { Json } from '@packing-list/supabase';

/**
 * Database field mapping utilities
 * Converts between database snake_case and TypeScript camelCase
 */

interface DatabaseTripRow {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  days?: Json;
  trip_events?: Json;
  settings?: Json;
  created_at: string;
  updated_at: string;
  last_synced_at?: string;
  version: number;
  is_deleted: boolean;
}

interface DatabasePersonRow {
  id: string;
  trip_id: string;
  name: string;
  age?: number;
  gender?: string;
  settings?: Json;
  created_at: string;
  updated_at: string;
  version: number;
  is_deleted: boolean;
}

interface DatabaseItemRow {
  id: string;
  trip_id: string;
  name: string;
  category?: string;
  quantity: number;
  packed: boolean;
  notes?: string;
  person_id?: string;
  day_index?: number;
  created_at: string;
  updated_at: string;
  version: number;
  is_deleted: boolean;
}

/**
 * Convert database trip row to Trip model
 */
export function mapDatabaseTripToTrip(row: DatabaseTripRow): Trip {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || '',
    days: Array.isArray(row.days) ? (row.days as Day[]) : [],
    tripEvents: Array.isArray(row.trip_events)
      ? (row.trip_events as TripEvent[])
      : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastSyncedAt: row.last_synced_at,
    settings: row.settings
      ? (row.settings as any)
      : { defaultTimeZone: 'UTC', packingViewMode: 'by-day' },
    version: row.version,
    isDeleted: row.is_deleted,
  };
}

/**
 * Convert database person row to Person model
 */
export function mapDatabasePersonToPerson(row: DatabasePersonRow): Person {
  return {
    id: row.id,
    tripId: row.trip_id,
    name: row.name,
    age: row.age,
    gender: row.gender as
      | 'male'
      | 'female'
      | 'other'
      | 'prefer-not-to-say'
      | undefined,
    settings: row.settings ? (row.settings as any) : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
    isDeleted: row.is_deleted,
  };
}

/**
 * Convert database item row to TripItem model
 */
export function mapDatabaseItemToTripItem(row: DatabaseItemRow): TripItem {
  return {
    id: row.id,
    tripId: row.trip_id,
    name: row.name,
    category: row.category,
    quantity: row.quantity,
    packed: row.packed,
    notes: row.notes,
    personId: row.person_id,
    dayIndex: row.day_index,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
    isDeleted: row.is_deleted,
  };
}

/**
 * Type guards for database rows
 */
export function isDatabaseTripRow(data: unknown): data is DatabaseTripRow {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'user_id' in data &&
    'title' in data
  );
}

export function isDatabasePersonRow(data: unknown): data is DatabasePersonRow {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'trip_id' in data &&
    'name' in data
  );
}

export function isDatabaseItemRow(data: unknown): data is DatabaseItemRow {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'trip_id' in data &&
    'name' in data
  );
}

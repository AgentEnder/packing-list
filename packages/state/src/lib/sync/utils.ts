import type { Json } from '@packing-list/supabase';

// Type guard functions and safe converters
export function toJson(data: unknown): Json {
  if (data === null || data === undefined) {
    return null;
  }

  // For complex objects, we need to ensure they're serializable as Json
  if (typeof data === 'object') {
    try {
      // Test if it can be serialized and parsed
      const serialized = JSON.stringify(data);
      return JSON.parse(serialized) as Json;
    } catch {
      // If serialization fails, return null
      return null;
    }
  }

  // Primitive types that are valid Json
  if (
    typeof data === 'string' ||
    typeof data === 'number' ||
    typeof data === 'boolean'
  ) {
    return data as Json;
  }

  return null;
}

export function fromJson<T>(json: Json): T {
  // Simple cast since we trust the database to have valid data
  // In a production system, you might want to add runtime validation here
  return json as unknown as T;
}

// Helper function to check if a user is local and should not sync to remote
export function isLocalUser(userId: string): boolean {
  return (
    userId === 'local-shared-user' ||
    userId === 'local-user' ||
    userId.startsWith('local')
  );
}

// Database row validation functions
export function isDatabaseTripRow(row: unknown): boolean {
  return !!(
    row &&
    typeof row === 'object' &&
    'id' in row &&
    'title' in row &&
    'user_id' in row
  );
}

export function isDatabasePersonRow(row: unknown): boolean {
  return !!(
    row &&
    typeof row === 'object' &&
    'id' in row &&
    'name' in row &&
    'trip_id' in row
  );
}

export function isDatabaseItemRow(row: unknown): boolean {
  return !!(
    row &&
    typeof row === 'object' &&
    'id' in row &&
    'name' in row &&
    'trip_id' in row
  );
}

// Legacy types for backward compatibility during Phase 1
// These support the existing Redux state structure until Phase 2 migration

import type { Day } from './Day.js';
import type { TripEvent } from './TripEvent.js';

/**
 * Legacy Person type for existing Redux state
 * This is the old structure before multi-trip support
 */
export type LegacyPerson = {
  id: string;
  name: string;
  age?: number;
  gender?: string;
};

/**
 * Legacy Trip type for existing Redux state
 * This is the old structure before multi-trip support
 */
export type LegacyTrip = {
  id: string;
  days: Day[];
  tripEvents?: TripEvent[];
};

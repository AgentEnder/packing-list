import { Day } from './Day.js';
import { TripEvent } from './TripEvent.js';

export type Trip = {
  id: string;
  userId: string;
  title: string;
  description?: string;
  days: Day[];
  tripEvents?: TripEvent[];

  // Metadata
  createdAt: string;
  updatedAt: string;
  lastSyncedAt?: string;

  // Settings
  settings: TripSettings;

  // Sync tracking
  version: number;
  isDeleted: boolean;
};

export type TripSettings = {
  defaultTimeZone: string;
  packingViewMode: 'by-day' | 'by-category';
  // Additional trip-specific settings can be added here
};

export type UserPreferences = {
  defaultTimeZone: string;
  theme: 'light' | 'dark' | 'system';
  defaultTripDuration: number;
  autoSyncEnabled: boolean;
  serviceWorkerEnabled: boolean;
  lastSelectedTripId: string | null; // Track the last selected trip ID for multi-trip sessions
  // Additional global user preferences can be added here
};

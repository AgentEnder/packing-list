export type UserPreferences = {
  defaultTimeZone: string;
  theme: 'light' | 'dark' | 'system';
  defaultTripDuration: number;
  autoSyncEnabled: boolean;
  // Additional global user preferences can be added here
};

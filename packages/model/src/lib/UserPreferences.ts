// Available theme options
export type ThemeOption =
  | 'system'
  | 'light'
  | 'dark'
  | 'cupcake'
  | 'bumblebee'
  | 'emerald'
  | 'corporate'
  | 'synthwave'
  | 'retro'
  | 'cyberpunk'
  | 'valentine'
  | 'halloween'
  | 'garden'
  | 'forest'
  | 'aqua'
  | 'lofi'
  | 'pastel'
  | 'fantasy'
  | 'wireframe'
  | 'black'
  | 'luxury'
  | 'dracula'
  | 'cmyk'
  | 'autumn'
  | 'business'
  | 'acid'
  | 'lemonade'
  | 'night'
  | 'coffee'
  | 'winter'
  | 'dim'
  | 'nord'
  | 'sunset';

export type UserPreferences = {
  defaultTimeZone: string;
  theme: ThemeOption;
  defaultTripDuration: number;
  autoSyncEnabled: boolean;
  serviceWorkerEnabled: boolean;
  lastSelectedTripId: string | null; // Track the last selected trip ID for multi-trip sessions
  // Additional global user preferences can be added here
};

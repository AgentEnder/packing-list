export function offlineStorage(): string {
  return 'offline-storage';
}

// Database
export { getDatabase, initializeDatabase, closeDatabase } from './database.js';

// Storage classes
export { TripStorage } from './trip-storage.js';
export { PersonStorage } from './person-storage.js';
export { ItemStorage } from './item-storage.js';
export { DefaultItemRulesStorage } from './default-item-rules-storage.js';
export { RulePacksStorage } from './rule-packs-storage.js';
export { ConflictsStorage } from './conflicts-storage.js';
export { RuleOverrideStorage } from './rule-override-storage.js';

// Demo mode utilities
export {
  shouldSkipPersistence,
  isDemoMode,
  isDemoTripId,
  isDemoEntityId,
} from './demo-mode-detector.js';

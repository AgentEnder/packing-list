import { openDB, type IDBPDatabase } from 'idb';
import type {
  Trip,
  Person,
  TripItem,
  UserPreferences,
  Change,
  SyncConflict,
  RuleOverride,
  TripRule,
  DefaultItemRule,
  RulePack,
} from '@packing-list/model';

// Declare global window type for database instance
declare global {
  interface Window {
    __offlineDbForceClose?: () => Promise<void>;
  }
}

export interface OfflineDB {
  // User data
  userPreferences: UserPreferences;

  // Trip data
  trips: Trip;
  tripPeople: Person;
  tripItems: TripItem;
  tripRuleOverrides: RuleOverride;
  tripDefaultItemRules: TripRule;

  // User rules data
  defaultItemRules: DefaultItemRule;
  rulePacks: RulePack;

  // Sync tracking
  syncChanges: Change;
  syncConflicts: SyncConflict;

  // Metadata
  syncMetadata: {
    lastSyncTimestamp: number;
    deviceId: string;
  };
}

const DB_NAME = 'PackingListOfflineDB';
const DB_VERSION = 2;

let dbInstance: IDBPDatabase<OfflineDB> | null = null;

export async function initializeDatabase(): Promise<IDBPDatabase<OfflineDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  console.log('[OfflineDB] Opening database');
  dbInstance = await openDB<OfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      console.log('[OfflineDB] Initializing database schema...');

      // User preferences store
      if (!db.objectStoreNames.contains('userPreferences')) {
        const userPreferencesStore = db.createObjectStore('userPreferences');
        userPreferencesStore.put(
          {
            defaultTimeZone: 'UTC',
            theme: 'system',
            defaultTripDuration: 7,
            autoSyncEnabled: true,
          },
          'preferences'
        );
      }

      // Trips store
      if (!db.objectStoreNames.contains('trips')) {
        const tripsStore = db.createObjectStore('trips', { keyPath: 'id' });
        tripsStore.createIndex('userId', 'userId');
        tripsStore.createIndex('updatedAt', 'updatedAt');
        tripsStore.createIndex('activeTrips', ['userId', 'isDeleted']);
      }

      // Trip people store
      if (!db.objectStoreNames.contains('tripPeople')) {
        const tripPeopleStore = db.createObjectStore('tripPeople', {
          keyPath: 'id',
        });
        tripPeopleStore.createIndex('tripId', 'tripId');
        tripPeopleStore.createIndex('activeByTrip', ['tripId', 'isDeleted']);
      }

      // Trip items store
      if (!db.objectStoreNames.contains('tripItems')) {
        const tripItemsStore = db.createObjectStore('tripItems', {
          keyPath: 'id',
        });
        tripItemsStore.createIndex('tripId', 'tripId');
        tripItemsStore.createIndex('personId', 'personId');
        tripItemsStore.createIndex('dayIndex', ['tripId', 'dayIndex']);
        tripItemsStore.createIndex('activeByTrip', ['tripId', 'isDeleted']);
      }

      // Trip rule overrides store
      if (!db.objectStoreNames.contains('tripRuleOverrides')) {
        const tripRuleOverridesStore = db.createObjectStore(
          'tripRuleOverrides',
          {
            keyPath: ['tripId', 'ruleId', 'personId', 'dayIndex'],
          }
        );
        tripRuleOverridesStore.createIndex('tripId', 'tripId');
        tripRuleOverridesStore.createIndex('ruleId', 'ruleId');
      }

      // Trip default item rules store (join table)
      if (!db.objectStoreNames.contains('tripDefaultItemRules')) {
        const tripRulesStore = db.createObjectStore('tripDefaultItemRules', {
          keyPath: 'id',
        });
        tripRulesStore.createIndex('tripId', 'tripId');
        tripRulesStore.createIndex('ruleId', 'ruleId');
        tripRulesStore.createIndex('activeByTrip', ['tripId', 'isDeleted']);
      }

      // Default item rules store (user-specific rules)
      if (!db.objectStoreNames.contains('defaultItemRules')) {
        const defaultItemRulesStore = db.createObjectStore('defaultItemRules', {
          keyPath: 'id',
        });
        defaultItemRulesStore.createIndex('packIds', 'packIds', {
          multiEntry: true,
        });
        defaultItemRulesStore.createIndex('categoryId', 'categoryId');
      }

      // Rule packs store (user-specific rule collections)
      if (!db.objectStoreNames.contains('rulePacks')) {
        const rulePacksStore = db.createObjectStore('rulePacks', {
          keyPath: 'id',
        });
        rulePacksStore.createIndex('metadata.category', 'metadata.category');
        rulePacksStore.createIndex('metadata.tags', 'metadata.tags', {
          multiEntry: true,
        });
      }

      // Sync changes store (for pending changes)
      if (!db.objectStoreNames.contains('syncChanges')) {
        const syncChangesStore = db.createObjectStore('syncChanges', {
          keyPath: 'id',
        });
        syncChangesStore.createIndex('timestamp', 'timestamp');
        syncChangesStore.createIndex('entityType', 'entityType');
        syncChangesStore.createIndex('synced', 'synced');
        syncChangesStore.createIndex('pendingChanges', 'synced'); // Index for pending changes
      }

      // Sync conflicts store
      if (!db.objectStoreNames.contains('syncConflicts')) {
        const syncConflictsStore = db.createObjectStore('syncConflicts', {
          keyPath: 'id',
        });
        syncConflictsStore.createIndex('entityType', 'entityType');
        syncConflictsStore.createIndex('timestamp', 'timestamp');
      }

      // Sync metadata store
      if (!db.objectStoreNames.contains('syncMetadata')) {
        const syncMetadataStore = db.createObjectStore('syncMetadata');
        // Initialize with default values
        syncMetadataStore.put(0, 'lastSyncTimestamp');
        syncMetadataStore.put(generateDeviceId(), 'deviceId');
      }

      console.log('[OfflineDB] Database schema initialized successfully');
    },
    blocked() {
      console.warn(
        '[OfflineDB] Database upgrade blocked by another connection'
      );
    },
    blocking() {
      console.warn('[OfflineDB] Database connection is blocking an upgrade');
      // Auto-close when blocking to allow upgrades
      if (dbInstance) {
        console.log(
          '[OfflineDB] Auto-closing database to resolve blocking upgrade'
        );
        dbInstance.close();
        dbInstance = null;
      }
    },
    terminated() {
      console.warn('[OfflineDB] Database connection was terminated');
      dbInstance = null;
    },
  });

  return dbInstance;
}

export async function getDatabase(): Promise<IDBPDatabase<OfflineDB>> {
  if (!dbInstance) {
    return await initializeDatabase();
  }
  return dbInstance;
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    console.log('[OfflineDB] Closing database connection');
    dbInstance.close();
    dbInstance = null;
  }
}

// Test cleanup function - force close and clear instance
export async function forceCloseDatabase(): Promise<void> {
  if (dbInstance) {
    console.log('[OfflineDB] Force closing database for test cleanup');
    try {
      dbInstance.close();
    } catch (e) {
      console.warn('[OfflineDB] Error closing database:', e);
    }
    dbInstance = null;
  }
}

function generateDeviceId(): string {
  // Generate a unique device ID for this browser/device
  return 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

import { openDB, type IDBPDatabase } from 'idb';
import type {
  Trip,
  Person,
  TripItem,
  UserPreferences,
  Change,
  SyncConflict,
} from '@packing-list/model';

export interface OfflineDB {
  // User data
  userPreferences: UserPreferences;

  // Trip data
  trips: Trip;
  tripPeople: Person;
  tripItems: TripItem;

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
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<OfflineDB> | null = null;

export async function initializeDatabase(): Promise<IDBPDatabase<OfflineDB>> {
  if (dbInstance) {
    return dbInstance;
  }

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
    dbInstance.close();
    dbInstance = null;
  }
}

function generateDeviceId(): string {
  // Generate a unique device ID for this browser/device
  return 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

import type { SyncConflict } from '@packing-list/model';
import { getDatabase } from './database.js';
import { shouldSkipPersistence } from './demo-mode-detector.js';

export class ConflictsStorage {
  /** Save or update a sync conflict */
  static async saveConflict(conflict: SyncConflict): Promise<void> {
    // Skip persistence in demo mode (except for demo conflicts initialization)
    if (
      shouldSkipPersistence(undefined, conflict.id) ||
      shouldSkipPersistence(undefined, conflict.entityId)
    ) {
      console.log(
        `🎭 [ConflictsStorage] Skipping conflict persistence in demo mode: ${conflict.id}`
      );
      return;
    }

    const db = await getDatabase();
    const tx = db.transaction(['syncConflicts'], 'readwrite');
    await tx.objectStore('syncConflicts').put(conflict);
    await tx.done;
    console.log(
      `📋 [ConflictsStorage] Saved conflict: ${conflict.id} (${conflict.entityType}:${conflict.entityId})`
    );
  }

  /** Get a specific conflict by ID */
  static async getConflict(
    conflictId: string
  ): Promise<SyncConflict | undefined> {
    const db = await getDatabase();
    const conflict = await db.get('syncConflicts', conflictId);
    console.log(
      `📋 [ConflictsStorage] Retrieved conflict: ${conflictId} - ${
        conflict ? 'found' : 'not found'
      }`
    );
    return conflict;
  }

  /** Get all sync conflicts */
  static async getAllConflicts(): Promise<SyncConflict[]> {
    const db = await getDatabase();
    const conflicts = await db.getAll('syncConflicts');
    console.log(
      `📋 [ConflictsStorage] Retrieved ${conflicts.length} total conflicts`
    );
    return conflicts;
  }

  /** Get conflicts by entity type */
  static async getConflictsByEntityType(
    entityType: string
  ): Promise<SyncConflict[]> {
    const db = await getDatabase();
    const index = db
      .transaction(['syncConflicts'], 'readonly')
      .objectStore('syncConflicts')
      .index('entityType');
    const conflicts = await index.getAll(entityType);
    console.log(
      `📋 [ConflictsStorage] Retrieved ${conflicts.length} conflicts for entity type: ${entityType}`
    );
    return conflicts;
  }

  /** Delete a specific conflict */
  static async deleteConflict(conflictId: string): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction(['syncConflicts'], 'readwrite');
    await tx.objectStore('syncConflicts').delete(conflictId);
    await tx.done;
    console.log(`📋 [ConflictsStorage] Deleted conflict: ${conflictId}`);
  }

  /** Clear all conflicts */
  static async clearAllConflicts(): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction(['syncConflicts'], 'readwrite');
    await tx.objectStore('syncConflicts').clear();
    await tx.done;
    console.log('📋 [ConflictsStorage] Cleared all conflicts');
  }

  /** Clear demo conflicts based on patterns */
  static async clearDemoConflicts(): Promise<number> {
    const db = await getDatabase();
    const tx = db.transaction(['syncConflicts'], 'readwrite');
    const store = tx.objectStore('syncConflicts');

    // Get all conflicts
    const allConflicts = await store.getAll();

    // Filter for demo-related conflicts
    const demoConflicts = allConflicts.filter((conflict: SyncConflict) => {
      // Sync service demo conflicts
      const isSyncServiceDemo =
        conflict.id.startsWith('demo-conflict-') ||
        conflict.entityId.startsWith('demo-');

      // Redux demo data conflicts (simple patterns like conflict-1, person-1, item-123)
      const isReduxDemo =
        /^conflict-\d+$/.test(conflict.id) ||
        /^(person|item)-\d+$/.test(conflict.entityId);

      return isSyncServiceDemo || isReduxDemo;
    });

    // Delete demo conflicts
    for (const conflict of demoConflicts) {
      await store.delete(conflict.id);
    }

    await tx.done;

    console.log(
      `📋 [ConflictsStorage] Cleared ${demoConflicts.length} demo conflicts from IndexedDB`
    );
    return demoConflicts.length;
  }
}

import type { TripRule } from '@packing-list/model';
import { getDatabase } from './database.js';

export class TripRulesStorage {
  /** Save or update a trip rule link */
  static async saveTripRule(link: TripRule): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction(['tripDefaultItemRules'], 'readwrite');
    await tx.objectStore('tripDefaultItemRules').put(link);
    await tx.done;
    console.log(`[TripRulesStorage] Saved trip rule link: ${link.id}`);
  }

  /** Soft delete a trip rule link */
  static async deleteTripRule(id: string): Promise<void> {
    const db = await getDatabase();
    const store = db
      .transaction(['tripDefaultItemRules'], 'readwrite')
      .objectStore('tripDefaultItemRules');
    const link = await store.get(id);
    if (link) {
      link.isDeleted = true;
      link.updatedAt = new Date().toISOString();
      await store.put(link);
    }
    console.log(`[TripRulesStorage] Deleted trip rule link: ${id}`);
  }

  /** Get all rule links for a trip */
  static async getTripRules(tripId: string): Promise<TripRule[]> {
    const db = await getDatabase();
    const index = db
      .transaction(['tripDefaultItemRules'], 'readonly')
      .objectStore('tripDefaultItemRules')
      .index('tripId');
    const links = await index.getAll(tripId);
    return links.filter((l) => !l.isDeleted);
  }
}

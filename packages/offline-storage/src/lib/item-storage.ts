import type { TripItem } from '@packing-list/model';
import { getDatabase } from './database.js';

export class ItemStorage {
  /** Save or update a trip item */
  static async saveItem(item: TripItem): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction(['tripItems'], 'readwrite');
    await tx.objectStore('tripItems').put(item);
    await tx.done;
    console.log(`[ItemStorage] Saved item: ${item.id}`);
  }

  /** Soft delete an item */
  static async deleteItem(itemId: string): Promise<void> {
    const db = await getDatabase();
    const store = db.transaction(['tripItems'], 'readwrite').objectStore('tripItems');
    const item = await store.get(itemId);
    if (item) {
      item.isDeleted = true;
      item.updatedAt = new Date().toISOString();
      item.version += 1;
      await store.put(item);
    }
    console.log(`[ItemStorage] Deleted item: ${itemId}`);
  }

  /** Get all items for a specific trip */
  static async getTripItems(tripId: string): Promise<TripItem[]> {
    const db = await getDatabase();
    const index = db
      .transaction(['tripItems'], 'readonly')
      .objectStore('tripItems')
      .index('tripId');
    const items = await index.getAll(tripId);
    console.log(
      `[ItemStorage] Retrieved ${items.length} items for trip: ${tripId}`
    );
    return items.filter((i) => !i.isDeleted);
  }
}

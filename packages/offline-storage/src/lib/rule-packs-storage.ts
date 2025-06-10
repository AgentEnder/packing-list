import type { RulePack } from '@packing-list/model';
import { getDatabase } from './database.js';

interface StorageEntity {
  isDeleted?: boolean;
  updatedAt?: string;
}

export class RulePacksStorage {
  /** Save or update a rule pack */
  static async saveRulePack(rulePack: RulePack): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction(['rulePacks'], 'readwrite');
    await tx.objectStore('rulePacks').put(rulePack);
    await tx.done;
    console.log(`[RulePacksStorage] Saved rule pack: ${rulePack.id}`);
  }

  /** Soft delete a rule pack */
  static async deleteRulePack(packId: string): Promise<void> {
    const db = await getDatabase();
    const store = db
      .transaction(['rulePacks'], 'readwrite')
      .objectStore('rulePacks');
    const pack = await store.get(packId);
    if (pack) {
      // Mark as deleted (assuming the model supports this)
      (pack as RulePack & StorageEntity).isDeleted = true;
      (pack as RulePack & StorageEntity).updatedAt = new Date().toISOString();
      await store.put(pack);
    }
    console.log(`[RulePacksStorage] Deleted rule pack: ${packId}`);
  }

  /** Get all rule packs */
  static async getAllRulePacks(): Promise<RulePack[]> {
    const db = await getDatabase();
    const store = db
      .transaction(['rulePacks'], 'readonly')
      .objectStore('rulePacks');
    const packs = await store.getAll();
    console.log(`[RulePacksStorage] Retrieved ${packs.length} rule packs`);
    return packs.filter(
      (pack) => !(pack as RulePack & StorageEntity).isDeleted
    );
  }

  /** Get rule packs by category */
  static async getRulePacksByCategory(category: string): Promise<RulePack[]> {
    const db = await getDatabase();
    const index = db
      .transaction(['rulePacks'], 'readonly')
      .objectStore('rulePacks')
      .index('metadata.category');
    const packs = await index.getAll(category);
    console.log(
      `[RulePacksStorage] Retrieved ${packs.length} rule packs for category: ${category}`
    );
    return packs.filter(
      (pack) => !(pack as RulePack & StorageEntity).isDeleted
    );
  }

  /** Get rule packs by tag */
  static async getRulePacksByTag(tag: string): Promise<RulePack[]> {
    const db = await getDatabase();
    const index = db
      .transaction(['rulePacks'], 'readonly')
      .objectStore('rulePacks')
      .index('metadata.tags');
    const packs = await index.getAll(tag);
    console.log(
      `[RulePacksStorage] Retrieved ${packs.length} rule packs with tag: ${tag}`
    );
    return packs.filter(
      (pack) => !(pack as RulePack & StorageEntity).isDeleted
    );
  }

  /** Get a specific rule pack */
  static async getRulePack(packId: string): Promise<RulePack | undefined> {
    const db = await getDatabase();
    const store = db
      .transaction(['rulePacks'], 'readonly')
      .objectStore('rulePacks');
    const pack = await store.get(packId);
    console.log(`[RulePacksStorage] Retrieved rule pack: ${packId}`);
    return pack && !(pack as RulePack & StorageEntity).isDeleted
      ? pack
      : undefined;
  }
}

import type { DefaultItemRule } from '@packing-list/model';
import { getDatabase } from './database.js';

interface StorageEntity {
  isDeleted?: boolean;
  updatedAt?: string;
}

export class DefaultItemRulesStorage {
  /** Save or update a default item rule */
  static async saveDefaultItemRule(rule: DefaultItemRule): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction(['defaultItemRules'], 'readwrite');
    await tx.objectStore('defaultItemRules').put(rule);
    await tx.done;
    console.log(
      `[DefaultItemRulesStorage] Saved default item rule: ${rule.id}`
    );
  }

  /** Soft delete a default item rule */
  static async deleteDefaultItemRule(ruleId: string): Promise<void> {
    const db = await getDatabase();
    const store = db
      .transaction(['defaultItemRules'], 'readwrite')
      .objectStore('defaultItemRules');
    const rule = await store.get(ruleId);
    if (rule) {
      // Mark as deleted (assuming the model supports this)
      (rule as DefaultItemRule & StorageEntity).isDeleted = true;
      (rule as DefaultItemRule & StorageEntity).updatedAt =
        new Date().toISOString();
      await store.put(rule);
    }
    console.log(
      `[DefaultItemRulesStorage] Deleted default item rule: ${ruleId}`
    );
  }

  /** Get all default item rules */
  static async getAllDefaultItemRules(): Promise<DefaultItemRule[]> {
    const db = await getDatabase();
    const store = db
      .transaction(['defaultItemRules'], 'readonly')
      .objectStore('defaultItemRules');
    const rules = await store.getAll();
    console.log(
      `[DefaultItemRulesStorage] Retrieved ${rules.length} default item rules`
    );
    return rules.filter(
      (rule) => !(rule as DefaultItemRule & StorageEntity).isDeleted
    );
  }

  /** Get default item rules by category */
  static async getDefaultItemRulesByCategory(
    categoryId: string
  ): Promise<DefaultItemRule[]> {
    const db = await getDatabase();
    const index = db
      .transaction(['defaultItemRules'], 'readonly')
      .objectStore('defaultItemRules')
      .index('categoryId');
    const rules = await index.getAll(categoryId);
    console.log(
      `[DefaultItemRulesStorage] Retrieved ${rules.length} default item rules for category: ${categoryId}`
    );
    return rules.filter(
      (rule) => !(rule as DefaultItemRule & StorageEntity).isDeleted
    );
  }

  /** Get default item rules by rule pack ID */
  static async getDefaultItemRulesByPackId(
    packId: string
  ): Promise<DefaultItemRule[]> {
    const db = await getDatabase();
    const index = db
      .transaction(['defaultItemRules'], 'readonly')
      .objectStore('defaultItemRules')
      .index('packIds');
    const rules = await index.getAll(packId);
    console.log(
      `[DefaultItemRulesStorage] Retrieved ${rules.length} default item rules for pack: ${packId}`
    );
    return rules.filter(
      (rule) => !(rule as DefaultItemRule & StorageEntity).isDeleted
    );
  }

  /** Get a specific default item rule */
  static async getDefaultItemRule(
    ruleId: string
  ): Promise<DefaultItemRule | undefined> {
    const db = await getDatabase();
    const store = db
      .transaction(['defaultItemRules'], 'readonly')
      .objectStore('defaultItemRules');
    const rule = await store.get(ruleId);
    console.log(
      `[DefaultItemRulesStorage] Retrieved default item rule: ${ruleId}`
    );
    return rule && !(rule as DefaultItemRule & StorageEntity).isDeleted
      ? rule
      : undefined;
  }
}

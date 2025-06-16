import type { RuleOverride } from '@packing-list/model';
import { getDatabase } from './database.js';

export class RuleOverrideStorage {
  /** Save or update a rule override */
  static async saveRuleOverride(ruleOverride: RuleOverride): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction(['tripRuleOverrides'], 'readwrite');
    await tx.objectStore('tripRuleOverrides').put(ruleOverride);
    await tx.done;
    console.log(
      `[RuleOverrideStorage] Saved rule override: ${ruleOverride.ruleId} for trip ${ruleOverride.tripId}`
    );
  }

  /** Remove a rule override */
  // static async deleteRuleOverride(
  //   tripId: string,
  //   ruleId: string,
  //   personId?: string,
  //   dayIndex?: number
  // ): Promise<void> {
  //   const db = await getDatabase();
  //   const key = [tripId, ruleId, personId ?? null, dayIndex ?? null];
  //   const tx = db.transaction(['tripRuleOverrides'], 'readwrite');
  //   await tx.objectStore('tripRuleOverrides').delete(key);
  //   await tx.done;
  //   console.log(
  //     `[RuleOverrideStorage] Deleted rule override: ${ruleId} for trip ${tripId}`
  //   );
  // }

  /** Get all rule overrides for a specific trip */
  static async getTripRuleOverrides(tripId: string): Promise<RuleOverride[]> {
    const db = await getDatabase();
    const index = db
      .transaction(['tripRuleOverrides'], 'readonly')
      .objectStore('tripRuleOverrides')
      .index('tripId');
    const overrides = await index.getAll(tripId);
    console.log(
      `[RuleOverrideStorage] Retrieved ${overrides.length} rule overrides for trip: ${tripId}`
    );
    return overrides;
  }

  /** Get a specific rule override */
  // static async getRuleOverride(
  //   tripId: string,
  //   ruleId: string,
  //   personId?: string,
  //   dayIndex?: number
  // ): Promise<RuleOverride | undefined> {
  //   const db = await getDatabase();
  //   const key = [tripId, ruleId, personId ?? null, dayIndex ?? null];
  //   const store = db
  //     .transaction(['tripRuleOverrides'], 'readonly')
  //     .objectStore('tripRuleOverrides');
  //   const override = await store.get(key);
  //   console.log(
  //     `[RuleOverrideStorage] Retrieved rule override: ${ruleId} for trip ${tripId}`
  //   );
  //   return override;
  // }
}

import type { TripRule, DefaultItemRule } from '@packing-list/model';
import { getDatabase } from './database.js';

export class TripRuleStorage {
  /**
   * Save a trip rule association
   */
  static async saveTripRule(tripRule: TripRule): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction(['tripDefaultItemRules'], 'readwrite');
    const store = tx.objectStore('tripDefaultItemRules');

    await store.put(tripRule);
    await tx.done;

    console.log(
      `💾 [TripRuleStorage] Saved trip rule association: trip ${tripRule.tripId} -> rule ${tripRule.ruleId}`
    );
  }

  /**
   * Get all trip rule associations for a specific trip
   */
  static async getTripRules(tripId: string): Promise<TripRule[]> {
    const db = await getDatabase();
    const tx = db.transaction(['tripDefaultItemRules'], 'readonly');
    const store = tx.objectStore('tripDefaultItemRules');
    const index = store.index('tripId');

    const tripRules = await index.getAll(tripId);
    const activeTripRules = tripRules.filter((rule) => !rule.isDeleted);

    console.log(
      `🔍 [TripRuleStorage] Retrieved ${activeTripRules.length} active trip rules for trip: ${tripId}`
    );
    return activeTripRules;
  }

  /**
   * Get trip rules with full rule details for a specific trip
   */
  static async getTripRulesWithDetails(
    tripId: string
  ): Promise<DefaultItemRule[]> {
    const db = await getDatabase();
    const tx = db.transaction(
      ['tripDefaultItemRules', 'defaultItemRules'],
      'readonly'
    );

    // Get trip rule associations
    const tripRulesStore = tx.objectStore('tripDefaultItemRules');
    const tripRulesIndex = tripRulesStore.index('tripId');
    const tripRules = await tripRulesIndex.getAll(tripId);
    const activeTripRules = tripRules.filter((rule) => !rule.isDeleted);

    // Get full rule details
    const rulesStore = tx.objectStore('defaultItemRules');
    const fullRules: DefaultItemRule[] = [];

    for (const tripRule of activeTripRules) {
      const fullRule = await rulesStore.get(tripRule.ruleId);
      if (fullRule) {
        fullRules.push(fullRule);
      }
    }

    console.log(
      `🔍 [TripRuleStorage] Retrieved ${fullRules.length} full rules for trip: ${tripId}`
    );
    return fullRules;
  }

  /**
   * Delete a trip rule association (soft delete)
   */
  static async deleteTripRule(tripId: string, ruleId: string): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction(['tripDefaultItemRules'], 'readwrite');
    const store = tx.objectStore('tripDefaultItemRules');
    const index = store.index('tripId');

    // Find the trip rule association
    const tripRules = await index.getAll(tripId);
    const tripRule = tripRules.find(
      (rule) => rule.ruleId === ruleId && !rule.isDeleted
    );

    if (tripRule) {
      tripRule.isDeleted = true;
      tripRule.updatedAt = new Date().toISOString();
      tripRule.version += 1;
      await store.put(tripRule);
      await tx.done;

      console.log(
        `🗑️ [TripRuleStorage] Soft deleted trip rule: trip ${tripId} -> rule ${ruleId}`
      );
    }
  }

  /**
   * Hard delete all trip rule associations for a trip
   */
  static async hardDeleteTripRules(tripId: string): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction(['tripDefaultItemRules'], 'readwrite');
    const store = tx.objectStore('tripDefaultItemRules');
    const index = store.index('tripId');

    const tripRules = await index.getAll(tripId);
    for (const tripRule of tripRules) {
      await store.delete(tripRule.id);
    }
    await tx.done;

    console.log(
      `🗑️ [TripRuleStorage] Hard deleted all trip rules for trip: ${tripId}`
    );
  }
}

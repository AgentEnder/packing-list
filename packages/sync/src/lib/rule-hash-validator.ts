import type { TripItem } from '@packing-list/model';
import { DefaultItemRulesStorage } from '@packing-list/offline-storage';
import { calculateRuleHash } from '@packing-list/shared-utils';

/**
 * Validates and fixes rule hashes for items pulled from remote database
 * This ensures rule hash consistency when items were synced without proper hashes
 */
export async function validateAndFixRuleHash(
  item: TripItem
): Promise<TripItem> {
  // If item has no ruleId, it's a manual item - no hash needed
  if (!item.ruleId) {
    return { ...item, ruleHash: undefined };
  }

  // If item has both ruleId and ruleHash, assume it's correct for now
  if (item.ruleHash && item.ruleHash.trim() !== '') {
    return item;
  }

  console.log(
    `🔧 [RULE HASH] Recalculating missing rule hash for item ${item.id}, ruleId: ${item.ruleId}`
  );

  try {
    // Get the rule definition from storage
    const rule = await DefaultItemRulesStorage.getDefaultItemRule(item.ruleId);

    if (!rule) {
      console.warn(
        `⚠️ [RULE HASH] Rule ${item.ruleId} not found in storage for item ${item.id}`
      );
      // Keep the ruleId but clear the hash to indicate it's outdated
      return { ...item, ruleHash: '' };
    }

    // Recalculate the rule hash
    const recalculatedHash = calculateRuleHash(rule);
    console.log(
      `✅ [RULE HASH] Recalculated hash for item ${item.id}: ${recalculatedHash}`
    );

    return { ...item, ruleHash: recalculatedHash };
  } catch (error) {
    console.error(
      `❌ [RULE HASH] Failed to recalculate hash for item ${item.id}:`,
      error
    );
    // Return item with empty hash to indicate the hash is invalid
    return { ...item, ruleHash: '' };
  }
}

/**
 * Batch validate and fix rule hashes for multiple items
 */
export async function validateAndFixRuleHashes(
  items: TripItem[]
): Promise<TripItem[]> {
  const fixedItems: TripItem[] = [];

  for (const item of items) {
    const fixedItem = await validateAndFixRuleHash(item);
    fixedItems.push(fixedItem);
  }

  return fixedItems;
}

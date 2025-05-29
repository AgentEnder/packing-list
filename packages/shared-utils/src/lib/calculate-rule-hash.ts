import { DefaultItemRule } from '@packing-list/model';

export function calculateRuleHash(rule: DefaultItemRule): string {
  // Create a deterministic string representation of the rule
  const ruleString = JSON.stringify({
    name: rule.name,
    calculation: rule.calculation,
    conditions: rule.conditions,
  });

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < ruleString.length; i++) {
    const char = ruleString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return hash.toString(36); // Convert to base36 for shorter string
}

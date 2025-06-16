import { Calculation } from './Calculation.js';
import { Condition } from './Condition.js';

export type PackRuleRef = {
  packId: string;
  ruleId: string;
};

export type DefaultItemRule = {
  id: string;
  originalRuleId: string; // Tracks the original rule ID when this rule is derived from a pack rule
  name: string;
  calculation: Calculation;
  conditions?: Condition[];
  notes?: string; // Optional notes explaining the rule
  categoryId?: string; // Optional ID of the category this rule belongs to
  subcategoryId?: string; // Optional subcategory ID for more specific categorization
  packIds?: PackRuleRef[]; // References to rule packs this rule belongs to or was derived from
};

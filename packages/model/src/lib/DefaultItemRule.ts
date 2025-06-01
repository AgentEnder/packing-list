import { Calculation } from './Calculation.js';
import { Condition } from './Condition.js';

export type DefaultItemRule = {
  id: string;
  name: string;
  calculation: Calculation;
  conditions?: Condition[];
  notes?: string; // Optional notes explaining the rule
  categoryId?: string; // Optional ID of the category this rule belongs to
  subcategoryId?: string; // Optional subcategory ID for more specific categorization
  packIds?: string[]; // IDs of the rule packs this rule belongs to, managed by the store
};

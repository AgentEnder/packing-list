import { DefaultItemRule } from './DefaultItemRule.js';
import { Category } from './Category.js';

export interface RulePack {
  id: string;
  name: string;
  description: string;
  rules: DefaultItemRule[];
  categories?: Category[]; // Custom categories specific to this rule pack
  primaryCategoryId?: string; // Main category for the entire pack (e.g., "Beach", "Camping")
}

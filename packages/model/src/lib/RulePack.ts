import { DefaultItemRule } from './DefaultItemRule.js';
import { Category } from './Category.js';

export type RulePackVisibility = 'private' | 'public';

export interface RulePackMetadata {
  created: string; // ISO date string
  modified: string; // ISO date string
  isBuiltIn: boolean;
  isShared: boolean;
  visibility: RulePackVisibility;
  tags: string[];
  category: string;
  version: string;
}

export interface RulePackStats {
  usageCount: number;
  rating: number;
  reviewCount: number;
}

export interface RulePackAuthor {
  id: string;
  name: string;
}

export interface RulePack {
  id: string;
  name: string;
  description: string;
  author: RulePackAuthor;
  metadata: RulePackMetadata;
  stats: RulePackStats;
  rules: DefaultItemRule[];
  categories?: Category[]; // Custom categories specific to this rule pack
  primaryCategoryId?: string; // Main category for the entire pack (e.g., "Beach", "Camping")
  icon?: string; // Optional icon identifier
  color?: string; // Optional color code
}

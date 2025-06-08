/**
 * Represents a person on a trip (family member, travel companion, etc.)
 * Gender is used for packing rule conditions (e.g., clothing requirements)
 */
export type Person = {
  id: string;
  tripId: string;
  name: string;
  age?: number; // 0-150, used for age-specific packing rules
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say'; // Used for clothing and gender-specific items
  settings?: Record<string, unknown>;

  // Sync tracking
  createdAt: string;
  updatedAt: string;
  version: number;
  isDeleted: boolean;
};

export type TripItem = {
  id: string;
  tripId: string;
  name: string;
  category?: string;
  quantity: number;
  packed: boolean;
  notes?: string;
  personId?: string | null;
  dayIndex?: number; // Which day this item is for (0-based index)

  // Rule tracking - essential for matching items during hydration
  ruleId?: string; // ID of the rule that generated this item
  ruleHash?: string; // Hash of the rule for matching calculated items

  // Audit tracking
  lastModifiedBy?: string;

  // Sync tracking
  createdAt: string;
  updatedAt: string;
  version: number;
  isDeleted: boolean;
};

export type PackingListItem = {
  id: string;
  name: string;
  itemName: string;
  ruleId: string;
  ruleHash: string; // Hash of the rule configuration when this item was created
  isPacked: boolean;
  isOverridden: boolean;
  // Each item can be associated with at most one day and one person
  dayIndex?: number; // Optional - if not set, this is a general item
  personId?: string; // Optional - if not set, this is a general item
  personName?: string; // Name of the person this item is for (if personId is set)
  notes?: string; // Optional notes from the rule
  // Additional metadata for multi-day ranges
  dayStart?: number; // Start of a day range (0-based)
  dayEnd?: number; // End of a day range (0-based)
  isExtra: boolean; // Whether this is an extra item
  quantity: number; // How many of this item are needed
  categoryId?: string; // Optional ID of the category this item belongs to (inherited from rule)
  subcategoryId?: string; // Optional subcategory ID (inherited from rule)
};

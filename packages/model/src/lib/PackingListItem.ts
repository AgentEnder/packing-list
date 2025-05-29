export type PackingListItem = {
  id: string;
  name: string;
  totalCount: number; // Total quantity needed for all applicable days/people
  perUnitCount: number; // Quantity needed per day or per person
  ruleId: string;
  ruleHash: string; // Hash of the rule configuration when this item was created
  isPacked: boolean;
  isOverridden: boolean;
  applicableDays: number[];
  applicablePersons: string[];
  notes?: string; // Optional notes from the rule
};

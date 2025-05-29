export type PackingListItem = {
  id: string;
  name: string;
  count: number;
  ruleId: string;
  ruleHash: string; // Hash of the rule configuration when this item was created
  isPacked: boolean;
  isOverridden: boolean;
  applicableDays: number[];
  applicablePersons: string[];
  notes?: string; // Optional notes from the rule
};

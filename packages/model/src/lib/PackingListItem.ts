export type PackingListItem = {
  id: string;
  name: string;
  count: number;
  ruleId: string;
  isPacked: boolean;
  isOverridden: boolean;
  applicableDays: number[];
  applicablePersons: string[];
};

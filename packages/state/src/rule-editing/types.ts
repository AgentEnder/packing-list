import { PersonCondition, DayCondition } from '@packing-list/model';

export type NewCondition = PersonCondition | DayCondition;

export type RuleEditingState = {
  editingRuleId: string | null;
};

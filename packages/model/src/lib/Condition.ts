import { Item } from './Item.js';

export type ConditionValue = string | number | boolean | Item[];

export type Condition = {
  type: 'person' | 'day';
  field: string;
  operator: '==' | '>' | '<' | '>=' | '<=';
  value: ConditionValue;
  notes?: string;
};

export type PersonCondition = Condition & {
  type: 'person';
};

export type DayCondition = Condition & {
  type: 'day';
};

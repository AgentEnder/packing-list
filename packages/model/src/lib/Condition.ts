import { Day } from './Day.js';
import { Person } from './Person.js';

export type ConditionValue = string | number | boolean;

export type Operator = '==' | '>' | '<' | '>=' | '<=';

export type Condition = {
  type: 'person' | 'day';
  field: string;
  operator: Operator;
  value: ConditionValue;
  notes?: string;
};

export type PersonCondition = Condition & {
  type: 'person';
  field: keyof {
    [K in keyof Person as Person[K] extends ConditionValue
      ? K
      : never]: Person[K];
  };
};

export type DayCondition = Condition & {
  type: 'day';
  field: keyof {
    [K in keyof Day as Day[K] extends ConditionValue ? K : never]: Day[K];
  };
};

import { Day } from './Day.js';
import { Person } from './Person.js';

export type ConditionValue = string | number | boolean;

export type Operator = '==' | '>' | '<' | '>=' | '<=';

export type BaseCondition = {
  type: 'person' | 'day';
  operator: Operator;
  notes?: string;
};

type PersonFields = keyof Pick<Person, 'age' | 'gender'>;

export type PersonCondition<T extends PersonFields = PersonFields> =
  BaseCondition & {
    type: 'person';
    field: T;
    value: Person[T];
  };

type DayFields = keyof Pick<Day, 'expectedClimate'>;

export type DayCondition<T extends DayFields = DayFields> = BaseCondition & {
  type: 'day';
  field: T;
  value: Day[T];
};

export type Condition = PersonCondition | DayCondition;

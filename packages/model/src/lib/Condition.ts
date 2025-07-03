import { Day } from './Day.js';
import { Person } from './Person.js';

export type ConditionValue = string | number | boolean | ConditionValue[];

export type Operator = '==' | '>' | '<' | '>=' | '<=' | 'in';

export type BaseCondition = {
  type: 'person' | 'day';
  operator: Operator;
  notes?: string;
};

export type PersonFields = keyof Pick<Person, 'age' | 'gender' | 'name'>;

// Special handling for name field which can be a string array
export type PersonNameCondition = BaseCondition & {
  type: 'person';
  field: 'name';
  operator: 'in';
  value: string[];
};

export type PersonOtherCondition<
  T extends Exclude<PersonFields, 'name'> = Exclude<PersonFields, 'name'>
> = BaseCondition & {
  type: 'person';
  field: T;
  operator: Exclude<Operator, 'in'>;
  value: Person[T];
};

export type PersonCondition = PersonNameCondition | PersonOtherCondition;

export type DayFields = keyof Pick<Day, 'expectedClimate' | 'location'>;

export type DayCondition<T extends DayFields = DayFields> = BaseCondition & {
  type: 'day';
  field: T;
  value: Day[T];
};

export type Condition = PersonCondition | DayCondition;

import { Day } from './Day.js';
import { Person } from './Person.js';

export type ConditionValue = string | number | boolean | string[];

export type Operator = '==' | '>' | '<' | '>=' | '<=' | 'in';

export type BaseCondition = {
  type: 'person' | 'day';
  operator: Operator;
  notes?: string;
};

type PersonFields = keyof Pick<Person, 'age' | 'gender' | 'name'>;

// Special handling for name field which can be a string array
type PersonNameCondition = BaseCondition & {
  type: 'person';
  field: 'name';
  operator: 'in';
  value: string[];
};

type PersonOtherCondition<
  T extends Exclude<PersonFields, 'name'> = Exclude<PersonFields, 'name'>
> = BaseCondition & {
  type: 'person';
  field: T;
  operator: Exclude<Operator, 'in'>;
  value: Person[T];
};

export type PersonCondition = PersonNameCondition | PersonOtherCondition;

type DayFields = keyof Pick<Day, 'expectedClimate' | 'location'>;

export type DayCondition<T extends DayFields = DayFields> = BaseCondition & {
  type: 'day';
  field: T;
  value: Day[T];
};

export type Condition = PersonCondition | DayCondition;

import { PersonCondition, DayCondition } from './Condition.js';
import { Calculation } from './Calculation.js';

export type DefaultItemRule = {
  id: string;
  name: string;
  conditions?: (PersonCondition | DayCondition)[];
  calculation: Calculation;
};

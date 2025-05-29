import { Calculation } from './Calculation.js';
import { Condition } from './Condition.js';

export type DefaultItemRule = {
  id: string;
  name: string;
  calculation: Calculation;
  conditions?: Condition[];
  notes?: string; // Optional notes explaining the rule
};

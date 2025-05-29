import { Calculation } from './Calculation.js';

export type Condition = {
  type: 'person' | 'day';
  field: string;
  operator: '==' | '>' | '<' | '>=' | '<=';
  value: any;
  notes?: string; // Optional notes explaining the condition
};

export type DefaultItemRule = {
  id: string;
  name: string;
  calculation: Calculation;
  conditions?: Condition[];
  notes?: string; // Optional notes explaining the rule
};

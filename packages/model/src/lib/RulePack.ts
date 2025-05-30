import { DefaultItemRule } from './DefaultItemRule.js';

export interface RulePack {
  id: string;
  name: string;
  description: string;
  rules: DefaultItemRule[];
}

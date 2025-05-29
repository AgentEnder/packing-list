import { Item } from './Item.js';

export type Day = {
  location: string;
  expectedClimate: string;
  items: Item[];
  travel: boolean;
  date: number;
};

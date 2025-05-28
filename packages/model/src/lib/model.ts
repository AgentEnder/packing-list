export type Person = {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | string;
};

export type ItemOverride = {
  id: string;
  name: string;
  quantity: number;
};

export type PersonCondition = {
  type: 'person';
  field: 'age' | 'gender';
  operator: '<' | '>' | '==' | '>=' | '<=';
  value: number | string;
};

export type DayCondition = {
  type: 'day';
  field: 'location' | 'expectedClimate';
  operator: '==' | '!=';
  value: string;
};

export type Calculation = {
  baseQuantity: number;
  perPerson?: boolean;
  perDay?: boolean;
  extraItems?: number;
};

export type DefaultItemRule = {
  id: string;
  name: string;
  conditions?: (PersonCondition | DayCondition)[];
  calculation: Calculation;
};

export type TripEvent = {
  id: string;
  type: string;
  date: string;
  location?: string;
  notes?: string;
};

export type Trip = {
  days: Day[];
  tripEvents?: TripEvent[];
};

export type Day = {
  location: string;
  expectedClimate: string;
  items: Item[];
};

export type Item = {
  name: string;
  quantity: number;
};

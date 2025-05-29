export type Condition = {
  type: 'person' | 'day';
  field: string;
  operator: '==' | '>' | '<' | '>=' | '<=';
  value: any;
  notes?: string;
};

export type PersonCondition = Condition & {
  type: 'person';
};

export type DayCondition = Condition & {
  type: 'day';
};

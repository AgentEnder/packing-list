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

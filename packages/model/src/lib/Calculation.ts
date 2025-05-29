export type DayCalculation = {
  every: number; // e.g., 1 for every day, 3 for every 3 days
  roundUp: boolean; // whether to round up when dividing days
};

export type Calculation = {
  baseQuantity: number;
  perPerson?: boolean;
  perDay?: boolean;
  daysPattern?: DayCalculation; // new field for more complex day patterns
  extraItems?: {
    quantity: number;
    perPerson?: boolean;
    perDay?: boolean;
    daysPattern?: DayCalculation;
  };
};

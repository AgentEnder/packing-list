export type RuleOverride = {
  ruleId: string;
  tripId: string;
  personId?: string; // If null, applies to all people
  dayIndex?: number; // If null, applies to all days
  overrideCount?: number;
  isExcluded: boolean;
  lastModifiedBy?: string;
};

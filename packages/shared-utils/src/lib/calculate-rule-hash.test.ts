import { describe, it, expect } from 'vitest';
import { calculateRuleHash } from './calculate-rule-hash.js';
import type { DefaultItemRule } from '@packing-list/model';

describe('calculateRuleHash', () => {
  const baseRule: DefaultItemRule = {
    id: '1',
    originalRuleId: '1',
    name: 'Test',
    calculation: { baseQuantity: 1 },
  };

  it('produces stable hashes for identical rules', () => {
    const hash1 = calculateRuleHash(baseRule);
    const hash2 = calculateRuleHash({ ...baseRule });
    expect(hash1).toBe(hash2);
  });

  it('produces different hashes for different rules', () => {
    const otherRule: DefaultItemRule = {
      ...baseRule,
      name: 'Other',
    };
    const hash1 = calculateRuleHash(baseRule);
    const hash2 = calculateRuleHash(otherRule);
    expect(hash1).not.toBe(hash2);
  });
});

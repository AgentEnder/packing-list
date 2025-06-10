import { describe, it, expect } from 'vitest';
import { formatDate } from '../format-date.js';

describe('formatDate', () => {
  it('formats ISO dates consistently', () => {
    expect(formatDate('2024-01-01')).toBe('Jan 1, 2024');
    expect(formatDate('2024-12-31')).toBe('Dec 31, 2024');
  });
});

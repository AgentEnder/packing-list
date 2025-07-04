import { describe, it, expect } from 'vitest';
import { deepEqual } from './deep-equal.js';

describe('deepEqual', () => {
  it('handles objects with keys in different order', () => {
    const a = { foo: 1, bar: { baz: [1, 2, 3] } };
    const b = { bar: { baz: [1, 2, 3] }, foo: 1 };
    expect(deepEqual(a, b)).toBe(true);
  });

  it('detects unequal primitive values', () => {
    expect(deepEqual(1, 2)).toBe(false);
  });

  it('detects unequal nested objects', () => {
    const a = { foo: { bar: 1 } };
    const b = { foo: { bar: 2 } };
    expect(deepEqual(a, b)).toBe(false);
  });

  it('compares arrays by value', () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(deepEqual([1, 2], [2, 1])).toBe(false);
  });
});

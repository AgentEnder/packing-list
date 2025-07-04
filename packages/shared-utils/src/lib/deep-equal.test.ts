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

  it('handles null and undefined values', () => {
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(undefined, undefined)).toBe(true);
    expect(deepEqual(null, undefined)).toBe(false);
    expect(deepEqual(null, {})).toBe(false);
  });

  it('handles equal primitive values', () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual('hello', 'hello')).toBe(true);
    expect(deepEqual(true, true)).toBe(true);
  });

  it('handles empty collections', () => {
    expect(deepEqual({}, {})).toBe(true);
    expect(deepEqual([], [])).toBe(true);
    expect(deepEqual({}, [])).toBe(false);
  });

  it('handles mixed type comparisons', () => {
    expect(deepEqual({}, [])).toBe(false);
    expect(deepEqual([], {})).toBe(false);
    expect(deepEqual('1', 1)).toBe(false);
  });

  it('handles same reference equality', () => {
    const obj = { foo: 1 };
    expect(deepEqual(obj, obj)).toBe(true);
  });

  it('handles nested arrays', () => {
    const a = { arr: [[1, 2], [3, 4]] };
    const b = { arr: [[1, 2], [3, 4]] };
    expect(deepEqual(a, b)).toBe(true);
  });
});

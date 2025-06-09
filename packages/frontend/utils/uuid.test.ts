import { describe, expect, it } from 'vitest';
import { uuid } from './uuid';

describe('uuid utility', () => {
  it('generates sequential string IDs', () => {
    const id1 = uuid();
    const id2 = uuid();
    const id3 = uuid();

    expect(typeof id1).toBe('string');
    expect(typeof id2).toBe('string');
    expect(typeof id3).toBe('string');

    // Should be sequential
    expect(parseInt(id2)).toBe(parseInt(id1) + 1);
    expect(parseInt(id3)).toBe(parseInt(id2) + 1);
  });

  it('generates unique IDs on each call', () => {
    const ids = new Set();

    // Generate multiple IDs
    for (let i = 0; i < 100; i++) {
      ids.add(uuid());
    }

    // All should be unique
    expect(ids.size).toBe(100);
  });

  it('returns string representation of numbers', () => {
    const id = uuid();
    expect(id).toMatch(/^\d+$/); // Should be a string of digits
  });
});

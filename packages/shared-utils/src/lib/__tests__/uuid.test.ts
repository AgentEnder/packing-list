import { describe, expect, it } from 'vitest';
import { uuid } from '../uuid.js';

describe('uuid utility', () => {
  it('generates valid UUID v4 format', () => {
    const id = uuid();

    expect(typeof id).toBe('string');

    // Should match UUID v4 format (8-4-4-4-12 hexadecimal characters)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(id).toMatch(uuidRegex);

    // Should have correct length
    expect(id.length).toBe(36);

    // Should have dashes in correct positions
    expect(id[8]).toBe('-');
    expect(id[13]).toBe('-');
    expect(id[18]).toBe('-');
    expect(id[23]).toBe('-');

    // Should have version 4 indicator
    expect(id[14]).toBe('4');
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

  it('generates different IDs in sequence', () => {
    const id1 = uuid();
    const id2 = uuid();
    const id3 = uuid();

    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).not.toBe(id3);
  });
});

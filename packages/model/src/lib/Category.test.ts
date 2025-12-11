import { describe, it, expect } from 'vitest';
import {
  BUILT_IN_CATEGORIES,
  CLOTHING_SUBCATEGORIES,
  ESSENTIALS_SUBCATEGORIES,
  getAllCategories,
  getSubcategories,
} from './Category.js';

describe('getAllCategories', () => {
  it('includes all built-in and sub categories', () => {
    const all = getAllCategories();
    const expectedCount =
      BUILT_IN_CATEGORIES.length +
      CLOTHING_SUBCATEGORIES.length +
      ESSENTIALS_SUBCATEGORIES.length;

    expect(all).toHaveLength(expectedCount);
    BUILT_IN_CATEGORIES.forEach((c) => expect(all).toContainEqual(c));
    CLOTHING_SUBCATEGORIES.forEach((c) => expect(all).toContainEqual(c));
    ESSENTIALS_SUBCATEGORIES.forEach((c) => expect(all).toContainEqual(c));
  });

  it('contains unique ids', () => {
    const ids = getAllCategories().map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

describe('getSubcategories', () => {
  it('returns clothing subcategories', () => {
    expect(getSubcategories('clothing')).toEqual(CLOTHING_SUBCATEGORIES);
  });

  it('returns empty array for unknown category', () => {
    expect(getSubcategories('unknown')).toEqual([]);
  });
});

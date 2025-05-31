import { describe, it, expect } from 'vitest';
import { clearTripDataHandler } from '../clear-trip-data.js';
import { initialState } from '../../store.js';

describe('clearTripDataHandler', () => {
  it('should reset state to initial state', () => {
    const result = clearTripDataHandler();

    // Verify all properties are reset to initial state
    expect(result).toEqual(initialState);
    expect(result.people).toHaveLength(0);
    expect(result.trip.days).toHaveLength(0);
    expect(result.trip.tripEvents).toBeUndefined();
    expect(result.defaultItemRules).toHaveLength(0);
    expect(result.calculated.defaultItems).toHaveLength(0);
    expect(result.calculated.packingListItems).toHaveLength(0);
  });

  it('should handle clearing already empty state', () => {
    const result = clearTripDataHandler();
    expect(result).toEqual(initialState);
  });

  it('should preserve initial state structure', () => {
    const result = clearTripDataHandler();

    // Verify the structure matches initial state exactly
    expect(Object.keys(result)).toEqual(Object.keys(initialState));
    expect(Object.keys(result.packingListView)).toEqual(
      Object.keys(initialState.packingListView)
    );
    expect(Object.keys(result.calculated)).toEqual(
      Object.keys(initialState.calculated)
    );
  });

  it('should reset view state to defaults', () => {
    const result = clearTripDataHandler();

    expect(result.packingListView).toEqual(initialState.packingListView);
    expect(result.packingListView.filters.packed).toBe(true);
    expect(result.packingListView.filters.unpacked).toBe(true);
    expect(result.packingListView.filters.excluded).toBe(false);
    expect(result.packingListView.viewMode).toBe('by-day');
  });
});

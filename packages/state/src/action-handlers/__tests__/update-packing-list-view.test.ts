import { describe, it, expect } from 'vitest';
import { updatePackingListViewHandler } from '../update-packing-list-view.js';
import type { StoreType } from '../../store.js';
import type { PackingListViewState } from '@packing-list/model';

describe('updatePackingListViewHandler', () => {
  // Helper function to create a basic store state
  const createMockState = (
    viewState: Partial<PackingListViewState> = {}
  ): StoreType => ({
    defaultItemRules: [],
    people: [],
    trip: {
      id: 'test-trip',
      days: [],
    },
    ruleOverrides: [],
    rulePacks: [],
    packingListView: {
      filters: {
        packed: true,
        unpacked: true,
        excluded: false,
      },
      viewMode: 'by-day',
      ...viewState,
    },
    calculated: {
      defaultItems: [],
      packingListItems: [],
    },
  });

  it('should update view mode', () => {
    const initialState = createMockState();
    const result = updatePackingListViewHandler(initialState, {
      type: 'UPDATE_PACKING_LIST_VIEW',
      payload: {
        viewMode: 'by-person',
      },
    });

    expect(result.packingListView.viewMode).toBe('by-person');
    // Other properties should remain unchanged
    expect(result.packingListView.filters).toEqual(
      initialState.packingListView.filters
    );
  });

  it('should update filters', () => {
    const initialState = createMockState();
    const result = updatePackingListViewHandler(initialState, {
      type: 'UPDATE_PACKING_LIST_VIEW',
      payload: {
        filters: {
          packed: false,
          unpacked: true,
          excluded: true,
        },
      },
    });

    expect(result.packingListView.filters).toEqual({
      packed: false,
      unpacked: true,
      excluded: true,
    });
    // View mode should remain unchanged
    expect(result.packingListView.viewMode).toBe(
      initialState.packingListView.viewMode
    );
  });

  it('should handle partial filter updates', () => {
    const initialState = createMockState();
    const result = updatePackingListViewHandler(initialState, {
      type: 'UPDATE_PACKING_LIST_VIEW',
      payload: {
        filters: {
          ...initialState.packingListView.filters,
          packed: false,
        },
      },
    });

    expect(result.packingListView.filters).toEqual({
      packed: false,
      unpacked: true,
      excluded: false,
    });
  });

  it('should handle multiple property updates simultaneously', () => {
    const initialState = createMockState();
    const result = updatePackingListViewHandler(initialState, {
      type: 'UPDATE_PACKING_LIST_VIEW',
      payload: {
        viewMode: 'by-person',
        filters: {
          packed: false,
          unpacked: false,
          excluded: true,
        },
      },
    });

    expect(result.packingListView).toEqual({
      viewMode: 'by-person',
      filters: {
        packed: false,
        unpacked: false,
        excluded: true,
      },
    });
  });

  it('should preserve other state properties', () => {
    const initialState = createMockState();
    initialState.people = [
      { id: 'person1', name: 'Test Person', age: 30, gender: 'other' },
    ];

    const result = updatePackingListViewHandler(initialState, {
      type: 'UPDATE_PACKING_LIST_VIEW',
      payload: {
        viewMode: 'by-person',
      },
    });

    expect(result.people).toEqual(initialState.people);
    expect(result.defaultItemRules).toEqual(initialState.defaultItemRules);
    expect(result.trip).toEqual(initialState.trip);
    expect(result.calculated).toEqual(initialState.calculated);
  });
});

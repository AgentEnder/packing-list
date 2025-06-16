import { describe, it, expect } from 'vitest';
import { updatePackingListViewHandler } from '../update-packing-list-view.js';
import {
  createTestTripState,
  createTestPerson,
} from '../../__tests__/test-helpers.js';
import { selectPackingListView } from '../../selectors.js';

describe('updatePackingListViewHandler', () => {
  it('should update view mode', () => {
    const initialState = createTestTripState({});
    const result = updatePackingListViewHandler(initialState, {
      type: 'UPDATE_PACKING_LIST_VIEW',
      payload: {
        viewMode: 'by-person',
      },
    });

    const packingListView = selectPackingListView(result);
    expect(packingListView?.viewMode).toBe('by-person');
    // Other properties should remain unchanged
    expect(packingListView?.filters).toEqual({
      packed: true,
      unpacked: true,
      excluded: false,
    });
  });

  it('should update filters', () => {
    const initialState = createTestTripState({});
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

    const packingListView = selectPackingListView(result);
    expect(packingListView?.filters).toEqual({
      packed: false,
      unpacked: true,
      excluded: true,
    });
    // View mode should remain unchanged (default is 'by-day')
    expect(packingListView?.viewMode).toBe('by-day');
  });

  it('should handle partial filter updates', () => {
    const initialState = createTestTripState({});
    const initialPackingListView = selectPackingListView(initialState);

    const result = updatePackingListViewHandler(initialState, {
      type: 'UPDATE_PACKING_LIST_VIEW',
      payload: {
        filters: {
          ...initialPackingListView?.filters,
          packed: false,
        },
      },
    });

    const packingListView = selectPackingListView(result);
    expect(packingListView?.filters).toEqual({
      packed: false,
      unpacked: true,
      excluded: false,
    });
  });

  it('should handle multiple property updates simultaneously', () => {
    const initialState = createTestTripState({});
    const result = updatePackingListViewHandler(initialState, {
      type: 'UPDATE_PACKING_LIST_VIEW',
      payload: {
        viewMode: 'by-day',
        filters: {
          packed: false,
          unpacked: false,
          excluded: true,
        },
      },
    });

    const packingListView = selectPackingListView(result);
    expect(packingListView).toEqual({
      viewMode: 'by-day',
      filters: {
        packed: false,
        unpacked: false,
        excluded: true,
      },
    });
  });

  it('should preserve other state properties', () => {
    const person = createTestPerson({ id: 'person1', name: 'Test Person' });
    const initialState = createTestTripState({ people: [person] });

    const result = updatePackingListViewHandler(initialState, {
      type: 'UPDATE_PACKING_LIST_VIEW',
      payload: {
        viewMode: 'by-day',
      },
    });

    // Verify that other state properties are preserved
    expect(result.rulePacks).toEqual(initialState.rulePacks);
    expect(result.trips.summaries).toEqual(initialState.trips.summaries);
    expect(result.trips.selectedTripId).toEqual(
      initialState.trips.selectedTripId
    );

    // Verify the trip data is preserved except for the updated packing list view
    const selectedTripId = result.trips.selectedTripId;
    if (selectedTripId) {
      const resultTripData = result.trips.byId[selectedTripId];
      const initialTripData = initialState.trips.byId[selectedTripId];

      expect(resultTripData.people).toEqual(initialTripData.people);
      expect(resultTripData.trip).toEqual(initialTripData.trip);
      expect(resultTripData.calculated).toEqual(initialTripData.calculated);
    }
  });
});

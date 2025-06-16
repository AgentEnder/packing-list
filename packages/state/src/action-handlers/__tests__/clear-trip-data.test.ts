import { describe, it, expect } from 'vitest';
import { clearTripDataHandler } from '../clear-trip-data.js';
import { createTestTripState } from '../../__tests__/test-helpers.js';
import {
  selectPeople,
  selectCurrentTrip,
  selectPackingListView,
  selectCalculatedItems,
} from '../../selectors.js';

describe('clearTripDataHandler', () => {
  it('should clear selected trip data', () => {
    // Create a test state with some trip data
    const testState = createTestTripState({
      people: [
        {
          id: 'person-1',
          name: 'Test Person',
          age: 30,
          gender: 'male',
          tripId: 'trip-1',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          version: 1,
          isDeleted: false,
        },
      ],
    });

    // Add trip events to the trip data
    const tripId = testState.trips.selectedTripId!;
    testState.trips.byId[tripId].trip.tripEvents = [
      { id: 'event-1', type: 'leave_home', date: '2024-01-01' },
    ];

    const result = clearTripDataHandler(testState);

    // Verify trip data is cleared
    const people = selectPeople(result);
    const trip = selectCurrentTrip(result);
    const calculatedItems = selectCalculatedItems(result);

    expect(people).toHaveLength(0);
    expect(trip?.days).toHaveLength(0);
    expect(trip?.tripEvents).toHaveLength(0);
    expect(calculatedItems.defaultItems).toHaveLength(0);
    expect(calculatedItems.packingListItems).toHaveLength(0);
  });

  it('should handle clearing already empty state', () => {
    const emptyState = createTestTripState({});
    const result = clearTripDataHandler(emptyState);

    const people = selectPeople(result);
    const trip = selectCurrentTrip(result);

    expect(people).toHaveLength(0);
    expect(trip?.days).toHaveLength(0);
  });

  it('should preserve trip structure and other state', () => {
    const testState = createTestTripState({
      people: [
        {
          id: 'person-1',
          name: 'Test Person',
          age: 30,
          gender: 'male',
          tripId: 'trip-1',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          version: 1,
          isDeleted: false,
        },
      ],
    });

    const result = clearTripDataHandler(testState);

    // Verify the trip structure is preserved
    expect(result.trips.selectedTripId).toBe(testState.trips.selectedTripId);
    expect(result.trips.summaries).toEqual(testState.trips.summaries);
    expect(
      result.trips.byId[testState.trips.selectedTripId!].trip.defaultItemRules
    ).toEqual(
      testState.trips.byId[testState.trips.selectedTripId!].trip
        .defaultItemRules
    );
    expect(result.rulePacks).toEqual(testState.rulePacks);
    expect(result.ui).toEqual(testState.ui);
  });

  it('should reset view state to defaults', () => {
    const testState = createTestTripState({
      people: [
        {
          id: 'person-1',
          name: 'Test Person',
          age: 30,
          gender: 'male',
          tripId: 'trip-1',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          version: 1,
          isDeleted: false,
        },
      ],
    });

    // Modify the packing list view
    const tripId = testState.trips.selectedTripId!;
    testState.trips.byId[tripId].packingListView = {
      viewMode: 'by-person',
      filters: { packed: false, unpacked: false, excluded: true },
    };

    const result = clearTripDataHandler(testState);
    const packingListView = selectPackingListView(result);

    expect(packingListView?.viewMode).toBe('by-day');
    expect(packingListView?.filters.packed).toBe(true);
    expect(packingListView?.filters.unpacked).toBe(true);
    expect(packingListView?.filters.excluded).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import {
  updateTripSummaryHandler,
  createTripHandler,
} from '../trip-management.js';
import { createTestTripState } from '../../__tests__/test-helpers.js';
import { initialState } from '../../store.js';

describe('createTripHandler', () => {
  it('should create a new trip with correct title in both summary and trip data', () => {
    const state = { ...initialState };

    const action = {
      type: 'CREATE_TRIP' as const,
      payload: {
        tripId: 'new-trip-123',
        title: 'My Amazing Trip',
        description: 'A fantastic journey',
      },
    };

    const result = createTripHandler(state, action);

    // Check that the trip summary has the correct title
    expect(result.trips.summaries).toHaveLength(1);
    expect(result.trips.summaries[0].tripId).toBe('new-trip-123');
    expect(result.trips.summaries[0].title).toBe('My Amazing Trip');
    expect(result.trips.summaries[0].description).toBe('A fantastic journey');

    // Check that the trip data in Redux has the correct title
    expect(result.trips.byId['new-trip-123']).toBeDefined();
    expect(result.trips.byId['new-trip-123'].trip.title).toBe(
      'My Amazing Trip'
    );
    expect(result.trips.byId['new-trip-123'].trip.description).toBe(
      'A fantastic journey'
    );
    expect(result.trips.byId['new-trip-123'].trip.id).toBe('new-trip-123');

    // Check that the new trip is auto-selected
    expect(result.trips.selectedTripId).toBe('new-trip-123');
  });

  it('should create a new trip with default description when not provided', () => {
    const state = { ...initialState };

    const action = {
      type: 'CREATE_TRIP' as const,
      payload: {
        tripId: 'new-trip-456',
        title: 'Trip Without Description',
      },
    };

    const result = createTripHandler(state, action);

    // Check that the trip summary has empty description
    expect(result.trips.summaries[0].description).toBe('');

    // Check that the trip data also has empty description
    expect(result.trips.byId['new-trip-456'].trip.description).toBe('');
    expect(result.trips.byId['new-trip-456'].trip.title).toBe(
      'Trip Without Description'
    );
  });

  it('should preserve existing trips when creating a new one', () => {
    const state = createTestTripState({
      tripId: 'existing-trip',
      title: 'Existing Trip',
      description: 'Already there',
    });

    const action = {
      type: 'CREATE_TRIP' as const,
      payload: {
        tripId: 'new-trip-789',
        title: 'New Trip',
        description: 'Brand new',
      },
    };

    const result = createTripHandler(state, action);

    // Should have both trips
    expect(result.trips.summaries).toHaveLength(2);
    expect(Object.keys(result.trips.byId)).toHaveLength(2);

    // Check existing trip is preserved
    const existingTrip = result.trips.summaries.find(
      (s) => s.tripId === 'existing-trip'
    );
    expect(existingTrip?.title).toBe('Existing Trip');
    expect(result.trips.byId['existing-trip'].trip.title).toBe('Existing Trip'); // Should match the summary title

    // Check new trip is correct
    const newTrip = result.trips.summaries.find(
      (s) => s.tripId === 'new-trip-789'
    );
    expect(newTrip?.title).toBe('New Trip');
    expect(result.trips.byId['new-trip-789'].trip.title).toBe('New Trip');

    // New trip should be selected
    expect(result.trips.selectedTripId).toBe('new-trip-789');
  });
});

describe('updateTripSummaryHandler', () => {
  it('should update trip title and description', () => {
    const state = createTestTripState({
      tripId: 'test-trip',
      title: 'Original Title',
      description: 'Original Description',
    });

    const originalUpdatedAt = state.trips.summaries[0].updatedAt;

    const action = {
      type: 'UPDATE_TRIP_SUMMARY' as const,
      payload: {
        tripId: 'test-trip',
        title: 'Updated Title',
        description: 'Updated Description',
      },
    };

    const result = updateTripSummaryHandler(state, action);

    const updatedSummary = result.trips.summaries.find(
      (s) => s.tripId === 'test-trip'
    );

    expect(updatedSummary).toBeDefined();
    expect(updatedSummary!.title).toBe('Updated Title');
    expect(updatedSummary!.description).toBe('Updated Description');
    // Check that the updatedAt timestamp is more recent
    expect(
      new Date(updatedSummary!.updatedAt).getTime()
    ).toBeGreaterThanOrEqual(new Date(originalUpdatedAt).getTime());
  });

  it('should handle missing description by setting empty string', () => {
    const state = createTestTripState({
      tripId: 'test-trip',
      title: 'Original Title',
      description: 'Original Description',
    });

    const action = {
      type: 'UPDATE_TRIP_SUMMARY' as const,
      payload: {
        tripId: 'test-trip',
        title: 'Updated Title',
      },
    };

    const result = updateTripSummaryHandler(state, action);

    const updatedSummary = result.trips.summaries.find(
      (s) => s.tripId === 'test-trip'
    );

    expect(updatedSummary).toBeDefined();
    expect(updatedSummary!.title).toBe('Updated Title');
    expect(updatedSummary!.description).toBe('');
  });

  it('should not modify other trips', () => {
    const state = createTestTripState({
      tripId: 'test-trip',
      title: 'Original Title',
      description: 'Original Description',
    });

    // Add another trip
    const anotherTripSummary = {
      tripId: 'other-trip',
      title: 'Other Trip',
      description: 'Other Description',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalItems: 0,
      packedItems: 0,
      totalPeople: 0,
    };

    state.trips.summaries.push(anotherTripSummary);

    const action = {
      type: 'UPDATE_TRIP_SUMMARY' as const,
      payload: {
        tripId: 'test-trip',
        title: 'Updated Title',
        description: 'Updated Description',
      },
    };

    const result = updateTripSummaryHandler(state, action);

    const otherTrip = result.trips.summaries.find(
      (s) => s.tripId === 'other-trip'
    );

    expect(otherTrip).toBeDefined();
    expect(otherTrip!.title).toBe('Other Trip');
    expect(otherTrip!.description).toBe('Other Description');
  });

  it('should handle non-existent trip gracefully', () => {
    const state = createTestTripState({
      tripId: 'test-trip',
      title: 'Original Title',
      description: 'Original Description',
    });

    const action = {
      type: 'UPDATE_TRIP_SUMMARY' as const,
      payload: {
        tripId: 'non-existent-trip',
        title: 'Updated Title',
        description: 'Updated Description',
      },
    };

    const result = updateTripSummaryHandler(state, action);

    // Should not crash and original trips should remain unchanged
    expect(result.trips.summaries).toHaveLength(1);
    expect(result.trips.summaries[0].title).toBe('Original Title');
  });
});

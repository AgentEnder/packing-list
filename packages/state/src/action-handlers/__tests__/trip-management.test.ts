import { describe, it, expect } from 'vitest';
import { updateTripSummaryHandler } from '../trip-management.js';
import { createTestTripState } from '../../__tests__/test-helpers.js';

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

import { describe, it, expect } from 'vitest';
import { clearDemoDataHandler } from '../clear-demo-data.js';
import { StoreType, createEmptyTripData } from '../../store.js';
import { CREATE_DEMO_DATA } from '../../data.js';

describe('clearDemoDataHandler', () => {
  it('should remove demo trip and create a fresh empty trip', () => {
    // Start with demo data
    const demoState = CREATE_DEMO_DATA() as StoreType;

    // Verify demo trip exists
    expect(demoState.trips.summaries).toHaveLength(1);
    expect(demoState.trips.summaries[0].tripId).toBe('DEMO_TRIP');
    expect(demoState.trips.selectedTripId).toBe('DEMO_TRIP');
    expect(demoState.trips.byId['DEMO_TRIP']).toBeDefined();

    // Clear demo data
    const result = clearDemoDataHandler(demoState);

    // Verify demo trip is removed
    expect(result.trips.summaries).toHaveLength(1);
    expect(result.trips.summaries[0].tripId).not.toBe('DEMO_TRIP');
    expect(result.trips.selectedTripId).not.toBe('DEMO_TRIP');
    expect(result.trips.byId['DEMO_TRIP']).toBeUndefined();

    // Verify new trip is created
    const newTripId = result.trips.selectedTripId;
    expect(newTripId).toBeTruthy();
    if (!newTripId) {
      throw new Error('newTripId is undefined');
    }
    expect(newTripId).toMatch(/^trip-\d+$/);

    const newTrip = result.trips.byId[newTripId];
    expect(newTrip).toBeDefined();
    expect(newTrip.trip.days).toEqual([]);
    expect(newTrip.people).toEqual([]);
    expect(newTrip.ruleOverrides).toEqual([]);
    expect(newTrip.calculated.defaultItems).toEqual([]);
    expect(newTrip.calculated.packingListItems).toEqual([]);

    // Verify new trip summary
    const newTripSummary = result.trips.summaries[0];
    expect(newTripSummary.tripId).toBe(newTripId);
    expect(newTripSummary.title).toBe('New Trip');
    expect(newTripSummary.description).toBe('Plan your next adventure');
    expect(newTripSummary.totalItems).toBe(0);
    expect(newTripSummary.packedItems).toBe(0);
    expect(newTripSummary.totalPeople).toBe(0);
  });

  it('should preserve other state properties', () => {
    const demoState = CREATE_DEMO_DATA() as StoreType;

    const result = clearDemoDataHandler(demoState);

    // Verify other state is preserved
    expect(result.rulePacks).toEqual(demoState.rulePacks);
    expect(result.ui).toEqual(demoState.ui);
    expect(result.auth).toEqual(demoState.auth);
  });

  it('should handle state with multiple trips (keep non-demo trips)', () => {
    const demoState = CREATE_DEMO_DATA() as StoreType;

    // Add a non-demo trip
    const regularTripId = 'trip-regular';
    const regularTripData = createEmptyTripData(regularTripId);
    const regularTripSummary = {
      tripId: regularTripId,
      title: 'Regular Trip',
      description: 'A regular trip',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalItems: 0,
      packedItems: 0,
      totalPeople: 0,
    };

    const stateWithMultipleTrips: StoreType = {
      ...demoState,
      trips: {
        ...demoState.trips,
        summaries: [...demoState.trips.summaries, regularTripSummary],
        byId: {
          ...demoState.trips.byId,
          [regularTripId]: regularTripData,
        },
      },
    };

    const result = clearDemoDataHandler(stateWithMultipleTrips);

    // Should have the regular trip plus the new trip (2 total)
    expect(result.trips.summaries).toHaveLength(2);

    // Regular trip should still exist
    const regularTrip = result.trips.summaries.find(
      (s) => s.tripId === regularTripId
    );
    expect(regularTrip).toBeDefined();
    expect(result.trips.byId[regularTripId]).toBeDefined();

    // Demo trip should be gone
    const demoTrip = result.trips.summaries.find(
      (s) => s.tripId === 'DEMO_TRIP'
    );
    expect(demoTrip).toBeUndefined();
    expect(result.trips.byId['DEMO_TRIP']).toBeUndefined();

    // Should have selected the new trip
    expect(result.trips.selectedTripId).not.toBe('DEMO_TRIP');
    expect(result.trips.selectedTripId).not.toBe(regularTripId);
    expect(result.trips.selectedTripId).toMatch(/^trip-\d+$/);
  });
});

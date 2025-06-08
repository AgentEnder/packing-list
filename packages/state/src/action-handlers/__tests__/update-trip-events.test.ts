import { describe, it, expect } from 'vitest';
import { updateTripEventsHandler } from '../update-trip-events.js';
import type { StoreType } from '../../store.js';
import type { TripEvent } from '@packing-list/model';
import { createTestTripState } from '../../__tests__/test-helpers.js';

describe('updateTripEventsHandler', () => {
  // Helper function to create a basic store state with multi-trip structure
  const createMockState = (tripEvents: TripEvent[] = []): StoreType => {
    const state = createTestTripState({});
    const tripId = state.trips.selectedTripId!;

    // Update the trip with provided events
    state.trips.byId[tripId].trip.tripEvents = tripEvents;

    return state;
  };

  it('should update trip events and calculate days', () => {
    const initialState = createMockState();
    const tripId = initialState.trips.selectedTripId!;
    const newEvents: TripEvent[] = [
      {
        id: 'event1',
        type: 'leave_home',
        date: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'event2',
        type: 'arrive_home',
        date: '2024-01-03T00:00:00.000Z',
      },
    ];

    const result = updateTripEventsHandler(initialState, {
      type: 'UPDATE_TRIP_EVENTS',
      payload: newEvents,
    });

    // Verify trip events are updated
    const updatedTrip = result.trips.byId[tripId];
    expect(updatedTrip.trip.tripEvents).toEqual(newEvents);

    // Verify days are calculated correctly
    expect(updatedTrip.trip.days).toHaveLength(3); // 3 days: Jan 1, 2, and 3

    // Get the actual timestamps from the handler
    const day1 = new Date('2024-01-01T00:00:00.000Z');
    day1.setHours(0, 0, 0, 0);
    const day2 = new Date('2024-01-02T00:00:00.000Z');
    day2.setHours(0, 0, 0, 0);
    const day3 = new Date('2024-01-03T00:00:00.000Z');
    day3.setHours(0, 0, 0, 0);

    expect(updatedTrip.trip.days[0].date).toBe(day1.getTime());
    expect(updatedTrip.trip.days[1].date).toBe(day2.getTime());
    expect(updatedTrip.trip.days[2].date).toBe(day3.getTime());
  });

  it('should handle empty events array', () => {
    const initialState = createMockState([
      {
        id: 'event1',
        type: 'leave_home',
        date: '2024-01-01T00:00:00.000Z',
      },
    ]);
    const tripId = initialState.trips.selectedTripId!;

    const result = updateTripEventsHandler(initialState, {
      type: 'UPDATE_TRIP_EVENTS',
      payload: [],
    });

    const updatedTrip = result.trips.byId[tripId];
    expect(updatedTrip.trip.tripEvents).toEqual([]);
    expect(updatedTrip.trip.days).toEqual([]);
  });

  it('should recalculate packing list items', () => {
    const initialState = createMockState();
    const tripId = initialState.trips.selectedTripId!;
    const newEvents: TripEvent[] = [
      {
        id: 'event1',
        type: 'leave_home',
        date: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'event2',
        type: 'arrive_home',
        date: '2024-01-03T00:00:00.000Z',
      },
    ];

    // Add a person and a rule to generate some packing list items
    const stateWithPersonAndRule: StoreType = {
      ...initialState,
      trips: {
        ...initialState.trips,
        byId: {
          ...initialState.trips.byId,
          [tripId]: {
            ...initialState.trips.byId[tripId],
            people: [
              {
                id: 'person1',
                name: 'Test Person',
                age: 30,
                gender: 'other',
              },
            ],
          },
        },
      },
      defaultItemRules: [
        {
          id: 'rule1',
          name: 'Test Rule',
          calculation: {
            baseQuantity: 1,
            perPerson: true,
          },
          conditions: [],
        },
      ],
    };

    const result = updateTripEventsHandler(stateWithPersonAndRule, {
      type: 'UPDATE_TRIP_EVENTS',
      payload: newEvents,
    });

    // Verify packing list items are generated
    const resultTrip = result.trips.byId[tripId];
    expect(resultTrip.calculated.packingListItems.length).toBeGreaterThan(0);
    expect(resultTrip.calculated.packingListItems[0]).toMatchObject({
      personId: 'person1',
      ruleId: 'rule1',
      quantity: 1,
    });
  });
});

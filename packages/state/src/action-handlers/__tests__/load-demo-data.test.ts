import { describe, it, expect } from 'vitest';
import { loadDemoDataHandler } from '../load-demo-data.js';
import { CREATE_DEMO_DATA } from '../../data.js';
import { createTestTripState } from '../../__tests__/test-helpers.js';
import {
  selectPeople,
  selectCurrentTrip,
  selectPackingListView,
} from '../../selectors.js';
import { TripEvent } from '@packing-list/model';

describe('loadDemoDataHandler', () => {
  it('should load demo data', () => {
    const initialState = createTestTripState({});
    const result = loadDemoDataHandler(initialState);
    const demoData = CREATE_DEMO_DATA();

    // Verify the structure and content using selectors
    const people = selectPeople(result);
    const trip = selectCurrentTrip(result);
    const packingListView = selectPackingListView(result);

    expect(people).toHaveLength(4); // Demo data has 4 people
    expect(trip).toBeDefined();
    expect(trip?.id).toBe('DEMO_TRIP');
    expect(packingListView).toBeDefined();
    expect(result.defaultItemRules).toHaveLength(
      demoData.defaultItemRules?.length || 0
    );
    expect(result.rulePacks).toHaveLength(demoData.rulePacks?.length || 0);
  });

  it('should contain all required state properties', () => {
    const initialState = createTestTripState({});
    const result = loadDemoDataHandler(initialState);

    // Verify all required properties are present
    const people = selectPeople(result);
    const trip = selectCurrentTrip(result);
    const packingListView = selectPackingListView(result);

    expect(people).toBeDefined();
    expect(trip).toBeDefined();
    expect(trip?.days).toBeDefined();
    expect(trip?.tripEvents).toBeDefined();
    expect(result.defaultItemRules).toBeDefined();
    expect(packingListView).toBeDefined();
  });

  it('should have valid trip events', () => {
    const initialState = createTestTripState({});
    const result = loadDemoDataHandler(initialState);
    const trip = selectCurrentTrip(result);

    // Verify trip events are properly structured
    expect(trip?.tripEvents).toBeDefined();
    if (trip?.tripEvents) {
      expect(trip.tripEvents.length).toBeGreaterThan(0);

      // Check first event structure
      const firstEvent = trip.tripEvents[0];
      expect(firstEvent).toHaveProperty('id');
      expect(firstEvent).toHaveProperty('type');
      expect(firstEvent).toHaveProperty('date');

      // Verify event sequence
      const events = trip.tripEvents;
      const leaveHomeEvent = events.find(
        (e: TripEvent) => e.type === 'leave_home'
      );
      const arriveHomeEvent = events.find(
        (e: TripEvent) => e.type === 'arrive_home'
      );
      expect(leaveHomeEvent).toBeDefined();
      expect(arriveHomeEvent).toBeDefined();
      if (leaveHomeEvent && arriveHomeEvent) {
        expect(new Date(leaveHomeEvent.date).getTime()).toBeLessThan(
          new Date(arriveHomeEvent.date).getTime()
        );
      }
    }
  });

  it('should have valid days calculated', () => {
    const initialState = createTestTripState({});
    const result = loadDemoDataHandler(initialState);
    const trip = selectCurrentTrip(result);

    expect(trip?.days.length).toBeGreaterThan(0);
    if (!trip) return;
    const firstDay = trip.days[0];

    // Check day structure
    expect(firstDay).toHaveProperty('date');
    expect(firstDay).toHaveProperty('expectedClimate');
    expect(firstDay).toHaveProperty('location');
    expect(firstDay).toHaveProperty('travel');
    expect(firstDay).toHaveProperty('items');
    expect(Array.isArray(firstDay.items)).toBe(true);
  });

  it('should have valid default item rules', () => {
    const initialState = createTestTripState({});
    const result = loadDemoDataHandler(initialState);

    expect(result.defaultItemRules.length).toBeGreaterThan(0);
    const firstRule = result.defaultItemRules[0];

    // Check rule structure
    expect(firstRule).toHaveProperty('id');
    expect(firstRule).toHaveProperty('name');
    expect(firstRule).toHaveProperty('calculation');
    expect(firstRule.calculation).toHaveProperty('baseQuantity');
  });

  it('should have valid packing list view state', () => {
    const initialState = createTestTripState({});
    const result = loadDemoDataHandler(initialState);
    const packingListView = selectPackingListView(result);

    expect(packingListView).toHaveProperty('viewMode');
    expect(packingListView).toHaveProperty('filters');
    expect(packingListView?.filters).toHaveProperty('packed');
    expect(packingListView?.filters).toHaveProperty('unpacked');
    expect(packingListView?.filters).toHaveProperty('excluded');
    expect(['by-day', 'by-person']).toContain(packingListView?.viewMode);
  });

  it('should have valid calculated items', () => {
    const initialState = createTestTripState({});
    const result = loadDemoDataHandler(initialState);

    // Access calculated items from the selected trip
    const selectedTripId = result.trips.selectedTripId;
    expect(selectedTripId).toBeDefined();
    if (!selectedTripId) return;

    const tripData = result.trips.byId[selectedTripId];
    expect(tripData.calculated).toHaveProperty('defaultItems');
    expect(tripData.calculated).toHaveProperty('packingListItems');
    expect(Array.isArray(tripData.calculated.defaultItems)).toBe(true);
    expect(Array.isArray(tripData.calculated.packingListItems)).toBe(true);

    if (tripData.calculated.defaultItems.length > 0) {
      const firstItem = tripData.calculated.defaultItems[0];
      expect(firstItem).toHaveProperty('name');
      expect(firstItem).toHaveProperty('quantity');
      expect(firstItem).toHaveProperty('ruleId');
    }

    if (tripData.calculated.packingListItems.length > 0) {
      const firstItem = tripData.calculated.packingListItems[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('name');
      expect(firstItem).toHaveProperty('quantity');
      expect(firstItem).toHaveProperty('ruleId');
      expect(firstItem).toHaveProperty('isPacked');
      expect(firstItem).toHaveProperty('isOverridden');
      expect(firstItem).toHaveProperty('isExtra');
    }
  });
});

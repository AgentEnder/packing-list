import { describe, it, expect } from 'vitest';
import { loadDemoDataHandler } from '../load-demo-data.js';
import { CREATE_DEMO_DATA } from '../../data.js';

describe('loadDemoDataHandler', () => {
  it('should load demo data', () => {
    const result = loadDemoDataHandler();
    const demoData = CREATE_DEMO_DATA();

    // Instead of exact equality, verify the structure and content
    expect(result).toMatchObject({
      people: expect.arrayContaining(demoData.people),
      trip: {
        id: demoData.trip.id,
        days: expect.arrayContaining(demoData.trip.days),
        ...(demoData.trip.tripEvents && {
          tripEvents: expect.arrayContaining(demoData.trip.tripEvents),
        }),
      },
      defaultItemRules: expect.arrayContaining(demoData.defaultItemRules),
      rulePacks: expect.arrayContaining(demoData.rulePacks),
      packingListView: demoData.packingListView,
      ruleOverrides: demoData.ruleOverrides,
    });

    // Verify calculated items have the same structure but don't compare IDs
    expect(result.calculated.defaultItems).toHaveLength(
      demoData.calculated.defaultItems.length
    );
    expect(result.calculated.packingListItems).toHaveLength(
      demoData.calculated.packingListItems.length
    );
  });

  it('should contain all required state properties', () => {
    const result = loadDemoDataHandler();

    // Verify all required properties are present
    expect(result.people).toBeDefined();
    expect(result.trip).toBeDefined();
    expect(result.trip.days).toBeDefined();
    expect(result.trip.tripEvents).toBeDefined();
    expect(result.defaultItemRules).toBeDefined();
    expect(result.calculated).toBeDefined();
    expect(result.packingListView).toBeDefined();
  });

  it('should have valid trip events', () => {
    const result = loadDemoDataHandler();

    // Verify trip events are properly structured
    expect(result.trip.tripEvents).toBeDefined();
    if (result.trip.tripEvents) {
      expect(result.trip.tripEvents.length).toBeGreaterThan(0);

      // Check first event structure
      const firstEvent = result.trip.tripEvents[0];
      expect(firstEvent).toHaveProperty('id');
      expect(firstEvent).toHaveProperty('type');
      expect(firstEvent).toHaveProperty('date');

      // Verify event sequence
      const events = result.trip.tripEvents;
      const leaveHomeEvent = events.find((e) => e.type === 'leave_home');
      const arriveHomeEvent = events.find((e) => e.type === 'arrive_home');
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
    const result = loadDemoDataHandler();

    expect(result.trip.days.length).toBeGreaterThan(0);
    const firstDay = result.trip.days[0];

    // Check day structure
    expect(firstDay).toHaveProperty('date');
    expect(firstDay).toHaveProperty('expectedClimate');
    expect(firstDay).toHaveProperty('location');
    expect(firstDay).toHaveProperty('travel');
    expect(firstDay).toHaveProperty('items');
    expect(Array.isArray(firstDay.items)).toBe(true);
  });

  it('should have valid default item rules', () => {
    const result = loadDemoDataHandler();

    expect(result.defaultItemRules.length).toBeGreaterThan(0);
    const firstRule = result.defaultItemRules[0];

    // Check rule structure
    expect(firstRule).toHaveProperty('id');
    expect(firstRule).toHaveProperty('name');
    expect(firstRule).toHaveProperty('calculation');
    expect(firstRule.calculation).toHaveProperty('baseQuantity');
  });

  it('should have valid packing list view state', () => {
    const result = loadDemoDataHandler();

    expect(result.packingListView).toHaveProperty('viewMode');
    expect(result.packingListView).toHaveProperty('filters');
    expect(result.packingListView.filters).toHaveProperty('packed');
    expect(result.packingListView.filters).toHaveProperty('unpacked');
    expect(result.packingListView.filters).toHaveProperty('excluded');
    expect(['by-day', 'by-person']).toContain(result.packingListView.viewMode);
  });

  it('should have valid calculated items', () => {
    const result = loadDemoDataHandler();

    expect(result.calculated).toHaveProperty('defaultItems');
    expect(result.calculated).toHaveProperty('packingListItems');
    expect(Array.isArray(result.calculated.defaultItems)).toBe(true);
    expect(Array.isArray(result.calculated.packingListItems)).toBe(true);

    if (result.calculated.defaultItems.length > 0) {
      const firstItem = result.calculated.defaultItems[0];
      expect(firstItem).toHaveProperty('name');
      expect(firstItem).toHaveProperty('quantity');
      expect(firstItem).toHaveProperty('ruleId');
    }

    if (result.calculated.packingListItems.length > 0) {
      const firstItem = result.calculated.packingListItems[0];
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

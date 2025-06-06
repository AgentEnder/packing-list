import { describe, it, expect } from 'vitest';
import { createStore } from '../store.js';
import { TripEvent, DefaultItemRule } from '@packing-list/model';
import { parseISO } from 'date-fns';

describe('trip actions', () => {
  it('should handle UPDATE_TRIP_EVENTS action', () => {
    const store = createStore({});
    const events: TripEvent[] = [
      { id: 'event1', type: 'leave_home', date: '2024-01-01' },
      { id: 'event2', type: 'arrive_destination', date: '2024-01-02' },
    ];

    store.dispatch({ type: 'UPDATE_TRIP_EVENTS', payload: events });

    expect(store.getState().trip.tripEvents).toEqual(events);
  });

  it('should handle CALCULATE_DAYS action after updating events', () => {
    const store = createStore({});
    const events: TripEvent[] = [
      { id: 'event1', type: 'leave_home', date: '2024-01-01' },
      { id: 'event2', type: 'arrive_home', date: '2024-01-03' },
    ];

    store.dispatch({ type: 'UPDATE_TRIP_EVENTS', payload: events });
    store.dispatch({
      type: 'CALCULATE_DAYS',
      payload: { ...store.getState().trip, tripEvents: events },
    });

    const state = store.getState();
    expect(state.trip.days).toHaveLength(3); // Jan 1-3
    expect(state.trip.days[0].date).toBe(parseISO('2024-01-01').getTime());
    expect(state.trip.days[2].date).toBe(parseISO('2024-01-03').getTime());
  });

  it('should handle CREATE_ITEM_RULE and CALCULATE_DEFAULT_ITEMS actions', () => {
    const store = createStore({});
    const rule: DefaultItemRule = {
      id: 'rule1',
      name: 'Travel Items',
      calculation: {
        baseQuantity: 1,
        perPerson: true,
      },
      conditions: [
        {
          type: 'day',
          field: 'date',
          operator: '==',
          value: parseISO('2024-01-01').getTime(),
        },
      ],
    };

    store.dispatch({ type: 'CREATE_ITEM_RULE', payload: rule });
    expect(store.getState().defaultItemRules).toContainEqual(rule);

    // Add a travel event
    const events: TripEvent[] = [
      { id: 'event1', type: 'leave_home', date: '2024-01-01' },
    ];
    store.dispatch({ type: 'UPDATE_TRIP_EVENTS', payload: events });
    store.dispatch({
      type: 'CALCULATE_DAYS',
      payload: { ...store.getState().trip, tripEvents: events },
    });

    // Add a person to trigger per-person calculation
    store.dispatch({
      type: 'ADD_PERSON',
      payload: { id: 'person1', name: 'Test Person', age: 30, gender: 'other' },
    });

    // Calculate default items based on the rule and event
    store.dispatch({ type: 'CALCULATE_DEFAULT_ITEMS' });

    const state = store.getState();
    expect(state.calculated.defaultItems).toHaveLength(1);
    expect(state.calculated.defaultItems[0]).toEqual(
      expect.objectContaining({
        name: 'Travel Items',
        quantity: 1,
        ruleId: 'rule1',
      })
    );
  });

  it('should handle TOGGLE_ITEM_PACKED action', () => {
    const store = createStore({});
    const events: TripEvent[] = [
      { id: 'event1', type: 'leave_home', date: '2024-01-01' },
    ];

    // Setup initial state with events and items
    store.dispatch({ type: 'UPDATE_TRIP_EVENTS', payload: events });
    store.dispatch({
      type: 'CALCULATE_DAYS',
      payload: { ...store.getState().trip, tripEvents: events },
    });
    store.dispatch({ type: 'CALCULATE_PACKING_LIST' });

    // Add a person to pack items for
    store.dispatch({
      type: 'ADD_PERSON',
      payload: { id: 'person1', name: 'Test Person', age: 30, gender: 'other' },
    });

    const state = store.getState();
    const firstItem = state.calculated.packingListItems[0];
    if (firstItem) {
      // Toggle an item as packed
      store.dispatch({
        type: 'TOGGLE_ITEM_PACKED',
        payload: { itemId: firstItem.id, personId: 'person1' },
      });

      const updatedState = store.getState();
      const updatedItem = updatedState.calculated.packingListItems[0];
      expect(updatedItem.isPacked).toBe(true);
    }
  });
});

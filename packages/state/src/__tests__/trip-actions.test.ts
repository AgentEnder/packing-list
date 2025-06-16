import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { TripEvent, DefaultItemRule } from '@packing-list/model';
import { parseISO } from 'date-fns';
import {
  selectCurrentTrip,
  selectCalculatedItems,
  selectDefaultItemRules,
} from '../selectors.js';
import { createTestTripState } from './test-helpers.js';
import { Mutations, AllActions } from '../actions.js';
import { StoreType } from '../store.js';

// Create a test store with proper reducer and initial state
function createTestStore(initialState: StoreType) {
  const reducer = (
    state: StoreType = initialState,
    action: AllActions | { type: string }
  ): StoreType => {
    if (
      'type' in action &&
      typeof action.type === 'string' &&
      action.type in Mutations
    ) {
      const actionType = action.type as keyof typeof Mutations;
      const mutation = Mutations[actionType];
      if (mutation) {
        // Type assertion is safe here as we've checked the action type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return mutation(state, action as any);
      }
    }
    return state;
  };

  return configureStore({
    reducer,
    preloadedState: initialState,
  });
}

describe('trip actions', () => {
  it('should handle UPDATE_TRIP_EVENTS action', () => {
    const initialState = createTestTripState({});
    const store = createTestStore(initialState);

    const events: TripEvent[] = [
      { id: 'event1', type: 'leave_home', date: '2024-01-01' },
      { id: 'event2', type: 'arrive_destination', date: '2024-01-02' },
    ];

    store.dispatch({ type: 'UPDATE_TRIP_EVENTS', payload: events });

    const currentTrip = selectCurrentTrip(store.getState());
    expect(currentTrip?.tripEvents).toEqual(events);
  });

  it('should handle CALCULATE_DAYS action after updating events', () => {
    const initialState = createTestTripState({});
    const store = createTestStore(initialState);

    const events: TripEvent[] = [
      { id: 'event1', type: 'leave_home', date: '2024-01-01' },
      { id: 'event2', type: 'arrive_home', date: '2024-01-03' },
    ];

    store.dispatch({ type: 'UPDATE_TRIP_EVENTS', payload: events });
    const currentTrip = selectCurrentTrip(store.getState());
    store.dispatch({
      type: 'CALCULATE_DAYS',
      payload: { ...currentTrip!, tripEvents: events },
    });

    const state = store.getState();
    const trip = selectCurrentTrip(state);
    expect(trip?.days).toHaveLength(3); // Jan 1-3
    expect(trip?.days[0].date).toBe(parseISO('2024-01-01').getTime());
    expect(trip?.days[2].date).toBe(parseISO('2024-01-03').getTime());
  });

  it('should handle CREATE_ITEM_RULE and CALCULATE_DEFAULT_ITEMS actions', () => {
    const initialState = createTestTripState({});
    const store = createTestStore(initialState);

    const rule: DefaultItemRule = {
      id: 'rule1',
      name: 'Travel Items',
      calculation: {
        baseQuantity: 1,
        perPerson: true,
      },
      originalRuleId: 'rule1',
    };

    store.dispatch({ type: 'CREATE_ITEM_RULE', payload: rule });
    expect(selectDefaultItemRules(store.getState())).toContainEqual(rule);

    // Add a travel event
    const events: TripEvent[] = [
      { id: 'event1', type: 'leave_home', date: '2024-01-01' },
    ];
    store.dispatch({ type: 'UPDATE_TRIP_EVENTS', payload: events });
    const currentTrip = selectCurrentTrip(store.getState());
    store.dispatch({
      type: 'CALCULATE_DAYS',
      payload: { ...currentTrip!, tripEvents: events },
    });

    // Add a person to trigger per-person calculation
    store.dispatch({
      type: 'ADD_PERSON',
      payload: { id: 'person1', name: 'Test Person', age: 30, gender: 'other' },
    });

    // Calculate default items based on the rule and event
    store.dispatch({ type: 'CALCULATE_DEFAULT_ITEMS' });

    const state = store.getState();
    const calculatedItems = selectCalculatedItems(state);
    expect(calculatedItems.defaultItems).toHaveLength(1);
    expect(calculatedItems.defaultItems[0]).toEqual(
      expect.objectContaining({
        name: 'Travel Items',
        quantity: 1,
        ruleId: 'rule1',
      })
    );
  });

  it('should handle TOGGLE_ITEM_PACKED action', () => {
    const initialState = createTestTripState({});
    const store = createTestStore(initialState);

    const events: TripEvent[] = [
      { id: 'event1', type: 'leave_home', date: '2024-01-01' },
    ];

    // Setup initial state with events and items
    store.dispatch({ type: 'UPDATE_TRIP_EVENTS', payload: events });
    const currentTrip = selectCurrentTrip(store.getState());
    store.dispatch({
      type: 'CALCULATE_DAYS',
      payload: { ...currentTrip!, tripEvents: events },
    });
    store.dispatch({ type: 'CALCULATE_PACKING_LIST' });

    // Add a person to pack items for
    store.dispatch({
      type: 'ADD_PERSON',
      payload: { id: 'person1', name: 'Test Person', age: 30, gender: 'other' },
    });

    const state = store.getState();
    const calculatedItems = selectCalculatedItems(state);
    const firstItem = calculatedItems.packingListItems[0];
    if (firstItem) {
      // Toggle an item as packed
      store.dispatch({
        type: 'TOGGLE_ITEM_PACKED',
        payload: { itemId: firstItem.id, personId: 'person1' },
      });

      const updatedState = store.getState();
      const updatedCalculatedItems = selectCalculatedItems(updatedState);
      const updatedItem = updatedCalculatedItems.packingListItems[0];
      expect(updatedItem.isPacked).toBe(true);
    }
  });
});

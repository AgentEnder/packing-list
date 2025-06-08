import { describe, it, expect } from 'vitest';
import { createStore, initialState } from '../store.js';
import { LegacyPerson as Person } from '@packing-list/model';
import { UnknownAction } from '@reduxjs/toolkit';
import { createTestTripState, createTestPerson } from './test-helpers.js';
import { selectPeople } from '../selectors.js';

describe('store', () => {
  it('should initialize with default state when no context provided', () => {
    const store = createStore({});
    const state = store.getState();

    // Extract just the app state (without auth) for comparison
    const { auth, ...appState } = state;
    expect(appState).toEqual(initialState);

    // Verify auth state exists and has expected structure
    expect(auth).toBeDefined();
    expect(auth).toHaveProperty('user');
    expect(auth).toHaveProperty('loading');
    expect(auth).toHaveProperty('isOfflineMode');
  });

  it('should use SSR state when provided', () => {
    const person = createTestPerson({ id: 'test', name: 'Test Person' });
    const ssrState = createTestTripState({ people: [person] });

    const store = createStore({
      isClient: true,
      redux: { ssrState },
    });
    expect(store.getState()).toEqual(ssrState);
  });

  it('should handle ADD_PERSON action', () => {
    // Create a store with an existing trip selected
    const initialTripState = createTestTripState({});
    const store = createStore({
      isClient: true,
      redux: { ssrState: initialTripState },
    });

    const person: Person = createTestPerson({
      id: 'test',
      name: 'Test Person',
      age: 30,
      gender: 'other',
    });

    store.dispatch({ type: 'ADD_PERSON', payload: person });

    // Use selector to get people from the selected trip
    const people = selectPeople(store.getState());
    expect(people).toEqual([person]);
  });

  it('should handle REMOVE_PERSON action', () => {
    const person: Person = createTestPerson({
      id: 'test',
      name: 'Test Person',
      age: 30,
      gender: 'other',
    });

    // Create initial state with a person in the trip
    const initialTripState = createTestTripState({ people: [person] });
    const store = createStore({
      isClient: true,
      redux: { ssrState: initialTripState },
    });

    store.dispatch({ type: 'REMOVE_PERSON', payload: { id: 'test' } });

    // Use selector to get people from the selected trip
    const people = selectPeople(store.getState());
    expect(people).toEqual([]);
  });

  it('should handle UPDATE_PERSON action', () => {
    const person: Person = createTestPerson({
      id: 'test',
      name: 'Test Person',
      age: 30,
      gender: 'other',
    });

    // Create initial state with a person in the trip
    const initialTripState = createTestTripState({ people: [person] });
    const store = createStore({
      isClient: true,
      redux: { ssrState: initialTripState },
    });

    const updatedPerson: Person = { ...person, name: 'Updated Name' };
    store.dispatch({
      type: 'UPDATE_PERSON',
      payload: updatedPerson,
    });

    // Use selector to get people from the selected trip
    const people = selectPeople(store.getState());
    expect(people[0].name).toBe('Updated Name');
  });

  it('should handle invalid actions by returning current state', () => {
    const store = createStore({});
    const initialStateSnapshot = store.getState();

    store.dispatch({ type: 'NON_EXISTENT_ACTION' } as UnknownAction);

    expect(store.getState()).toEqual(initialStateSnapshot);
  });
});

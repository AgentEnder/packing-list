import { describe, it, expect } from 'vitest';
import { createStore, initialState, StoreType } from '../store.js';
import { Person } from '@packing-list/model';
import { UnknownAction } from '@reduxjs/toolkit';

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
    const ssrState: StoreType = {
      ...initialState,
      people: [{ id: 'test', name: 'Test Person', age: 30, gender: 'other' }],
      // Add a minimal auth state for SSR
      auth: {
        user: null,
        session: null,
        loading: true,
        error: null,
        lastError: null,
        isAuthenticating: false,
        isInitialized: false,
        isOfflineMode: false,
        forceOfflineMode: false,
        connectivityState: { isOnline: true, isConnected: true },
        offlineAccounts: [],
        hasOfflinePasscode: false,
      },
    };
    const store = createStore({
      isClient: true,
      redux: { ssrState },
    });
    expect(store.getState()).toEqual(ssrState);
  });

  it('should handle ADD_PERSON action', () => {
    const store = createStore({});
    const person: Person = {
      id: 'test',
      name: 'Test Person',
      age: 30,
      gender: 'other',
    };

    store.dispatch({ type: 'ADD_PERSON', payload: person });

    expect(store.getState().people).toEqual([person]);
  });

  it('should handle REMOVE_PERSON action', () => {
    const person: Person = {
      id: 'test',
      name: 'Test Person',
      age: 30,
      gender: 'other',
    };
    const ssrState: StoreType = {
      ...initialState,
      people: [person],
      // Add a minimal auth state for SSR
      auth: {
        user: null,
        session: null,
        loading: true,
        error: null,
        lastError: null,
        isAuthenticating: false,
        isInitialized: false,
        isOfflineMode: false,
        forceOfflineMode: false,
        connectivityState: { isOnline: true, isConnected: true },
        offlineAccounts: [],
        hasOfflinePasscode: false,
      },
    };
    const store = createStore({ isClient: true, redux: { ssrState } });

    store.dispatch({ type: 'REMOVE_PERSON', payload: { id: 'test' } });

    expect(store.getState().people).toEqual([]);
  });

  it('should handle UPDATE_PERSON action', () => {
    const person: Person = {
      id: 'test',
      name: 'Test Person',
      age: 30,
      gender: 'other',
    };
    const ssrState: StoreType = {
      ...initialState,
      people: [person],
      // Add a minimal auth state for SSR
      auth: {
        user: null,
        session: null,
        loading: true,
        error: null,
        lastError: null,
        isAuthenticating: false,
        isInitialized: false,
        isOfflineMode: false,
        forceOfflineMode: false,
        connectivityState: { isOnline: true, isConnected: true },
        offlineAccounts: [],
        hasOfflinePasscode: false,
      },
    };
    const store = createStore({ isClient: true, redux: { ssrState } });

    const updatedPerson: Person = { ...person, name: 'Updated Name' };
    store.dispatch({
      type: 'UPDATE_PERSON',
      payload: updatedPerson,
    });

    expect(store.getState().people[0].name).toBe('Updated Name');
  });

  it('should handle invalid actions by returning current state', () => {
    const store = createStore({});
    const initialStateSnapshot = store.getState();

    store.dispatch({ type: 'NON_EXISTENT_ACTION' } as UnknownAction);

    expect(store.getState()).toEqual(initialStateSnapshot);
  });
});

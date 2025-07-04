import { describe, it, expect } from 'vitest';
import { addPerson, addPersonHandler } from './add-person.js';
import {
  createTestTripState,
  createTestPerson,
  getSelectedTripId,
} from '../__tests__/test-helpers.js';

describe('addPersonHandler', () => {
  it('adds a new person to the selected trip', () => {
    const state = createTestTripState({});
    const tripId = getSelectedTripId(state);

    const action = addPerson({ name: 'Alice', age: 28 });
    const result = addPersonHandler(state, action);

    const people = result.trips.byId[tripId].people;
    expect(people).toHaveLength(1);
    expect(people[0].name).toBe('Alice');
    expect(people[0].tripId).toBe(tripId);
  });

  it('does not modify state when no trip is selected', () => {
    const state = createTestTripState({});
    state.trips.selectedTripId = null;
    const action = addPerson({ name: 'Alice', age: 28 });
    const result = addPersonHandler(state, action);
    expect(result).toBe(state);
  });

  it('avoids adding duplicate people', () => {
    const existing = createTestPerson({ id: 'p1', name: 'Bob' });
    const state = createTestTripState({ people: [existing] });
    const tripId = getSelectedTripId(state);

    // Reuse the same id to simulate duplicate
    const action: Parameters<typeof addPersonHandler>[1] = {
      type: 'ADD_PERSON',
      payload: existing,
    };

    const result = addPersonHandler(state, action);
    expect(result.trips.byId[tripId].people).toHaveLength(1);
  });
});

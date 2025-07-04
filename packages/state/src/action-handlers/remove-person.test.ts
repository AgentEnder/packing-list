import { describe, it, expect } from 'vitest';
import { removePersonHandler } from './remove-person.js';
import {
  createTestTripState,
  createTestPerson,
  getSelectedTripId,
} from '../__tests__/test-helpers.js';

describe('removePersonHandler', () => {
  it('removes the specified person', () => {
    const person = createTestPerson({ id: 'p1' });
    const state = createTestTripState({ people: [person] });
    const tripId = getSelectedTripId(state);
    const action = { type: 'REMOVE_PERSON' as const, payload: { id: 'p1' } };
    const result = removePersonHandler(state, action);
    expect(result.trips.byId[tripId].people).toHaveLength(0);
  });

  it('returns original state when person not found', () => {
    const state = createTestTripState({});
    const action = { type: 'REMOVE_PERSON' as const, payload: { id: 'x' } };
    const result = removePersonHandler(state, action);
    expect(result).toEqual(state);
  });

  it('does nothing if no trip selected', () => {
    const state = createTestTripState({});
    state.trips.selectedTripId = null;
    const action = { type: 'REMOVE_PERSON' as const, payload: { id: 'p1' } };
    const result = removePersonHandler(state, action);
    expect(result).toBe(state);
  });
});

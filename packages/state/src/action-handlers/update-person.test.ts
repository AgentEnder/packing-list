import { describe, it, expect } from 'vitest';
import { updatePersonHandler } from './update-person.js';
import {
  createTestTripState,
  createTestPerson,
  getSelectedTripId,
} from '../__tests__/test-helpers.js';
import type { Person } from '@packing-list/model';

describe('updatePersonHandler', () => {
  it('updates an existing person', () => {
    const person = createTestPerson({ id: 'p1', name: 'Old' });
    const state = createTestTripState({ people: [person] });
    const tripId = getSelectedTripId(state);

    const updated: Person = { ...person, name: 'New Name', age: 40 };
    const action = { type: 'UPDATE_PERSON' as const, payload: updated };
    const result = updatePersonHandler(state, action);

    const updatedPerson = result.trips.byId[tripId].people[0];
    expect(updatedPerson.name).toBe('New Name');
    expect(updatedPerson.age).toBe(40);
  });

  it('does nothing when no trip is selected', () => {
    const state = createTestTripState({});
    state.trips.selectedTripId = null;
    const person = createTestPerson({ id: 'p1' });
    const action = { type: 'UPDATE_PERSON' as const, payload: person };
    const result = updatePersonHandler(state, action);
    expect(result).toBe(state);
  });
});

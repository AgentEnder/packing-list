import { describe, it, expect } from 'vitest';
import { updateItemRuleHandler } from './update-item-rule.js';
import {
  createTestTripState,
  getSelectedTripId,
} from '../__tests__/test-helpers.js';
import type { DefaultItemRule } from '@packing-list/model';

describe('updateItemRuleHandler', () => {
  const createRule = (id: string, name = 'Rule'): DefaultItemRule => ({
    id,
    originalRuleId: id,
    name,
    calculation: { baseQuantity: 1, perPerson: false, perDay: false },
    conditions: [],
    notes: '',
    categoryId: '',
    subcategoryId: '',
    packIds: [],
  });

  it('updates an existing rule', () => {
    const rule = createRule('r1', 'Old');
    const state = createTestTripState({});
    const tripId = getSelectedTripId(state);
    state.trips.byId[tripId].trip.defaultItemRules = [rule];

    const updated = { ...rule, name: 'Updated' };
    const action = { type: 'UPDATE_ITEM_RULE' as const, payload: updated };
    const result = updateItemRuleHandler(state, action);

    expect(result.trips.byId[tripId].trip.defaultItemRules[0].name).toBe(
      'Updated'
    );
  });

  it('does nothing when no trip is selected', () => {
    const state = createTestTripState({});
    state.trips.selectedTripId = null;
    const rule = createRule('r1');
    const action = { type: 'UPDATE_ITEM_RULE' as const, payload: rule };
    const result = updateItemRuleHandler(state, action);
    expect(result).toBe(state);
  });
});

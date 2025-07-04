import { describe, it, expect } from 'vitest';
import { toggleItemPackedHandler } from './toggle-item-packed.js';
import {
  createTestTripState,
  getSelectedTripId,
} from '../__tests__/test-helpers.js';
import type { PackingListItem } from '@packing-list/model';

describe('toggleItemPackedHandler', () => {
  const createStateWithItems = (items: PackingListItem[]) => {
    const state = createTestTripState({});
    const tripId = getSelectedTripId(state);
    state.trips.byId[tripId].calculated.packingListItems = items;
    return { state, tripId };
  };

  it('toggles packed status for a single item', () => {
    const item: PackingListItem = {
      id: 'item1',
      ruleId: 'r1',
      name: 'Item 1',
      itemName: 'Item 1',
      quantity: 1,
      isPacked: false,
      isOverridden: false,
      isExtra: false,
      ruleHash: 'hash',
    };
    const { state, tripId } = createStateWithItems([item]);
    const action = {
      type: 'TOGGLE_ITEM_PACKED' as const,
      payload: { itemId: 'item1' },
    };

    const result = toggleItemPackedHandler(state, action);
    expect(
      result.trips.byId[tripId].calculated.packingListItems[0].isPacked
    ).toBe(true);

    const result2 = toggleItemPackedHandler(result, action);
    expect(
      result2.trips.byId[tripId].calculated.packingListItems[0].isPacked
    ).toBe(false);
  });

  it('does not toggle other items', () => {
    const items: PackingListItem[] = [
      {
        id: 'a',
        ruleId: 'r',
        name: 'A',
        itemName: 'A',
        quantity: 1,
        isPacked: false,
        isOverridden: false,
        isExtra: false,
        ruleHash: 'h1',
      },
      {
        id: 'b',
        ruleId: 'r',
        name: 'B',
        itemName: 'B',
        quantity: 1,
        isPacked: false,
        isOverridden: false,
        isExtra: false,
        ruleHash: 'h2',
      },
    ];
    const { state, tripId } = createStateWithItems(items);
    const action = {
      type: 'TOGGLE_ITEM_PACKED' as const,
      payload: { itemId: 'a' },
    };

    const result = toggleItemPackedHandler(state, action);
    expect(
      result.trips.byId[tripId].calculated.packingListItems[0].isPacked
    ).toBe(true);
    expect(
      result.trips.byId[tripId].calculated.packingListItems[1].isPacked
    ).toBe(false);
  });

  it('returns state unchanged when no trip selected', () => {
    const state = createTestTripState({});
    state.trips.selectedTripId = null;
    const action = {
      type: 'TOGGLE_ITEM_PACKED' as const,
      payload: { itemId: 'x' },
    };
    const result = toggleItemPackedHandler(state, action);
    expect(result).toBe(state);
  });
});

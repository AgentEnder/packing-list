import { describe, it, expect } from 'vitest';
import { PackingListItem, PackingListViewState } from '@packing-list/model';
import { StoreType } from '../store.js';
import { toggleItemPackedHandler } from '../action-handlers/toggle-item-packed.js';
import { updatePackingListViewHandler } from '../action-handlers/update-packing-list-view.js';
import { createTestTripState } from './test-helpers.js';

describe('Packing List Actions', () => {
  describe('toggleItemPacked', () => {
    it('should toggle the packed status of an item', () => {
      // Create a test item
      const testItem: PackingListItem = {
        id: 'test-item-1',
        ruleId: 'rule1',
        name: 'Test Item',
        itemName: 'Test Item',
        quantity: 1,
        isPacked: false,
        isOverridden: false,
        isExtra: false,
        ruleHash: 'hash1',
      };

      // Set up initial state with our test item
      const testState = createTestTripState({});
      const tripId = testState.trips.selectedTripId!;
      testState.trips.byId[tripId].calculated.packingListItems = [testItem];

      // Toggle the item to packed
      const toggleAction = {
        type: 'TOGGLE_ITEM_PACKED' as const,
        payload: {
          itemId: 'test-item-1',
        },
      };

      const resultState = toggleItemPackedHandler(testState, toggleAction);
      const resultTripData = resultState.trips.byId[tripId];
      expect(resultTripData.calculated.packingListItems[0].isPacked).toBe(true);

      // Toggle it back to unpacked
      const resultState2 = toggleItemPackedHandler(resultState, toggleAction);
      const resultTripData2 = resultState2.trips.byId[tripId];
      expect(resultTripData2.calculated.packingListItems[0].isPacked).toBe(
        false
      );
    });

    it('should only toggle the specified item', () => {
      const items: PackingListItem[] = [
        {
          id: 'item-1',
          ruleId: 'rule1',
          name: 'Item 1',
          itemName: 'Item 1',
          quantity: 1,
          isPacked: false,
          isOverridden: false,
          isExtra: false,
          ruleHash: 'hash1',
        },
        {
          id: 'item-2',
          ruleId: 'rule1',
          name: 'Item 2',
          itemName: 'Item 2',
          quantity: 1,
          isPacked: false,
          isOverridden: false,
          isExtra: false,
          ruleHash: 'hash2',
        },
      ];

      const testState = createTestTripState({});
      const tripId = testState.trips.selectedTripId!;
      testState.trips.byId[tripId].calculated.packingListItems = items;

      const toggleAction = {
        type: 'TOGGLE_ITEM_PACKED' as const,
        payload: {
          itemId: 'item-1',
        },
      };

      const resultState = toggleItemPackedHandler(testState, toggleAction);
      const resultTripData = resultState.trips.byId[tripId];
      expect(resultTripData.calculated.packingListItems[0].isPacked).toBe(true);
      expect(resultTripData.calculated.packingListItems[1].isPacked).toBe(
        false
      );
    });
  });

  describe('updatePackingListView', () => {
    it('should update view mode', () => {
      const testState = createTestTripState({});
      const updateAction = {
        type: 'UPDATE_PACKING_LIST_VIEW' as const,
        payload: {
          viewMode: 'by-person' as PackingListViewState['viewMode'],
        },
      };

      const resultState = updatePackingListViewHandler(testState, updateAction);
      const tripId = resultState.trips.selectedTripId!;
      const resultTripData = resultState.trips.byId[tripId];
      expect(resultTripData.packingListView.viewMode).toBe('by-person');
    });

    it('should update filters', () => {
      const testState = createTestTripState({});
      const updateAction = {
        type: 'UPDATE_PACKING_LIST_VIEW' as const,
        payload: {
          filters: {
            packed: false,
            unpacked: true,
            excluded: true,
          },
        },
      };

      const resultState = updatePackingListViewHandler(testState, updateAction);
      const tripId = resultState.trips.selectedTripId!;
      const resultTripData = resultState.trips.byId[tripId];
      expect(resultTripData.packingListView.filters).toEqual({
        packed: false,
        unpacked: true,
        excluded: true,
      });
    });

    it('should preserve existing view state when updating partially', () => {
      const testState = createTestTripState({});
      const tripId = testState.trips.selectedTripId!;

      // Set initial view state
      testState.trips.byId[tripId].packingListView = {
        viewMode: 'by-day',
        filters: {
          packed: true,
          unpacked: true,
          excluded: false,
        },
      };

      const updateAction = {
        type: 'UPDATE_PACKING_LIST_VIEW' as const,
        payload: {
          filters: {
            packed: false,
            unpacked: true,
            excluded: true,
          },
        },
      };

      const resultState = updatePackingListViewHandler(testState, updateAction);
      const resultTripData = resultState.trips.byId[tripId];
      expect(resultTripData.packingListView).toEqual({
        viewMode: 'by-day', // Preserved
        filters: {
          packed: false,
          unpacked: true,
          excluded: true,
        },
      });
    });
  });
});

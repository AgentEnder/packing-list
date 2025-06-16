import { describe, it, expect } from 'vitest';
import { upsertSyncedDefaultItemRule } from './sync-integration.js';
import {
  createTestTripState,
  createTestPerson,
} from '../../__tests__/test-helpers.js';
import type { DefaultItemRule } from '@packing-list/model';

describe('Sync Integration - Item Recalculation', () => {
  it('should recalculate items when a rule is synced from server', () => {
    // Create initial state with a trip but no rules
    const initialState = createTestTripState({
      people: [
        createTestPerson({
          id: 'person1',
          name: 'Alice',
          age: 25,
          gender: 'female',
        }),
      ],
    });
    const tripId = initialState.trips.selectedTripId!;

    // Add some days to the trip
    initialState.trips.byId[tripId].trip.days = [
      {
        date: new Date('2024-01-01').getTime(),
        expectedClimate: 'sunny',
        location: 'beach',
        items: [],
        travel: false,
      },
    ];

    // Verify no items initially
    expect(
      initialState.trips.byId[tripId].calculated.packingListItems
    ).toHaveLength(0);

    // Create a rule that should generate items
    const syncedRule: DefaultItemRule = {
      id: 'rule1',
      name: 'Sunscreen',
      calculation: {
        baseQuantity: 1,
        perPerson: true,
        perDay: false,
      },
      conditions: [],
      notes: '',
      categoryId: '',
      subcategoryId: '',
      packIds: [],
      originalRuleId: 'original-rule-1',
    };

    // Sync the rule from server
    const resultState = upsertSyncedDefaultItemRule(initialState, {
      type: 'UPSERT_SYNCED_DEFAULT_ITEM_RULE',
      payload: { rule: syncedRule, tripId },
    });

    // Verify that items were calculated
    const packingListItems =
      resultState.trips.byId[tripId].calculated.packingListItems;
    expect(packingListItems).toHaveLength(1);
    expect(packingListItems[0].name).toContain('Sunscreen');
    expect(packingListItems[0].personName).toBe('Alice');
  });

  it('should recalculate items when a rule with conditions is synced', () => {
    // Create initial state with a trip and people
    const initialState = createTestTripState({
      people: [
        createTestPerson({
          id: 'person1',
          name: 'Child',
          age: 10,
          gender: 'other',
        }),
        createTestPerson({
          id: 'person2',
          name: 'Adult',
          age: 30,
          gender: 'other',
        }),
      ],
    });
    const tripId = initialState.trips.selectedTripId!;

    // Add some days to the trip
    initialState.trips.byId[tripId].trip.days = [
      {
        date: new Date('2024-01-01').getTime(),
        expectedClimate: 'sunny',
        location: 'beach',
        items: [],
        travel: false,
      },
    ];

    // Create a rule with age condition
    const syncedRule: DefaultItemRule = {
      id: 'rule1',
      name: 'Wine',
      calculation: {
        baseQuantity: 1,
        perPerson: true,
        perDay: false,
      },
      conditions: [
        {
          type: 'person',
          field: 'age',
          operator: '>=',
          value: 21,
        },
      ],
      notes: '',
      categoryId: '',
      subcategoryId: '',
      packIds: [],
      originalRuleId: 'original-rule-1',
    };

    // Sync the rule from server
    const resultState = upsertSyncedDefaultItemRule(initialState, {
      type: 'UPSERT_SYNCED_DEFAULT_ITEM_RULE',
      payload: { rule: syncedRule, tripId },
    });

    // Verify that items were calculated only for the adult
    const packingListItems =
      resultState.trips.byId[tripId].calculated.packingListItems;
    expect(packingListItems).toHaveLength(1);
    expect(packingListItems[0].name).toContain('Wine');
    expect(packingListItems[0].personName).toBe('Adult');
  });
});

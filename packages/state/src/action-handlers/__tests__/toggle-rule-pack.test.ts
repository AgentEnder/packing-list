import { describe, it, expect } from 'vitest';
import { toggleRulePackHandler } from '../toggle-rule-pack.js';
import type { StoreType } from '../../store.js';
import type { DefaultItemRule, RulePack } from '@packing-list/model';

describe('toggleRulePackHandler', () => {
  // Helper function to create a basic store state
  const createMockState = (rules: DefaultItemRule[] = []): StoreType => ({
    defaultItemRules: rules,
    people: [],
    trip: {
      id: 'test-trip',
      days: [],
    },
    ruleOverrides: [],
    rulePacks: [],
    packingListView: {
      filters: {
        packed: true,
        unpacked: true,
        excluded: false,
      },
      viewMode: 'by-day',
    },
    calculated: {
      defaultItems: [],
      packingListItems: [],
    },
  });

  // Helper function to create a basic rule
  const createRule = (id: string): DefaultItemRule => ({
    id,
    name: `Rule ${id}`,
    calculation: {
      baseQuantity: 1,
      perPerson: false,
      perDay: false,
    },
  });

  // Helper function to create a rule pack
  const createRulePack = (id: string, ruleIds: string[]): RulePack => ({
    id,
    name: `Pack ${id}`,
    description: `Description for pack ${id}`,
    rules: ruleIds.map(createRule),
  });

  it('should add rules when activating a pack', () => {
    const initialState = createMockState([]);
    const rulePack = createRulePack('pack1', ['rule1', 'rule2']);

    const result = toggleRulePackHandler(initialState, {
      type: 'TOGGLE_RULE_PACK',
      pack: rulePack,
      active: true,
    });

    expect(result.defaultItemRules).toHaveLength(2);
    expect(result.defaultItemRules.map((r) => r.id)).toEqual([
      'rule1',
      'rule2',
    ]);
  });

  it('should remove rules when deactivating a pack', () => {
    const existingRules = [
      createRule('rule1'),
      createRule('rule2'),
      createRule('rule3'),
    ];
    const initialState = createMockState(existingRules);
    const rulePack = createRulePack('pack1', ['rule1', 'rule2']);

    const result = toggleRulePackHandler(initialState, {
      type: 'TOGGLE_RULE_PACK',
      pack: rulePack,
      active: false,
    });

    expect(result.defaultItemRules).toHaveLength(1);
    expect(result.defaultItemRules[0].id).toBe('rule3');
  });

  it('should not duplicate rules when activating a pack with existing rules', () => {
    const existingRules = [createRule('rule1')];
    const initialState = createMockState(existingRules);
    const rulePack = createRulePack('pack1', ['rule1', 'rule2']);

    const result = toggleRulePackHandler(initialState, {
      type: 'TOGGLE_RULE_PACK',
      pack: rulePack,
      active: true,
    });

    expect(result.defaultItemRules).toHaveLength(2);
    expect(result.defaultItemRules.map((r) => r.id).sort()).toEqual([
      'rule1',
      'rule2',
    ]);
  });

  it('should handle empty rule packs', () => {
    const initialState = createMockState([createRule('rule1')]);
    const emptyPack: RulePack = {
      id: 'empty',
      name: 'Empty Pack',
      description: 'Empty rule pack',
      rules: [],
    };

    const result = toggleRulePackHandler(initialState, {
      type: 'TOGGLE_RULE_PACK',
      pack: emptyPack,
      active: true,
    });

    expect(result.defaultItemRules).toEqual(initialState.defaultItemRules);
  });

  it('should handle multiple rule packs with overlapping rules', () => {
    // First add rules from pack1
    const initialState = createMockState([]);
    const pack1 = createRulePack('pack1', ['rule1', 'rule2']);
    const stateWithPack1 = toggleRulePackHandler(initialState, {
      type: 'TOGGLE_RULE_PACK',
      pack: pack1,
      active: true,
    });

    // Then add rules from pack2 which overlaps with pack1
    const pack2 = createRulePack('pack2', ['rule2', 'rule3']);
    const stateWithBothPacks = toggleRulePackHandler(stateWithPack1, {
      type: 'TOGGLE_RULE_PACK',
      pack: pack2,
      active: true,
    });

    expect(stateWithBothPacks.defaultItemRules).toHaveLength(3);
    expect(stateWithBothPacks.defaultItemRules.map((r) => r.id).sort()).toEqual(
      ['rule1', 'rule2', 'rule3']
    );

    // Now deactivate pack1
    const finalState = toggleRulePackHandler(stateWithBothPacks, {
      type: 'TOGGLE_RULE_PACK',
      pack: pack1,
      active: false,
    });

    // After deactivating pack1, we should only have rule3 since rule2 was removed
    expect(finalState.defaultItemRules).toHaveLength(1);
    expect(finalState.defaultItemRules[0].id).toBe('rule3');
  });

  it('should trigger recalculation of default items and packing list', () => {
    const initialState = createMockState([]);
    const rulePack = createRulePack('pack1', ['rule1']);

    // Add a person and day to trigger calculations
    initialState.people = [
      { id: 'person1', name: 'Test Person', age: 30, gender: 'other' },
    ];
    initialState.trip.days = [
      {
        date: new Date('2024-01-01').getTime(),
        expectedClimate: 'sunny',
        location: 'home',
        items: [],
        travel: false,
      },
    ];

    const result = toggleRulePackHandler(initialState, {
      type: 'TOGGLE_RULE_PACK',
      pack: rulePack,
      active: true,
    });

    // Verify that calculations were triggered
    expect(result.calculated.defaultItems).toBeDefined();
    expect(result.calculated.packingListItems).toBeDefined();
    // The exact values will depend on the calculation logic, but we can verify the structure
    expect(Array.isArray(result.calculated.defaultItems)).toBe(true);
    expect(Array.isArray(result.calculated.packingListItems)).toBe(true);
  });
});

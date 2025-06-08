import { describe, it, expect } from 'vitest';
import { toggleRulePackHandler } from '../toggle-rule-pack.js';
import type { StoreType } from '../../store.js';
import type { DefaultItemRule, RulePack } from '@packing-list/model';
import { createTestTripState } from '../../__tests__/test-helpers.js';

describe('toggleRulePackHandler', () => {
  // Helper function to create a basic store state with multi-trip structure
  const createMockState = (rules: DefaultItemRule[] = []): StoreType => {
    const state = createTestTripState({});
    state.defaultItemRules = rules;
    return state;
  };

  // Helper function to create a basic rule
  const createRule = (id: string, packIds?: string[]): DefaultItemRule => ({
    id,
    name: `Rule ${id}`,
    calculation: {
      baseQuantity: 1,
      perPerson: false,
      perDay: false,
    },
    packIds,
  });

  // Helper function to create a rule pack
  const createRulePack = (id: string, ruleIds: string[]): RulePack => ({
    id,
    name: `Pack ${id}`,
    description: `Description for pack ${id}`,
    rules: ruleIds.map((id) => createRule(id)),
    author: { id: 'test', name: 'Test Author' },
    metadata: {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      isBuiltIn: false,
      isShared: false,
      visibility: 'private',
      tags: [],
      category: 'test',
      version: '1.0.0',
    },
    stats: {
      usageCount: 0,
      rating: 5,
      reviewCount: 0,
    },
  });

  describe('activating packs', () => {
    it('should initialize packIds when adding new rules', () => {
      const initialState = createMockState([]);
      const rulePack = createRulePack('pack1', ['rule1', 'rule2']);

      const result = toggleRulePackHandler(initialState, {
        type: 'TOGGLE_RULE_PACK',
        pack: rulePack,
        active: true,
      });

      expect(result.defaultItemRules).toHaveLength(2);
      result.defaultItemRules.forEach((rule) => {
        expect(rule.packIds).toEqual(['pack1']);
      });
    });

    it('should add pack association to existing rules without duplicates', () => {
      const existingRule = createRule('rule1', ['existing-pack']);
      const initialState = createMockState([existingRule]);
      const rulePack = createRulePack('pack1', ['rule1']);

      const result = toggleRulePackHandler(initialState, {
        type: 'TOGGLE_RULE_PACK',
        pack: rulePack,
        active: true,
      });

      expect(result.defaultItemRules).toHaveLength(1);
      expect(result.defaultItemRules[0].packIds).toEqual([
        'existing-pack',
        'pack1',
      ]);
    });

    it('should not duplicate pack associations when activating the same pack twice', () => {
      const initialState = createMockState([]);
      const rulePack = createRulePack('pack1', ['rule1']);

      // Activate first time
      const firstResult = toggleRulePackHandler(initialState, {
        type: 'TOGGLE_RULE_PACK',
        pack: rulePack,
        active: true,
      });

      // Activate second time
      const finalResult = toggleRulePackHandler(firstResult, {
        type: 'TOGGLE_RULE_PACK',
        pack: rulePack,
        active: true,
      });

      expect(finalResult.defaultItemRules[0].packIds).toEqual(['pack1']);
    });
  });

  describe('deactivating packs', () => {
    it('should remove pack association when deactivating', () => {
      const rule = createRule('rule1', ['pack1', 'pack2']);
      const initialState = createMockState([rule]);
      const rulePack = createRulePack('pack1', ['rule1']);

      const result = toggleRulePackHandler(initialState, {
        type: 'TOGGLE_RULE_PACK',
        pack: rulePack,
        active: false,
      });

      expect(result.defaultItemRules[0].packIds).toEqual(['pack2']);
    });

    it('should remove rules that have no remaining pack associations', () => {
      const rule = createRule('rule1', ['pack1']);
      const initialState = createMockState([rule]);
      const rulePack = createRulePack('pack1', ['rule1']);

      const result = toggleRulePackHandler(initialState, {
        type: 'TOGGLE_RULE_PACK',
        pack: rulePack,
        active: false,
      });

      expect(result.defaultItemRules).toHaveLength(0);
    });

    it('should keep rules that still have other pack associations', () => {
      const rule1 = createRule('rule1', ['pack1', 'pack2']);
      const rule2 = createRule('rule2', ['pack1']);
      const initialState = createMockState([rule1, rule2]);
      const rulePack = createRulePack('pack1', ['rule1', 'rule2']);

      const result = toggleRulePackHandler(initialState, {
        type: 'TOGGLE_RULE_PACK',
        pack: rulePack,
        active: false,
      });

      expect(result.defaultItemRules).toHaveLength(1);
      expect(result.defaultItemRules[0].id).toBe('rule1');
      expect(result.defaultItemRules[0].packIds).toEqual(['pack2']);
    });
  });

  describe('complex scenarios', () => {
    it('should handle multiple packs with overlapping rules correctly', () => {
      const initialState = createMockState([]);
      const pack1 = createRulePack('pack1', ['rule1', 'rule2']);
      const pack2 = createRulePack('pack2', ['rule2', 'rule3']);

      // Add pack1
      const stateWithPack1 = toggleRulePackHandler(initialState, {
        type: 'TOGGLE_RULE_PACK',
        pack: pack1,
        active: true,
      });

      // Add pack2
      const stateWithBothPacks = toggleRulePackHandler(stateWithPack1, {
        type: 'TOGGLE_RULE_PACK',
        pack: pack2,
        active: true,
      });

      // Verify both packs added correctly
      expect(stateWithBothPacks.defaultItemRules).toHaveLength(3);
      const rule2 = stateWithBothPacks.defaultItemRules.find(
        (r) => r.id === 'rule2'
      );
      expect(rule2?.packIds).toEqual(['pack1', 'pack2']);

      // Remove pack1 - rule2 should still exist because it's in pack2
      const finalState = toggleRulePackHandler(stateWithBothPacks, {
        type: 'TOGGLE_RULE_PACK',
        pack: pack1,
        active: false,
      });

      expect(finalState.defaultItemRules).toHaveLength(2);
      expect(finalState.defaultItemRules.map((r) => r.id)).toEqual([
        'rule2',
        'rule3',
      ]);
    });

    it('should handle rules with no initial packIds array', () => {
      const rule = createRule('rule1'); // No packIds
      const initialState = createMockState([rule]);
      const rulePack = createRulePack('pack1', ['rule1']);

      const result = toggleRulePackHandler(initialState, {
        type: 'TOGGLE_RULE_PACK',
        pack: rulePack,
        active: true,
      });

      expect(result.defaultItemRules[0].packIds).toEqual(['pack1']);
    });
  });

  it('should add rules when activating a pack', () => {
    const initialState = createMockState();
    const rulePack = createRulePack('pack1', ['rule1', 'rule2']);

    const result = toggleRulePackHandler(initialState, {
      type: 'TOGGLE_RULE_PACK',
      pack: rulePack,
      active: true,
    });

    expect(result.defaultItemRules).toHaveLength(2);
    expect(result.defaultItemRules[0].id).toBe('rule1');
    expect(result.defaultItemRules[1].id).toBe('rule2');
  });

  it('should remove rules when deactivating a pack', () => {
    const initialState = createMockState();
    const rulePack = createRulePack('pack1', ['rule1', 'rule2']);

    // First activate the pack
    const activatedState = toggleRulePackHandler(initialState, {
      type: 'TOGGLE_RULE_PACK',
      pack: rulePack,
      active: true,
    });

    // Then deactivate it
    const result = toggleRulePackHandler(activatedState, {
      type: 'TOGGLE_RULE_PACK',
      pack: rulePack,
      active: false,
    });

    expect(result.defaultItemRules).toHaveLength(0);
  });

  it('should not duplicate rules when activating a pack with existing rules', () => {
    const existingRule = createRule('rule1');
    const initialState = createMockState([existingRule]);
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

  it('should handle empty rule packs', () => {
    const initialState = createMockState();
    const emptyPack = createRulePack('empty-pack', []);

    const result = toggleRulePackHandler(initialState, {
      type: 'TOGGLE_RULE_PACK',
      pack: emptyPack,
      active: true,
    });

    expect(result.defaultItemRules).toHaveLength(0);
  });

  it('should trigger recalculation of default items and packing list', () => {
    const initialState = createMockState();
    const tripId = initialState.trips.selectedTripId!;

    // Ensure we have empty calculated values initially
    expect(initialState.trips.byId[tripId].calculated.defaultItems).toEqual([]);
    expect(initialState.trips.byId[tripId].calculated.packingListItems).toEqual(
      []
    );

    const rulePack = createRulePack('pack1', ['rule1']);

    const result = toggleRulePackHandler(initialState, {
      type: 'TOGGLE_RULE_PACK',
      pack: rulePack,
      active: true,
    });

    // The calculated values should be updated - we expect a default item to be created
    expect(result.trips.byId[tripId].calculated).toBeDefined();
    expect(result.trips.byId[tripId].calculated.defaultItems).toHaveLength(1);
    expect(result.trips.byId[tripId].calculated.defaultItems[0].ruleId).toBe(
      'rule1'
    );
    expect(result.trips.byId[tripId].calculated.packingListItems).toEqual([]);
  });

  it('should not remove rules that are in other packs', () => {
    const rule1 = createRule('rule1', ['pack1', 'pack2']);
    const initialState = createMockState([rule1]);
    const pack1 = createRulePack('pack1', ['rule1']);

    const result = toggleRulePackHandler(initialState, {
      type: 'TOGGLE_RULE_PACK',
      pack: pack1,
      active: false,
    });

    expect(result.defaultItemRules).toHaveLength(1);
    expect(result.defaultItemRules[0].packIds).toEqual(['pack2']);
  });

  it('should not remove rules which were never in a pack', () => {
    const rule1 = createRule('rule1'); // No pack association
    const initialState = createMockState([rule1]);
    const pack1 = createRulePack('pack1', ['rule2']); // Different rule

    const result = toggleRulePackHandler(initialState, {
      type: 'TOGGLE_RULE_PACK',
      pack: pack1,
      active: false,
    });

    expect(result.defaultItemRules).toHaveLength(1);
    expect(result.defaultItemRules[0].id).toBe('rule1');
  });
});

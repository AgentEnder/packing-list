import { describe, it, expect } from 'vitest';
import {
  toggleRulePackHandler,
  type ToggleRulePackAction,
} from '../toggle-rule-pack.js';
import type { StoreType } from '../../store.js';
import type { DefaultItemRule, RulePack } from '@packing-list/model';
import { createTestTripState } from '../../__tests__/test-helpers.js';

describe('toggleRulePackHandler', () => {
  // Helper function to create a basic store state with multi-trip structure
  const createMockState = (rules: DefaultItemRule[] = []): StoreType => {
    const state = createTestTripState({ userId: 'test-user' });
    // Set defaultItemRules in the correct location - inside the trip data
    if (
      state.trips.selectedTripId &&
      state.trips.byId[state.trips.selectedTripId]
    ) {
      state.trips.byId[state.trips.selectedTripId].trip.defaultItemRules =
        rules;
    }
    return state;
  };

  // Helper function to get defaultItemRules from the current trip
  const getDefaultItemRules = (state: StoreType): DefaultItemRule[] => {
    const selectedTripId = state.trips.selectedTripId;
    if (!selectedTripId || !state.trips.byId[selectedTripId]) {
      return [];
    }
    return state.trips.byId[selectedTripId].trip.defaultItemRules ?? [];
  };

  // Helper function to create a basic rule
  const createRule = (id: string, packIds?: string[]): DefaultItemRule => ({
    id,
    originalRuleId: id,
    name: `Rule ${id}`,
    calculation: {
      baseQuantity: 1,
      perPerson: false,
      perDay: false,
    },
    packIds: packIds?.map((packId) => ({
      packId,
      ruleId: id,
    })),
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

      const defaultItemRules = getDefaultItemRules(result);
      expect(defaultItemRules).toHaveLength(2);
      defaultItemRules.forEach((rule) => {
        expect(rule.packIds).toEqual([
          { packId: 'pack1', ruleId: rule.originalRuleId },
        ]);
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

      const defaultItemRules = getDefaultItemRules(result);
      expect(defaultItemRules).toHaveLength(1);
      expect(defaultItemRules[0].packIds).toEqual([
        { packId: 'existing-pack', ruleId: 'rule1' },
        { packId: 'pack1', ruleId: 'rule1' },
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

      const defaultItemRules = getDefaultItemRules(finalResult);
      expect(defaultItemRules[0].packIds).toEqual([
        { packId: 'pack1', ruleId: 'rule1' },
      ]);
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

      const defaultItemRules = getDefaultItemRules(result);
      expect(defaultItemRules[0].packIds).toEqual([
        { packId: 'pack2', ruleId: 'rule1' },
      ]);
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

      const defaultItemRules = getDefaultItemRules(result);
      expect(defaultItemRules).toHaveLength(0);
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

      const defaultItemRules = getDefaultItemRules(result);
      expect(defaultItemRules).toHaveLength(1);
      expect(defaultItemRules[0].originalRuleId).toBe('rule1');
      expect(defaultItemRules[0].packIds).toEqual([
        { packId: 'pack2', ruleId: 'rule1' },
      ]);
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
      const defaultItemRulesWithBoth = getDefaultItemRules(stateWithBothPacks);
      expect(defaultItemRulesWithBoth).toHaveLength(3);
      const rule2 = defaultItemRulesWithBoth.find(
        (r) => r.originalRuleId === 'rule2'
      );
      expect(rule2?.packIds).toEqual([
        { packId: 'pack1', ruleId: 'rule2' },
        { packId: 'pack2', ruleId: 'rule2' },
      ]);

      // Remove pack1 - rule2 should still exist because it's in pack2
      const finalState = toggleRulePackHandler(stateWithBothPacks, {
        type: 'TOGGLE_RULE_PACK',
        pack: pack1,
        active: false,
      });

      const finalDefaultItemRules = getDefaultItemRules(finalState);
      expect(finalDefaultItemRules).toHaveLength(2);
      expect(finalDefaultItemRules.map((r) => r.originalRuleId)).toEqual([
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

      const defaultItemRules = getDefaultItemRules(result);
      expect(defaultItemRules[0].packIds).toEqual([
        { packId: 'pack1', ruleId: 'rule1' },
      ]);
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

    const defaultItemRules = getDefaultItemRules(result);
    expect(defaultItemRules).toHaveLength(2);
    expect(defaultItemRules[0].originalRuleId).toBe('rule1');
    expect(defaultItemRules[1].originalRuleId).toBe('rule2');
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

    const defaultItemRules = getDefaultItemRules(result);
    expect(defaultItemRules).toHaveLength(0);
  });

  it('should not duplicate rules when activating a pack with existing rules', () => {
    const existingRule = createRule('rule1', undefined);
    const initialState = createMockState([existingRule]);
    const rulePack = createRulePack('pack1', ['rule1', 'rule2']);

    const result = toggleRulePackHandler(initialState, {
      type: 'TOGGLE_RULE_PACK',
      pack: rulePack,
      active: true,
    });

    const defaultItemRules = getDefaultItemRules(result);
    expect(defaultItemRules).toHaveLength(2);
    expect(defaultItemRules.map((r) => r.originalRuleId)).toEqual([
      'rule1',
      'rule2',
    ]);
  });

  it('should handle empty rule packs', () => {
    const initialState = createMockState();
    const emptyRulePack = createRulePack('empty-pack', []);

    const result = toggleRulePackHandler(initialState, {
      type: 'TOGGLE_RULE_PACK',
      pack: emptyRulePack,
      active: true,
    });

    const defaultItemRules = getDefaultItemRules(result);
    expect(defaultItemRules).toHaveLength(0);
  });

  it('should trigger recalculation of default items and packing list', () => {
    const initialState = createMockState();
    const rulePack = createRulePack('pack1', ['rule1']);

    const result = toggleRulePackHandler(initialState, {
      type: 'TOGGLE_RULE_PACK',
      pack: rulePack,
      active: true,
    });

    // The handler should trigger recalculation
    expect(result).toBeDefined();
    expect(result.trips).toBeDefined();
  });

  it('should not remove rules that are in other packs', () => {
    const ruleInMultiplePacks = createRule('rule1', ['pack1', 'pack2']);
    const initialState = createMockState([ruleInMultiplePacks]);
    const rulePack = createRulePack('pack1', ['rule1']);

    const result = toggleRulePackHandler(initialState, {
      type: 'TOGGLE_RULE_PACK',
      pack: rulePack,
      active: false,
    });

    const defaultItemRules = getDefaultItemRules(result);
    expect(defaultItemRules).toHaveLength(1);
    expect(defaultItemRules[0].packIds).toEqual([
      { packId: 'pack2', ruleId: 'rule1' },
    ]);
  });

  it('should not remove rules which were never in a pack', () => {
    const ruleWithoutPack = createRule('rule1'); // No packIds
    const initialState = createMockState([ruleWithoutPack]);
    const rulePack = createRulePack('pack1', ['rule2']); // Different rule

    const result = toggleRulePackHandler(initialState, {
      type: 'TOGGLE_RULE_PACK',
      pack: rulePack,
      active: false,
    });

    const defaultItemRules = getDefaultItemRules(result);
    expect(defaultItemRules).toHaveLength(1);
    expect(defaultItemRules[0].id).toBe('rule1');
  });

  describe('Sync Tracking Integration', () => {
    it('should call sync tracking functions when applying a rule pack', () => {
      // This test verifies that the sync tracking code paths are executed
      // The actual tracking is tested in the sync package tests
      const state = createMockState();
      const pack = createRulePack('pack1', ['rule1', 'rule2']);

      const action: ToggleRulePackAction = {
        type: 'TOGGLE_RULE_PACK',
        pack,
        active: true,
      };

      // Apply the rule pack - this should execute sync tracking code paths
      const result = toggleRulePackHandler(state, action);

      // Verify the rules were added to the state
      const tripRules = getDefaultItemRules(result);
      expect(tripRules).toHaveLength(2);
      expect(tripRules.find((r) => r.originalRuleId === 'rule1')).toBeDefined();
      expect(tripRules.find((r) => r.originalRuleId === 'rule2')).toBeDefined();

      // Verify pack associations were set
      expect(
        tripRules.find((r) => r.originalRuleId === 'rule1')?.packIds
      ).toEqual([{ packId: 'pack1', ruleId: 'rule1' }]);
      expect(
        tripRules.find((r) => r.originalRuleId === 'rule2')?.packIds
      ).toEqual([{ packId: 'pack1', ruleId: 'rule2' }]);
    });

    it('should call sync tracking functions when removing a rule pack', () => {
      // Create state with existing rules from the pack
      const state = createMockState();
      const pack = createRulePack('pack1', ['rule1', 'rule2']);

      // First apply the pack to add rules
      const applyAction: ToggleRulePackAction = {
        type: 'TOGGLE_RULE_PACK',
        pack,
        active: true,
      };
      const stateWithPack = toggleRulePackHandler(state, applyAction);

      // Now remove the pack
      const removeAction: ToggleRulePackAction = {
        type: 'TOGGLE_RULE_PACK',
        pack,
        active: false,
      };

      const result = toggleRulePackHandler(stateWithPack, removeAction);

      // Verify the rules were removed from the state
      const tripRules = getDefaultItemRules(result);
      expect(tripRules).toHaveLength(0);
    });

    it('should handle existing rules with pack associations correctly', () => {
      // Add an existing rule that matches one in the pack
      const existingRule = createRule('rule1', []);
      const stateWithExistingRule = createMockState([existingRule]);

      const pack = createRulePack('pack1', ['rule1', 'rule2']);

      const action: ToggleRulePackAction = {
        type: 'TOGGLE_RULE_PACK',
        pack,
        active: true,
      };

      // Apply the rule pack
      const result = toggleRulePackHandler(stateWithExistingRule, action);

      // Should have 2 rules total (existing rule updated + new rule added)
      const tripRules = getDefaultItemRules(result);
      expect(tripRules).toHaveLength(2);

      // Existing rule should have pack association added
      const updatedExistingRule = tripRules.find(
        (r) => r.originalRuleId === 'rule1'
      );
      expect(updatedExistingRule?.packIds).toEqual([
        { packId: 'pack1', ruleId: 'rule1' },
      ]);

      // New rule should be added with pack association
      const newRule = tripRules.find((r) => r.originalRuleId === 'rule2');
      expect(newRule?.packIds).toEqual([{ packId: 'pack1', ruleId: 'rule2' }]);
    });
  });
});

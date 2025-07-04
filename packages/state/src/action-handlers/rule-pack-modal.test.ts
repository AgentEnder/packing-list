import { describe, it, expect } from 'vitest';
import {
  openRulePackModalHandler,
  closeRulePackModalHandler,
  setRulePackModalTabHandler,
} from './rule-pack-modal.js';
import { createTestTripState } from '../__tests__/test-helpers.js';

describe('rule pack modal handlers', () => {
  it('opens the modal with defaults', () => {
    const state = createTestTripState({});
    const result = openRulePackModalHandler(state, {
      type: 'OPEN_RULE_PACK_MODAL',
    });
    expect(result.ui.rulePackModal).toEqual({
      isOpen: true,
      activeTab: 'browse',
      selectedPackId: undefined,
    });
  });

  it('opens the modal with provided tab', () => {
    const state = createTestTripState({});
    const action = {
      type: 'OPEN_RULE_PACK_MODAL' as const,
      payload: { tab: 'manage', packId: 'p1' },
    };
    const result = openRulePackModalHandler(state, action);
    expect(result.ui.rulePackModal).toEqual({
      isOpen: true,
      activeTab: 'manage',
      selectedPackId: 'p1',
    });
  });

  it('closes the modal and resets state', () => {
    const state = createTestTripState({});
    state.ui.rulePackModal.isOpen = true;
    const result = closeRulePackModalHandler(state, {
      type: 'CLOSE_RULE_PACK_MODAL',
    });
    expect(result.ui.rulePackModal).toEqual({
      isOpen: false,
      activeTab: 'browse',
      selectedPackId: undefined,
    });
  });

  it('changes tabs without closing', () => {
    const state = createTestTripState({});
    state.ui.rulePackModal.isOpen = true;
    const action = {
      type: 'SET_RULE_PACK_MODAL_TAB' as const,
      payload: { tab: 'details', packId: 'p2' },
    };
    const result = setRulePackModalTabHandler(state, action);
    expect(result.ui.rulePackModal).toEqual({
      isOpen: true,
      activeTab: 'details',
      selectedPackId: 'p2',
    });
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { triggerConfettiBurstHandler } from './trigger-confetti-burst.js';
import { createTestTripState } from '../__tests__/test-helpers.js';

describe('triggerConfettiBurstHandler', () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it('returns state unchanged when prefers reduced motion', () => {
    const state = createTestTripState({});
    const result = triggerConfettiBurstHandler(state, {
      type: 'TRIGGER_CONFETTI_BURST',
    });
    expect(result).toEqual(state);
  });

  it('updates confetti state when motion allowed', () => {
    globalThis.window = {
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
    } as unknown as Window;

    const state = createTestTripState({});
    const result = triggerConfettiBurstHandler(state, {
      type: 'TRIGGER_CONFETTI_BURST',
      payload: { x: 10, y: 20 },
    });

    expect(result.ui.confetti.burstId).toBe(state.ui.confetti.burstId + 1);
    expect(result.ui.confetti.source).toEqual({ x: 10, y: 20, w: 0, h: 0 });
  });
});

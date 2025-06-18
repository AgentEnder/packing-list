import { StoreType } from '../store.js';

export type TriggerConfettiBurstAction = {
  type: 'TRIGGER_CONFETTI_BURST';
  payload?: { x: number; y: number; w?: number; h?: number };
};

/**
 * Safely checks if the user prefers reduced motion
 * Returns true if motion should be reduced, false otherwise
 * Safe for SSR - returns true (conservative default) when window is not available
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') {
    return true; // Conservative default for SSR
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const triggerConfettiBurstHandler = (
  state: StoreType,
  action: TriggerConfettiBurstAction
): StoreType => {
  // Check if user prefers reduced motion - if so, don't trigger confetti
  if (prefersReducedMotion()) {
    return state; // No state change, effectively skipping the confetti
  }

  return {
    ...state,
    ui: {
      ...state.ui,
      confetti: {
        burstId: state.ui.confetti.burstId + 1,
        source: action.payload
          ? {
              x: action.payload.x,
              y: action.payload.y,
              w: action.payload.w ?? 0,
              h: action.payload.h ?? 0,
            }
          : null,
      },
    },
  };
};

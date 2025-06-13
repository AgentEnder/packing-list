import { StoreType } from '../store.js';

export type TriggerConfettiBurstAction = {
  type: 'TRIGGER_CONFETTI_BURST';
  payload?: { x: number; y: number; w?: number; h?: number };
};

export const triggerConfettiBurstHandler = (
  state: StoreType,
  action: TriggerConfettiBurstAction
): StoreType => {
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

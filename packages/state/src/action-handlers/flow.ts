import { StoreType } from '../store.js';

export type InitFlowAction = {
  type: 'INIT_FLOW';
  payload: {
    steps: {
      label: string;
      path: string;
    }[];
    current?: number;
  };
};

export type AdvanceFlowAction = {
  type: 'ADVANCE_FLOW';
  payload: {
    direction: 1 | -1;
  };
};

export type ResetFlowAction = {
  type: 'RESET_FLOW';
};

export const initFlowHandler = (
  state: StoreType,
  action: InitFlowAction
): StoreType => {
  return {
    ...state,
    ui: {
      ...state.ui,
      flow: {
        current: action.payload.current ?? 0,
        steps: action.payload.steps,
      },
    },
  };
};

export const advanceFlowHandler = (
  state: StoreType,
  action: AdvanceFlowAction
): StoreType => {
  return {
    ...state,
    ui: {
      ...state.ui,
      flow: {
        current:
          state.ui.flow.current !== null
            ? (state.ui.flow?.current ?? 0) + action.payload.direction
            : null,
        steps: state.ui.flow?.steps ?? [],
      },
    },
  };
};

export const resetFlowHandler = (state: StoreType): StoreType => {
  return {
    ...state,
    ui: {
      ...state.ui,
      flow: {
        current: 0,
        steps: [],
      },
    },
  };
};

export const initFlow = (
  payload: InitFlowAction['payload']
): InitFlowAction => {
  return {
    type: 'INIT_FLOW',
    payload,
  };
};

export const advanceFlow = (direction?: 1 | -1): AdvanceFlowAction => {
  return {
    type: 'ADVANCE_FLOW',
    payload: {
      direction: direction ?? 1,
    },
  };
};

export const resetFlow = (): ResetFlowAction => {
  return {
    type: 'RESET_FLOW',
  };
};

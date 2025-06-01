import { StoreType } from '../store.js';

export type OpenRulePackModalAction = {
  type: 'OPEN_RULE_PACK_MODAL';
  payload?: {
    tab: 'browse' | 'manage' | 'details';
    packId?: string;
  };
};

export type CloseRulePackModalAction = {
  type: 'CLOSE_RULE_PACK_MODAL';
};

export type SetRulePackModalTabAction = {
  type: 'SET_RULE_PACK_MODAL_TAB';
  payload: {
    tab: 'browse' | 'manage' | 'details';
    packId?: string;
  };
};

export const openRulePackModalHandler = (
  state: StoreType,
  action: OpenRulePackModalAction
): StoreType => {
  return {
    ...state,
    ui: {
      ...state.ui,
      rulePackModal: {
        isOpen: true,
        activeTab: action.payload?.tab || 'browse',
        selectedPackId: action.payload?.packId,
      },
    },
  };
};

export const closeRulePackModalHandler = (state: StoreType): StoreType => {
  return {
    ...state,
    ui: {
      ...state.ui,
      rulePackModal: {
        isOpen: false,
        activeTab: 'browse',
        selectedPackId: undefined,
      },
    },
  };
};

export const setRulePackModalTabHandler = (
  state: StoreType,
  action: SetRulePackModalTabAction
): StoreType => {
  return {
    ...state,
    ui: {
      ...state.ui,
      rulePackModal: {
        ...state.ui.rulePackModal,
        activeTab: action.payload.tab,
        selectedPackId: action.payload.packId,
      },
    },
  };
};

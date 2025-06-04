import { StoreType } from '../store.js';

export type OpenLoginModalAction = {
  type: 'OPEN_LOGIN_MODAL';
};

export type CloseLoginModalAction = {
  type: 'CLOSE_LOGIN_MODAL';
};

export const openLoginModalHandler = (
  state: StoreType,
  action: OpenLoginModalAction
): StoreType => {
  return {
    ...state,
    ui: {
      ...state.ui,
      loginModal: {
        isOpen: true,
      },
    },
  };
};

export const closeLoginModalHandler = (
  state: StoreType,
  action: CloseLoginModalAction
): StoreType => {
  return {
    ...state,
    ui: {
      ...state.ui,
      loginModal: {
        isOpen: false,
      },
    },
  };
};

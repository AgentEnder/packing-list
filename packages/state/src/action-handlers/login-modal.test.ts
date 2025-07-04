import { describe, it, expect } from 'vitest';
import {
  openLoginModalHandler,
  closeLoginModalHandler,
} from './login-modal.js';
import { createTestTripState } from '../__tests__/test-helpers.js';

describe('login modal handlers', () => {
  it('opens the login modal', () => {
    const state = createTestTripState({});
    const result = openLoginModalHandler(state);
    expect(result.ui.loginModal.isOpen).toBe(true);
  });

  it('closes the login modal', () => {
    const state = {
      ...createTestTripState({}),
      ui: {
        ...createTestTripState({}).ui,
        loginModal: {
          isOpen: true,
        },
      },
    };
    const result = closeLoginModalHandler(state);
    expect(result.ui.loginModal.isOpen).toBe(false);
  });
});

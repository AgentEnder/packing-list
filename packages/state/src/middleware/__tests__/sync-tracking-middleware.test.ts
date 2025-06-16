import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createStore } from '../../store.js';
import { createTestTripState } from '../../__tests__/test-helpers.js';

describe('syncTrackingMiddleware', () => {
  let store: ReturnType<typeof createStore>;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock console.log to capture middleware logs
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    // Create store with proper test state
    const testState = createTestTripState({
      tripId: 'test-trip-123',
    });

    // Set authenticated user
    testState.auth.user = {
      id: 'test-user-123',
      email: 'test@example.com',
      type: 'remote',
    };
    testState.auth.isInitialized = true;

    store = createStore(undefined, testState);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('middleware integration', () => {
    it('should intercept and analyze actions', () => {
      // Dispatch any action
      store.dispatch({
        type: 'ADD_PERSON',
        payload: { id: 'person-1', name: 'Test Person' },
      });

      // Should log that it's analyzing the action
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '🔄 [SYNC_MIDDLEWARE] Analyzing diffs for action: ADD_PERSON'
        )
      );
    });

    it('should skip tracking for local users', () => {
      // Create store with local user
      const localTestState = createTestTripState({
        tripId: 'test-trip-123',
      });
      localTestState.auth.user = {
        id: 'local-user',
        email: 'local@example.com',
        type: 'local',
      };
      localTestState.auth.isInitialized = true;

      const localStore = createStore(undefined, localTestState);
      const localConsoleSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);

      // Dispatch an action
      localStore.dispatch({
        type: 'ADD_PERSON',
        payload: { id: 'person-1', name: 'Test Person' },
      });

      // Should log that it's skipping
      expect(localConsoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '⏭️ [SYNC_MIDDLEWARE] Skipping change tracking for action ADD_PERSON: no trip selected or local user'
        )
      );

      localConsoleSpy.mockRestore();
    });

    it('should skip tracking when no trip is selected', () => {
      // Create store with no selected trip
      const noTripTestState = createTestTripState({
        tripId: 'test-trip-123',
      });
      noTripTestState.auth.user = {
        id: 'test-user-123',
        email: 'test@example.com',
        type: 'remote',
      };
      noTripTestState.auth.isInitialized = true;
      noTripTestState.trips.selectedTripId = null; // No trip selected

      const noTripStore = createStore(undefined, noTripTestState);
      const noTripConsoleSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);

      // Dispatch an action
      noTripStore.dispatch({
        type: 'ADD_PERSON',
        payload: { id: 'person-1', name: 'Test Person' },
      });

      // Should log that it's skipping
      expect(noTripConsoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '⏭️ [SYNC_MIDDLEWARE] Skipping change tracking for action ADD_PERSON: no trip selected or local user'
        )
      );

      noTripConsoleSpy.mockRestore();
    });

    it('should detect person changes', () => {
      // Add a person
      store.dispatch({
        type: 'ADD_PERSON',
        payload: { id: 'person-1', name: 'Test Person', age: 30 },
      });

      // Should log that it detected a person change
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '👤 [SYNC_MIDDLEWARE] New person detected: person-1'
        )
      );
    });

    it('should detect rule changes', () => {
      // Create a rule
      store.dispatch({
        type: 'CREATE_ITEM_RULE',
        payload: {
          id: 'rule-1',
          name: 'Summer Clothes',
          calculation: {
            baseQuantity: 1,
            perPerson: true,
            perDay: false,
          },
          conditions: [],
        },
      });

      // Should log that it detected a rule change
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '📋 [SYNC_MIDDLEWARE] New rule detected: rule-1'
        )
      );
    });

    it('should detect rule pack changes', () => {
      // Create a rule pack
      store.dispatch({
        type: 'CREATE_RULE_PACK',
        payload: {
          id: 'pack-1',
          name: 'Beach Vacation',
          description: 'Rules for beach trips',
          rules: [],
        },
      });

      // Should log that it detected a rule pack change
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '📦 [SYNC_MIDDLEWARE] New rule pack detected: pack-1'
        )
      );
    });
  });

  describe('deep diff behavior', () => {
    it('should only track when actual state changes occur', () => {
      // Add a person first
      store.dispatch({
        type: 'ADD_PERSON',
        payload: { id: 'person-1', name: 'Test Person' },
      });

      // Clear console logs
      consoleSpy.mockClear();

      // Dispatch an action that doesn't change state
      store.dispatch({
        type: 'UNKNOWN_ACTION',
        payload: {},
      });

      // Should analyze but not detect any changes
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '🔄 [SYNC_MIDDLEWARE] Analyzing diffs for action: UNKNOWN_ACTION'
        )
      );

      // Should not log any entity changes
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('New person detected')
      );
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('New rule detected')
      );
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('New rule pack detected')
      );
    });
  });
});

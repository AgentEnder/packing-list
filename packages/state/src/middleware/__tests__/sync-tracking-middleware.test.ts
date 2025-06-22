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

      // Should log that it detected a person change
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🔄 [SYNC_MIDDLEWARE] Person created: person-1')
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

      // Should not log any entity changes for local users
      expect(localConsoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('🔄 [SYNC_MIDDLEWARE] Person created')
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

      // Should not log any entity changes when no trip is selected
      expect(noTripConsoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('🔄 [SYNC_MIDDLEWARE] Person created')
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
        expect.stringContaining('🔄 [SYNC_MIDDLEWARE] Person created: person-1')
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

      // Should log that it detected rule changes
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '🔄 [SYNC_MIDDLEWARE] Default item rule created: rule-1'
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
          '🔄 [SYNC_MIDDLEWARE] Rule pack created: pack-1'
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

      // Should not detect any changes since no state changed
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('🔄 [SYNC_MIDDLEWARE] Person created')
      );
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining(
          '🔄 [SYNC_MIDDLEWARE] Default item rule created'
        )
      );
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('🔄 [SYNC_MIDDLEWARE] Rule pack created')
      );
    });
  });

  describe('rule pack tracking', () => {
    beforeEach(() => {
      // Create a user state with a rule pack
      store.dispatch({
        type: 'auth/signInWithPassword/fulfilled',
        payload: {
          user: { id: 'test-user-123', email: 'test@example.com' },
          session: { access_token: 'token' },
        },
      });

      // Set up a trip
      store.dispatch({
        type: 'CREATE_TRIP',
        payload: {
          tripId: 'test-trip-123',
          title: 'Test Trip',
          description: 'Test description',
        },
      });

      store.dispatch({
        type: 'SELECT_TRIP',
        payload: { tripId: 'test-trip-123' },
      });

      // Add a rule pack to the state
      store.dispatch({
        type: 'CREATE_RULE_PACK',
        payload: {
          id: 'test-pack-1',
          name: 'Test Pack',
          description: 'Test pack description',
          author: { name: 'Test', email: 'test@test.com' },
          metadata: {
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            isBuiltIn: false,
            isShared: false,
            visibility: 'private',
            tags: [],
            category: 'custom',
            version: '1.0.0',
          },
          stats: { usageCount: 0, rating: 0, downloads: 0 },
          rules: [
            {
              id: 'rule-1',
              name: 'Test Rule',
              calculation: { baseQuantity: 1, perPerson: false, perDay: false },
              conditions: [],
            },
          ],
        },
      });

      // Clear spy calls after setup
      consoleSpy.mockClear();
    });

    it('should NOT track rule pack deletion when toggling a rule pack', () => {
      // Get initial state with rule pack
      const initialState = store.getState();
      expect(initialState.rulePacks).toHaveLength(1);
      expect(initialState.rulePacks[0].id).toBe('test-pack-1');

      // Toggle the rule pack (activate it)
      store.dispatch({
        type: 'TOGGLE_RULE_PACK',
        pack: initialState.rulePacks[0],
        active: true,
      });

      // Verify the rule pack is still in state
      const stateAfterToggle = store.getState();
      expect(stateAfterToggle.rulePacks).toHaveLength(1);
      expect(stateAfterToggle.rulePacks[0].id).toBe('test-pack-1');

      // Most importantly: verify NO deletion was tracked
      const deletionLogs = consoleSpy.mock.calls.filter(
        (call) =>
          typeof call[0] === 'string' &&
          (call[0].includes('Rule pack deleted') ||
            call[0].includes('Rule pack potentially deleted'))
      );
      expect(deletionLogs).toHaveLength(0);

      // Verify rule pack changes were NOT tracked for TOGGLE_RULE_PACK
      const rulePackTrackingLogs = consoleSpy.mock.calls.filter(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('Tracking rule pack changes')
      );
      expect(rulePackTrackingLogs).toHaveLength(0);
    });

    it('should track rule pack deletion only for actual DELETE_RULE_PACK actions', () => {
      // Get initial state
      const initialState = store.getState();
      expect(initialState.rulePacks).toHaveLength(1);

      // Actually delete the rule pack
      store.dispatch({
        type: 'DELETE_RULE_PACK',
        payload: { id: 'test-pack-1' },
      });

      // Verify the rule pack was removed from state
      const stateAfterDelete = store.getState();
      expect(stateAfterDelete.rulePacks).toHaveLength(0);

      // Verify deletion WAS tracked for DELETE_RULE_PACK
      const trackingLogs = consoleSpy.mock.calls.filter(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('Tracking rule pack changes')
      );
      expect(trackingLogs.length).toBeGreaterThan(0);

      const deletionLogs = consoleSpy.mock.calls.filter(
        (call) =>
          typeof call[0] === 'string' &&
          (call[0].includes('Rule pack potentially deleted') ||
            call[0].includes('Confirming rule pack deletion'))
      );
      expect(deletionLogs.length).toBeGreaterThan(0);
    });

    it('should track rule pack creation and updates for actual rule pack actions', () => {
      // Create a new rule pack
      store.dispatch({
        type: 'CREATE_RULE_PACK',
        payload: {
          id: 'test-pack-2',
          name: 'New Test Pack',
          description: 'New test pack description',
          author: { name: 'Test', email: 'test@test.com' },
          metadata: {
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            isBuiltIn: false,
            isShared: false,
            visibility: 'private',
            tags: [],
            category: 'custom',
            version: '1.0.0',
          },
          stats: { usageCount: 0, rating: 0, downloads: 0 },
          rules: [],
        },
      });

      // Verify creation was tracked
      const creationLogs = consoleSpy.mock.calls.filter(
        (call) =>
          typeof call[0] === 'string' && call[0].includes('Rule pack created')
      );
      expect(creationLogs.length).toBeGreaterThan(0);

      // Update the rule pack
      store.dispatch({
        type: 'UPDATE_RULE_PACK',
        payload: {
          id: 'test-pack-2',
          name: 'Updated Test Pack',
          description: 'Updated description',
          author: { name: 'Test', email: 'test@test.com' },
          metadata: {
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            isBuiltIn: false,
            isShared: false,
            visibility: 'private',
            tags: [],
            category: 'custom',
            version: '1.0.1',
          },
          stats: { usageCount: 0, rating: 0, downloads: 0 },
          rules: [],
        },
      });

      // Verify update was tracked
      const updateLogs = consoleSpy.mock.calls.filter(
        (call) =>
          typeof call[0] === 'string' && call[0].includes('Rule pack updated')
      );
      expect(updateLogs.length).toBeGreaterThan(0);
    });

    it('should NOT track trip rule deletions during non-rule operations', () => {
      // Set up initial state with trip rules
      store.dispatch({
        type: 'TOGGLE_RULE_PACK',
        pack: {
          id: 'test-pack-1',
          name: 'Test Pack',
          description: 'Test pack description',
          author: { name: 'Test', email: 'test@test.com' },
          metadata: {
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            isBuiltIn: false,
            isShared: false,
            visibility: 'private',
            tags: [],
            category: 'custom',
            version: '1.0.0',
          },
          stats: { usageCount: 0, rating: 0, downloads: 0 },
          rules: [
            {
              id: 'rule-1',
              name: 'Test Rule',
              calculation: { baseQuantity: 1, perPerson: false, perDay: false },
              conditions: [],
            },
          ],
        },
        active: true,
      });

      // Clear spy calls after rule pack setup
      consoleSpy.mockClear();

      // Simulate a non-rule operation that might temporarily change state
      // For example, a packing list recalculation
      store.dispatch({
        type: 'CALCULATE_PACKING_LIST',
        payload: { tripId: 'test-trip-123' },
      });

      // Verify NO trip rule deletions were tracked
      const deletionLogs = consoleSpy.mock.calls.filter(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('Trip rule association deleted')
      );
      expect(deletionLogs).toHaveLength(0);

      // Verify NO trip rule tracking was performed for non-rule actions
      const trackingLogs = consoleSpy.mock.calls.filter(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('Trip rule association')
      );
      expect(trackingLogs).toHaveLength(0);
    });
  });
});

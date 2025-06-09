import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import NewTripPage from './+Page';
import { StoreType } from '@packing-list/state';

// Mock navigate from vike
vi.mock('vike/client/router', () => ({
  navigate: vi.fn(),
}));

const { navigate: mockNavigate } = vi.mocked(
  await import('vike/client/router')
);

// Mock the page context from vike-react
vi.mock('vike-react/usePageContext', () => ({
  usePageContext: () => ({
    urlPathname: '/trips/new',
    routeParams: {},
  }),
}));

// Mock TripWizard component to capture the onRulePackToggle prop
const mockOnRulePackToggle = vi.fn();
vi.mock('../../days/TripWizard', () => {
  const mockFn = vi.fn(({ currentEvents, onRulePackToggle }) => {
    // Store the callback for our test
    if (onRulePackToggle) {
      mockOnRulePackToggle.mockImplementation(onRulePackToggle);
    }
    return (
      <div data-testid="trip-wizard">
        <div data-testid="current-events">{JSON.stringify(currentEvents)}</div>
        <button
          data-testid="test-rule-pack-toggle"
          onClick={() => {
            if (onRulePackToggle) {
              onRulePackToggle(
                { id: 'test-pack', name: 'Test Pack', rules: [] },
                true
              );
            }
          }}
        >
          Test Rule Pack Toggle
        </button>
      </div>
    );
  });

  return {
    TripWizard: mockFn,
  };
});

// Get the mocked TripWizard for assertions
const mockTripWizard = vi.mocked(
  (await import('../../days/TripWizard')).TripWizard
);

// Create a minimal test state
const createTestState = (): StoreType => ({
  trips: {
    summaries: [],
    selectedTripId: null,
    byId: {},
  },
  rulePacks: [],
  ui: {
    rulePackModal: {
      isOpen: false,
      activeTab: 'browse',
      selectedPackId: undefined,
    },
    loginModal: {
      isOpen: false,
    },
    flow: {
      steps: [],
      current: null,
    },
    tripWizard: {
      currentStep: 1,
    },
  },
  auth: {
    user: null,
    session: null,
    loading: false,
    error: null,
    lastError: null,
    isAuthenticating: false,
    isInitialized: false,
    isOfflineMode: false,
    forceOfflineMode: false,
    connectivityState: { isOnline: true, isConnected: true },
    offlineAccounts: [],
    hasOfflinePasscode: false,
  },
});

// Create a test store that captures dispatched actions
const createTestStore = () => {
  const initialState = createTestState();
  const dispatchedActions: unknown[] = [];

  const store = configureStore({
    reducer: (state = initialState, action) => {
      dispatchedActions.push(action);
      return state;
    },
    preloadedState: initialState,
  });

  // Add method to get dispatched actions
  (
    store as unknown as { getDispatchedActions: () => unknown[] }
  ).getDispatchedActions = () => dispatchedActions;

  return store;
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const store = createTestStore();
  return <Provider store={store}>{children}</Provider>;
};

describe('NewTripPage', () => {
  beforeEach(() => {
    mockTripWizard.mockClear();
    mockOnRulePackToggle.mockClear();
    mockNavigate.mockClear();
  });

  it('should create trip and navigate to wizard page with initial events', async () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <NewTripPage />
      </Provider>
    );

    // Select a template
    fireEvent.click(screen.getByTestId('template-business'));

    // Fill in the form data
    fireEvent.change(screen.getByTestId('trip-title-input'), {
      target: { value: 'Business Trip to NYC' },
    });
    fireEvent.change(screen.getByTestId('trip-location-input'), {
      target: { value: 'New York City' },
    });
    fireEvent.change(screen.getByTestId('trip-start-date-input'), {
      target: { value: '2024-03-15' },
    });
    fireEvent.change(screen.getByTestId('trip-end-date-input'), {
      target: { value: '2024-03-18' },
    });

    // Submit the form
    fireEvent.click(screen.getByTestId('create-trip-submit'));

    // Wait for actions to be processed
    await waitFor(() => {
      const actions = (store as any).getDispatchedActions();
      expect(actions.length).toBeGreaterThan(0);
    });

    // Check that the correct actions were dispatched
    const actions = (store as any).getDispatchedActions();

    // Should have CREATE_TRIP action
    const createTripAction = actions.find(
      (action: any) => action.type === 'CREATE_TRIP'
    );
    expect(createTripAction).toBeDefined();
    expect(createTripAction.payload.title).toBe('Business Trip to NYC');

    // Should have UPDATE_TRIP_EVENTS action with correct events
    const updateEventsAction = actions.find(
      (action: any) => action.type === 'UPDATE_TRIP_EVENTS'
    );
    expect(updateEventsAction).toBeDefined();

    const events = updateEventsAction.payload;
    expect(events).toHaveLength(4);

    // Check event types
    const eventTypes = events.map((e: any) => e.type);
    expect(eventTypes).toContain('leave_home');
    expect(eventTypes).toContain('arrive_destination');
    expect(eventTypes).toContain('leave_destination');
    expect(eventTypes).toContain('arrive_home');

    // Check that destination events have the correct location
    const arriveDestinationEvent = events.find(
      (e: any) => e.type === 'arrive_destination'
    );
    const leaveDestinationEvent = events.find(
      (e: any) => e.type === 'leave_destination'
    );

    expect(arriveDestinationEvent.location).toBe('New York City');
    expect(leaveDestinationEvent.location).toBe('New York City');

    // Should have INIT_FLOW action
    const initFlowAction = actions.find(
      (action: any) => action.type === 'INIT_FLOW'
    );
    expect(initFlowAction).toBeDefined();
    expect(initFlowAction.payload.steps).toHaveLength(5);
    expect(initFlowAction.payload.current).toBe(1);

    // Should have RESET_WIZARD action
    const resetWizardAction = actions.find(
      (action: any) => action.type === 'RESET_WIZARD'
    );
    expect(resetWizardAction).toBeDefined();

    // Should navigate to wizard page
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/\/trips\/trip-\d+\/wizard/)
      );
    });
  });

  it('should create partial events when only some data is provided', async () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <NewTripPage />
      </Provider>
    );

    // Select a template
    fireEvent.click(screen.getByTestId('template-vacation'));

    // Fill in partial form data
    fireEvent.change(screen.getByTestId('trip-title-input'), {
      target: { value: 'My Trip' },
    });
    fireEvent.change(screen.getByTestId('trip-start-date-input'), {
      target: { value: '2024-03-15' },
    });
    // Note: Not filling in end date or location

    // Submit the form
    fireEvent.click(screen.getByTestId('create-trip-submit'));

    // Wait for actions to be processed
    await waitFor(() => {
      const actions = (store as any).getDispatchedActions();
      expect(actions.length).toBeGreaterThan(0);
    });

    const actions = (store as any).getDispatchedActions();

    // Should have UPDATE_TRIP_EVENTS action
    const updateEventsAction = actions.find(
      (action: any) => action.type === 'UPDATE_TRIP_EVENTS'
    );
    expect(updateEventsAction).toBeDefined();

    // Should only have leave_home event (since only start date provided)
    const events = updateEventsAction.payload;
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('leave_home');
    expect(events[0].date).toBe('2024-03-15');

    // Should navigate to wizard page
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/\/trips\/trip-\d+\/wizard/)
      );
    });
  });

  it('should handle empty form data gracefully', async () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <NewTripPage />
      </Provider>
    );

    // Select a template
    fireEvent.click(screen.getByTestId('template-custom'));

    // Fill in only the required title
    fireEvent.change(screen.getByTestId('trip-title-input'), {
      target: { value: 'Minimal Trip' },
    });

    // Submit the form
    fireEvent.click(screen.getByTestId('create-trip-submit'));

    // Wait for actions to be processed
    await waitFor(() => {
      const actions = (store as any).getDispatchedActions();
      expect(actions.length).toBeGreaterThan(0);
    });

    const actions = (store as any).getDispatchedActions();

    // Should have CREATE_TRIP action
    const createTripAction = actions.find(
      (action: any) => action.type === 'CREATE_TRIP'
    );
    expect(createTripAction).toBeDefined();

    // Should have UPDATE_TRIP_EVENTS action but with empty events
    const updateEventsAction = actions.find(
      (action: any) => action.type === 'UPDATE_TRIP_EVENTS'
    );
    expect(updateEventsAction).toBeDefined();
    expect(updateEventsAction.payload).toHaveLength(0);

    // Should navigate to wizard page
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/\/trips\/trip-\d+\/wizard/)
      );
    });
  });
});

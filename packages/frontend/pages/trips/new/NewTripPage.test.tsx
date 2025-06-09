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
  });

  it('should create initial trip events from form data for TripWizard', async () => {
    render(
      <TestWrapper>
        <NewTripPage />
      </TestWrapper>
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

    // Submit the form to open the wizard
    fireEvent.click(screen.getByTestId('create-trip-submit'));

    // Wait for the wizard to be called
    await waitFor(() => {
      expect(mockTripWizard).toHaveBeenCalled();
    });

    // Verify that the wizard was called with the correct initial events
    const lastCall =
      mockTripWizard.mock.calls[mockTripWizard.mock.calls.length - 1];
    expect(lastCall).toBeDefined();
    expect(lastCall[0]).toBeDefined();

    const currentEvents = lastCall[0].currentEvents;
    expect(currentEvents).toBeDefined();

    // Should have 4 events: leave_home, arrive_destination, leave_destination, arrive_home
    expect(currentEvents).toHaveLength(4);

    // Check event types and dates
    const eventTypes = currentEvents?.map((e: { type: string }) => e.type);
    expect(eventTypes).toContain('leave_home');
    expect(eventTypes).toContain('arrive_destination');
    expect(eventTypes).toContain('leave_destination');
    expect(eventTypes).toContain('arrive_home');

    // Check that destination events have the correct location
    const arriveDestinationEvent = currentEvents?.find(
      (e: { type: string }) => e.type === 'arrive_destination'
    );
    const leaveDestinationEvent = currentEvents?.find(
      (e: { type: string }) => e.type === 'leave_destination'
    );

    expect(arriveDestinationEvent).toBeDefined();
    expect(leaveDestinationEvent).toBeDefined();
    expect((arriveDestinationEvent as { location: string }).location).toBe(
      'New York City'
    );
    expect((leaveDestinationEvent as { location: string }).location).toBe(
      'New York City'
    );

    // Check dates are correct
    const leaveHomeEvent = currentEvents?.find(
      (e: { type: string }) => e.type === 'leave_home'
    );
    const arriveHomeEvent = currentEvents?.find(
      (e: { type: string }) => e.type === 'arrive_home'
    );

    expect(leaveHomeEvent).toBeDefined();
    expect(arriveHomeEvent).toBeDefined();
    expect((leaveHomeEvent as { date: string }).date).toBe('2024-03-15');
    expect((arriveDestinationEvent as { date: string }).date).toBe(
      '2024-03-15'
    );
    expect((leaveDestinationEvent as { date: string }).date).toBe('2024-03-18');
    expect((arriveHomeEvent as { date: string }).date).toBe('2024-03-18');
  });

  it('should create partial events when only some data is provided', async () => {
    render(
      <TestWrapper>
        <NewTripPage />
      </TestWrapper>
    );

    // Select a template
    fireEvent.click(screen.getByTestId('template-vacation'));

    // Fill in only title and start date (no location or end date)
    fireEvent.change(screen.getByTestId('trip-title-input'), {
      target: { value: 'My Trip' },
    });
    fireEvent.change(screen.getByTestId('trip-start-date-input'), {
      target: { value: '2024-03-15' },
    });

    // Submit the form
    fireEvent.click(screen.getByTestId('create-trip-submit'));

    await waitFor(() => {
      expect(mockTripWizard).toHaveBeenCalled();
    });

    const lastCall =
      mockTripWizard.mock.calls[mockTripWizard.mock.calls.length - 1];
    expect(lastCall).toBeDefined();
    expect(lastCall[0]).toBeDefined();

    const currentEvents = lastCall[0].currentEvents;
    expect(currentEvents).toBeDefined();

    // Should only have leave_home event since no end date or location provided
    expect(currentEvents).toHaveLength(1);
    expect(currentEvents?.[0].type).toBe('leave_home');
    expect(currentEvents?.[0].date).toBe('2024-03-15');
  });

  it('should handle empty form data gracefully', async () => {
    render(
      <TestWrapper>
        <NewTripPage />
      </TestWrapper>
    );

    // Select a template
    fireEvent.click(screen.getByTestId('template-custom'));

    // Only fill in the required title
    fireEvent.change(screen.getByTestId('trip-title-input'), {
      target: { value: 'Minimal Trip' },
    });

    // Submit the form
    fireEvent.click(screen.getByTestId('create-trip-submit'));

    await waitFor(() => {
      expect(mockTripWizard).toHaveBeenCalled();
    });

    const lastCall =
      mockTripWizard.mock.calls[mockTripWizard.mock.calls.length - 1];
    expect(lastCall).toBeDefined();
    expect(lastCall[0]).toBeDefined();

    const currentEvents = lastCall[0].currentEvents;
    expect(currentEvents).toBeDefined();

    // Should have no events since no dates or location provided
    expect(currentEvents).toHaveLength(0);
  });
});

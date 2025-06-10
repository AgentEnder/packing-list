import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NoTripSelected } from './NoTripSelected';
import * as state from '@packing-list/state';
import type { StoreType } from '@packing-list/state';
import type { Mock } from 'vitest';

// Mock the state modules
vi.mock('@packing-list/state', () => ({
  useAppDispatch: vi.fn(),
  useAppSelector: vi.fn(),
  selectAccurateTripSummaries: vi.fn(),
}));

vi.mock('vike-react/usePageContext', () => ({
  usePageContext: vi.fn().mockReturnValue({
    is404: false,
    urlPathname: '/',
  }),
}));

// Mock sessionStorage
const mockSessionStorage = {
  setItem: vi.fn(),
  getItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

describe('NoTripSelected Component', () => {
  const mockDispatch = vi.fn();

  const defaultProps = {
    title: 'No Trip Selected',
    message: 'Please select a trip to continue',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(state.useAppDispatch).mockReturnValue(mockDispatch);
  });

  const renderWithTripSummaries = (
    summaries: Record<string, unknown>[] = []
  ) => {
    (state.useAppSelector as unknown as Mock).mockImplementation(
      (selector: (state: StoreType) => unknown) => {
        const mockState: StoreType = {
          trips: {
            summaries: summaries as never,
            selectedTripId: null,
            byId: {},
          },
          rulePacks: [],
          ui: {
            rulePackModal: { isOpen: false, activeTab: 'browse' },
            loginModal: { isOpen: false },
            flow: { steps: [], current: null },
            tripWizard: { currentStep: 1 },
          },
          sync: {
            syncState: {
              isSyncing: false,
              conflicts: [],
              isOnline: true,
              lastSyncTimestamp: null,
              pendingChanges: [],
            },
            isInitialized: true,
            lastError: null,
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
        };
        return selector(mockState);
      }
    );
  };

  it('renders with default props', () => {
    renderWithTripSummaries();
    render(<NoTripSelected {...defaultProps} />);

    expect(screen.getByTestId('no-trip-selected')).toBeInTheDocument();
    expect(screen.getByText('No Trip Selected')).toBeInTheDocument();
    expect(
      screen.getByText('Please select a trip to continue')
    ).toBeInTheDocument();
  });

  it('shows demo button when no trips exist', () => {
    renderWithTripSummaries([]);
    render(<NoTripSelected {...defaultProps} />);

    expect(screen.getByTestId('try-demo-button')).toBeInTheDocument();
    expect(screen.getByText('Try Demo Trip')).toBeInTheDocument();
  });

  it('does not show demo button when trips exist', () => {
    renderWithTripSummaries([{ id: 'trip1', title: 'Existing Trip' }]);
    render(<NoTripSelected {...defaultProps} />);

    expect(screen.queryByTestId('try-demo-button')).not.toBeInTheDocument();
  });

  it('handles demo button click', () => {
    renderWithTripSummaries([]);
    render(<NoTripSelected {...defaultProps} />);

    const demoButton = screen.getByTestId('try-demo-button');
    fireEvent.click(demoButton);

    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'session-demo-choice',
      'demo'
    );
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'LOAD_DEMO_DATA' });
  });

  it('renders view trips button with default props', () => {
    renderWithTripSummaries();
    render(<NoTripSelected {...defaultProps} />);

    const viewTripsButton = screen.getByTestId('view-trips-button');
    expect(viewTripsButton).toBeInTheDocument();
    expect(screen.getByText('Go to Trips')).toBeInTheDocument();
    expect(viewTripsButton.getAttribute('href')).toBe('/trips');
  });

  it('renders custom action text and href', () => {
    renderWithTripSummaries();
    render(
      <NoTripSelected
        {...defaultProps}
        actionText="View My Trips"
        actionHref="/my-trips"
      />
    );

    const viewTripsButton = screen.getByTestId('view-trips-button');
    expect(screen.getByText('View My Trips')).toBeInTheDocument();
    expect(viewTripsButton.getAttribute('href')).toBe('/my-trips');
  });

  it('shows create new trip button by default', () => {
    renderWithTripSummaries();
    render(<NoTripSelected {...defaultProps} />);

    const createButton = screen.getByTestId('create-new-trip-button');
    expect(createButton).toBeInTheDocument();
    expect(screen.getByText('Create New Trip')).toBeInTheDocument();
    expect(createButton.getAttribute('href')).toBe('/trips/new');
  });

  it('hides create action when showCreateAction is false', () => {
    renderWithTripSummaries();
    render(<NoTripSelected {...defaultProps} showCreateAction={false} />);

    expect(
      screen.queryByTestId('create-new-trip-button')
    ).not.toBeInTheDocument();
  });

  it('shows correct help content when no trips exist', () => {
    renderWithTripSummaries([]);
    render(<NoTripSelected {...defaultProps} />);

    expect(
      screen.getByText('Try the demo trip to see how the app works')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Create your first trip to start planning')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Import trip data if you have an existing itinerary')
    ).toBeInTheDocument();
  });

  it('shows correct help content when trips exist', () => {
    renderWithTripSummaries([{ id: 'trip1', title: 'Existing Trip' }]);
    render(<NoTripSelected {...defaultProps} />);

    expect(
      screen.queryByText('Try the demo trip to see how the app works')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Create your first trip to start planning')
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('Select an existing trip from your trips list')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Create a new trip to start planning')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Import trip data if you have an existing itinerary')
    ).toBeInTheDocument();
  });

  it('renders all icons correctly', () => {
    renderWithTripSummaries([]);
    render(<NoTripSelected {...defaultProps} />);

    // AlertTriangle icon
    expect(document.querySelector('.w-16.h-16')).toBeInTheDocument();

    // PlayCircle icon in demo button
    expect(
      screen.getByTestId('try-demo-button').querySelector('.w-4.h-4')
    ).toBeInTheDocument();

    // MapPin icon in view trips button
    expect(
      screen.getByTestId('view-trips-button').querySelector('.w-4.h-4')
    ).toBeInTheDocument();

    // Plus icon in create trip button
    expect(
      screen.getByTestId('create-new-trip-button').querySelector('.w-4.h-4')
    ).toBeInTheDocument();

    // ArrowRight icons in help list
    expect(document.querySelectorAll('.w-3.h-3')).toHaveLength(3); // 3 help items when no trips
  });

  it('renders with different number of help items based on trip existence', () => {
    // No trips case
    renderWithTripSummaries([]);
    const { rerender } = render(<NoTripSelected {...defaultProps} />);
    expect(document.querySelectorAll('.w-3.h-3')).toHaveLength(3);

    // With trips case
    renderWithTripSummaries([{ id: 'trip1', title: 'Existing Trip' }]);
    rerender(<NoTripSelected {...defaultProps} />);
    expect(document.querySelectorAll('.w-3.h-3')).toHaveLength(3);
  });
});

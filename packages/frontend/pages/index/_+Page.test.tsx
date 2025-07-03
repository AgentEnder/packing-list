import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import Page from './+Page';

// Mock state
vi.mock('@packing-list/state', () => ({
  useAppSelector: vi.fn(),
  selectPeople: vi.fn(),
  selectCurrentTrip: vi.fn(),
  selectCalculatedItems: vi.fn(),
  selectSelectedTripId: vi.fn(),
  selectAccurateTripSummaries: vi.fn(),
}));

// Mock shared-components
vi.mock('@packing-list/shared-components', () => ({
  Link: ({ href, children }: { href?: string; children: React.ReactNode }) => (
    <a href={href} data-testid={`link-${href || 'no-href'}`}>
      {children}
    </a>
  ),
}));

vi.mock('../../components/PageHeader', () => ({
  PageHeader: ({ title }: { title: string }) => (
    <header data-testid="page-header">
      <h1>{title}</h1>
    </header>
  ),
}));

vi.mock('../../components/PageContainer', () => ({
  PageContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-container">{children}</div>
  ),
}));

vi.mock('../../components/HelpBlurb', () => ({
  HelpBlurb: ({
    storageKey,
    title,
    children,
  }: {
    storageKey: string;
    title: string;
    children: React.ReactNode;
  }) => (
    <div data-testid={`help-blurb-${storageKey}`}>
      <h3>{title}</h3>
      {children}
    </div>
  ),
}));

vi.mock('../../components/NoTripSelected', () => ({
  NoTripSelected: ({
    title,
    message,
    actionText,
    actionHref,
  }: {
    title: string;
    message: string;
    actionText: string;
    actionHref: string;
  }) => (
    <div data-testid="no-trip-selected">
      <h2>{title}</h2>
      <p>{message}</p>
      <a href={actionHref}>{actionText}</a>
    </div>
  ),
}));

import {
  useAppSelector,
  selectPeople,
  selectCurrentTrip,
  selectCalculatedItems,
  selectSelectedTripId,
  selectAccurateTripSummaries,
} from '@packing-list/state';

describe('Index Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders NoTripSelected when no trip is selected', () => {
    vi.mocked(useAppSelector).mockImplementation((selector: unknown) => {
      if (selector === selectSelectedTripId) return null;
      if (selector === selectAccurateTripSummaries) return [];
      return null;
    });

    render(<Page />);

    expect(screen.getByTestId('page-container')).toBeInTheDocument();
    expect(screen.getByTestId('page-header')).toBeInTheDocument();
    expect(screen.getByText('Smart Packing List')).toBeInTheDocument();
    expect(screen.getByTestId('no-trip-selected')).toBeInTheDocument();
    expect(
      screen.getByText('Welcome to Smart Packing List!')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Get started by selecting an existing trip/)
    ).toBeInTheDocument();
  });

  it('renders NoTripSelected when no trips exist', () => {
    vi.mocked(useAppSelector).mockImplementation((selector: unknown) => {
      if (selector === selectSelectedTripId) return 'trip-123';
      if (selector === selectAccurateTripSummaries) return []; // No trips exist
      return null;
    });

    render(<Page />);

    expect(screen.getByTestId('no-trip-selected')).toBeInTheDocument();
  });

  it('renders trip dashboard when trip is selected AND trips exist', () => {
    vi.mocked(useAppSelector).mockImplementation((selector: unknown) => {
      if (selector === selectSelectedTripId) return 'trip-123';
      if (selector === selectAccurateTripSummaries)
        return [{ id: 'trip-123', name: 'Test Trip' }]; // Trips exist
      if (selector === selectPeople)
        return [
          { id: 'person1', name: 'John' },
          { id: 'person2', name: 'Jane' },
        ];
      if (selector === selectCurrentTrip)
        return { days: ['2023-01-01', '2023-01-02', '2023-01-03'] };
      if (selector === selectCalculatedItems) return { defaultItems: [] };
      return [];
    });

    render(<Page />);

    expect(screen.getByTestId('page-header')).toBeInTheDocument();
    expect(screen.getByTestId('help-blurb-overview')).toBeInTheDocument();
    expect(screen.getByText('Current Trip Status')).toBeInTheDocument();
    expect(screen.getByText('Next Steps')).toBeInTheDocument();
  });

  it('displays correct trip statistics when dashboard is shown', () => {
    vi.mocked(useAppSelector).mockImplementation((selector: unknown) => {
      if (selector === selectSelectedTripId) return 'trip-123';
      if (selector === selectAccurateTripSummaries) return [{ id: 'trip-123' }]; // Trips exist
      if (selector === selectPeople)
        return [{ id: 'person1' }, { id: 'person2' }];
      if (selector === selectCurrentTrip)
        return { days: ['day1', 'day2', 'day3'] };
      if (selector === selectCalculatedItems)
        return {
          defaultItems: [
            { name: 'T-shirt', quantity: 3 },
            { name: 'Pants', quantity: 2 },
          ],
        };
      return [];
    });

    render(<Page />);

    // Check for statistics in the stats card specifically
    expect(screen.getByText('Trip Length').parentElement).toHaveTextContent(
      '3'
    );
    expect(screen.getByText('days')).toBeInTheDocument();
    expect(screen.getByText('Travelers').parentElement).toHaveTextContent('2');
    expect(screen.getByText('people')).toBeInTheDocument();
    expect(screen.getByText('items calculated')).toBeInTheDocument();
  });

  it('shows progress steps with correct completion states', () => {
    vi.mocked(useAppSelector).mockImplementation((selector: unknown) => {
      if (selector === selectSelectedTripId) return 'trip-123';
      if (selector === selectAccurateTripSummaries) return [{ id: 'trip-123' }]; // Trips exist
      if (selector === selectPeople) return [{ id: 'person1' }];
      if (selector === selectCurrentTrip) return { days: ['day1', 'day2'] };
      if (selector === selectCalculatedItems)
        return { defaultItems: [{ name: 'Item', quantity: 1 }] };
      return [];
    });

    render(<Page />);

    expect(screen.getByText('Trip Configured')).toBeInTheDocument();
    expect(screen.getByText('Travelers Added')).toBeInTheDocument();
    expect(screen.getByText('Rules Created')).toBeInTheDocument();
  });

  it('shows incomplete progress steps when conditions not met', () => {
    vi.mocked(useAppSelector).mockImplementation((selector: unknown) => {
      if (selector === selectSelectedTripId) return 'trip-123';
      if (selector === selectAccurateTripSummaries) return [{ id: 'trip-123' }]; // Trips exist
      if (selector === selectPeople) return []; // No people
      if (selector === selectCurrentTrip) return { days: [] }; // No days
      if (selector === selectCalculatedItems) return { defaultItems: [] }; // No items
      return [];
    });

    render(<Page />);

    expect(screen.getByText('Configure Trip')).toBeInTheDocument();
    expect(screen.getAllByText('Add Travelers')).toHaveLength(2); // Appears in content and step
    expect(screen.getByText('Create Rules')).toBeInTheDocument();
  });

  it('renders packing list table when items exist', () => {
    vi.mocked(useAppSelector).mockImplementation((selector: unknown) => {
      if (selector === selectSelectedTripId) return 'trip-123';
      if (selector === selectAccurateTripSummaries) return [{ id: 'trip-123' }]; // Trips exist
      if (selector === selectPeople) return [{ id: 'person1' }];
      if (selector === selectCurrentTrip) return { days: ['day1'] };
      if (selector === selectCalculatedItems)
        return {
          defaultItems: [
            { name: 'T-shirt', quantity: 3 },
            { name: 'Pants', quantity: 2 },
            { name: 'Socks', quantity: 5 },
          ],
        };
      return [];
    });

    render(<Page />);

    expect(screen.getByText('Current Packing List')).toBeInTheDocument();
    expect(screen.getByText('T-shirt')).toBeInTheDocument();
    expect(screen.getByText('Pants')).toBeInTheDocument();
    expect(screen.getByText('Socks')).toBeInTheDocument();
    // Check the table specifically for quantities
    const table = screen.getByRole('table');
    expect(table).toHaveTextContent('3');
    expect(table).toHaveTextContent('2');
    expect(table).toHaveTextContent('5');
  });

  it('does not render packing list when no items', () => {
    vi.mocked(useAppSelector).mockImplementation((selector: unknown) => {
      if (selector === selectSelectedTripId) return 'trip-123';
      if (selector === selectAccurateTripSummaries) return [{ id: 'trip-123' }]; // Trips exist
      if (selector === selectPeople) return [{ id: 'person1' }];
      if (selector === selectCurrentTrip) return { days: ['day1'] };
      if (selector === selectCalculatedItems) return { defaultItems: [] };
      return [];
    });

    render(<Page />);

    expect(screen.queryByText('Current Packing List')).not.toBeInTheDocument();
  });

  it('renders navigation links correctly', () => {
    vi.mocked(useAppSelector).mockImplementation((selector: unknown) => {
      if (selector === selectSelectedTripId) return 'trip-123';
      if (selector === selectAccurateTripSummaries) return [{ id: 'trip-123' }]; // Trips exist
      if (selector === selectPeople) return [{ id: 'person1' }];
      if (selector === selectCurrentTrip) return { days: ['day1'] };
      if (selector === selectCalculatedItems)
        return {
          defaultItems: [{ name: 'Item', quantity: 1 }],
        };
      return [];
    });

    render(<Page />);

    expect(screen.getByTestId('link-/days')).toBeInTheDocument();
    expect(screen.getByTestId('link-/people')).toBeInTheDocument();
    expect(screen.getByTestId('link-/defaults')).toBeInTheDocument();
    expect(screen.getByTestId('link-/packing-list')).toBeInTheDocument();
  });

  it('renders help blurb with how-it-works content', () => {
    vi.mocked(useAppSelector).mockImplementation((selector: unknown) => {
      if (selector === selectSelectedTripId) return 'trip-123';
      if (selector === selectAccurateTripSummaries) return [{ id: 'trip-123' }]; // Trips exist
      if (selector === selectPeople) return [];
      if (selector === selectCurrentTrip) return { days: [] };
      if (selector === selectCalculatedItems) return { defaultItems: [] };
      return [];
    });

    render(<Page />);

    expect(screen.getByTestId('help-blurb-overview')).toBeInTheDocument();
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(
      screen.getByText(/Create the perfect packing list/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Configure Your Trip/)).toBeInTheDocument();
    expect(screen.getAllByText(/Add Travelers/)).toHaveLength(2); // Appears in both content and link
    expect(screen.getByText(/Set Packing Rules/)).toBeInTheDocument();
  });

  it('handles null calculatedItems gracefully in dashboard mode', () => {
    vi.mocked(useAppSelector).mockImplementation((selector: unknown) => {
      if (selector === selectSelectedTripId) return 'trip-123';
      if (selector === selectAccurateTripSummaries) return [{ id: 'trip-123' }]; // Trips exist
      if (selector === selectPeople) return [];
      if (selector === selectCurrentTrip) return { days: [] };
      if (selector === selectCalculatedItems) return null; // Null case
      return [];
    });

    render(<Page />);

    // Check for "0" in the items calculated stat specifically
    expect(screen.getByText('Packed Items').parentElement).toHaveTextContent(
      '0'
    );
    expect(screen.queryByText('Current Packing List')).not.toBeInTheDocument();
  });

  it('handles missing defaultItems array gracefully in dashboard mode', () => {
    vi.mocked(useAppSelector).mockImplementation((selector: unknown) => {
      if (selector === selectSelectedTripId) return 'trip-123';
      if (selector === selectAccurateTripSummaries) return [{ id: 'trip-123' }]; // Trips exist
      if (selector === selectPeople) return [];
      if (selector === selectCurrentTrip) return { days: [] };
      if (selector === selectCalculatedItems) return {}; // No defaultItems property
      return [];
    });

    render(<Page />);

    // Check for "0" in the items calculated stat specifically
    expect(screen.getByText('Packed Items').parentElement).toHaveTextContent(
      '0'
    );
    expect(screen.queryByText('Current Packing List')).not.toBeInTheDocument();
  });

  it('renders table headers correctly when items exist', () => {
    vi.mocked(useAppSelector).mockImplementation((selector: unknown) => {
      if (selector === selectSelectedTripId) return 'trip-123';
      if (selector === selectAccurateTripSummaries) return [{ id: 'trip-123' }]; // Trips exist
      if (selector === selectPeople) return [];
      if (selector === selectCurrentTrip) return { days: [] };
      if (selector === selectCalculatedItems)
        return {
          defaultItems: [{ name: 'Test Item', quantity: 1 }],
        };
      return [];
    });

    render(<Page />);

    expect(screen.getByText('Item')).toBeInTheDocument();
    expect(screen.getByText('Quantity')).toBeInTheDocument();
  });

  it('renders NoTripSelected action link correctly', () => {
    vi.mocked(useAppSelector).mockImplementation((selector: unknown) => {
      if (selector === selectSelectedTripId) return null;
      if (selector === selectAccurateTripSummaries) return [];
      return null;
    });

    render(<Page />);

    const actionLink = screen.getByText('View My Trips');
    expect(actionLink.closest('a')).toHaveAttribute('href', '/trips');
  });
});

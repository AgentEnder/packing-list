import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TripSelector } from './TripSelector';
import * as state from '@packing-list/state';
import type { Mock } from 'vitest';

// Mock the state modules
vi.mock('@packing-list/state', () => ({
  useAppSelector: vi.fn(),
  selectAccurateTripSummaries: vi.fn(),
}));

// Mock vike-react
vi.mock('vike-react/usePageContext', () => ({
  usePageContext: () => ({ urlPathname: '/' }),
}));

interface TripSummary {
  tripId: string;
  title: string;
  description?: string;
}

describe('TripSelector Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithMockState = (
    tripSummaries: TripSummary[] = [],
    selectedTripId: string | null = null
  ) => {
    (state.useAppSelector as unknown as Mock).mockImplementation(
      (selector: typeof state.selectAccurateTripSummaries) => {
        if (selector === state.selectAccurateTripSummaries) {
          return tripSummaries;
        }
        // For the selectedTripId selector
        return selectedTripId;
      }
    );
  };

  it('renders create trip button when no trips exist', () => {
    renderWithMockState([], null);
    render(<TripSelector />);

    const createButton = screen.getByTestId('trip-selector-empty');
    expect(createButton).toBeInTheDocument();
    expect(screen.getByText('Create Your First Trip')).toBeInTheDocument();
    expect(createButton.getAttribute('href')).toBe('/trips/new');
  });

  it('renders select trip button when trips exist but none selected', () => {
    const mockTrips = [
      {
        tripId: 'trip1',
        title: 'Beach Vacation',
        description: 'Fun in the sun',
      },
      {
        tripId: 'trip2',
        title: 'Mountain Hike',
        description: 'Adventure awaits',
      },
    ];
    renderWithMockState(mockTrips, null);
    render(<TripSelector />);

    const selectButton = screen.getByTestId('trip-selector-no-selection');
    expect(selectButton).toBeInTheDocument();
    expect(screen.getByText('Select a Trip')).toBeInTheDocument();
    expect(selectButton.getAttribute('href')).toBe('/trips');
  });

  it('renders selected trip with title and description', () => {
    const mockTrips = [
      {
        tripId: 'trip1',
        title: 'Beach Vacation',
        description: 'Fun in the sun',
      },
      {
        tripId: 'trip2',
        title: 'Mountain Hike',
        description: 'Adventure awaits',
      },
    ];
    renderWithMockState(mockTrips, 'trip1');
    render(<TripSelector />);

    const tripButton = screen.getByTestId('trip-selector');
    expect(tripButton).toBeInTheDocument();
    expect(screen.getByText('Beach Vacation')).toBeInTheDocument();
    expect(screen.getByText('Fun in the sun')).toBeInTheDocument();
    expect(tripButton.getAttribute('href')).toBe('/trips');
  });

  it('renders selected trip with title only when no description', () => {
    const mockTrips = [{ tripId: 'trip1', title: 'Beach Vacation' }];
    renderWithMockState(mockTrips, 'trip1');
    render(<TripSelector />);

    const tripButton = screen.getByTestId('trip-selector');
    expect(tripButton).toBeInTheDocument();
    expect(screen.getByText('Beach Vacation')).toBeInTheDocument();
    expect(screen.queryByText('Fun in the sun')).not.toBeInTheDocument();
  });

  it('handles case when selected trip is not found in summaries', () => {
    const mockTrips = [
      {
        tripId: 'trip1',
        title: 'Beach Vacation',
        description: 'Fun in the sun',
      },
    ];
    renderWithMockState(mockTrips, 'nonexistent-trip');
    render(<TripSelector />);

    // Should render the no selection state
    const selectButton = screen.getByTestId('trip-selector-no-selection');
    expect(selectButton).toBeInTheDocument();
    expect(screen.getByText('Select a Trip')).toBeInTheDocument();
  });

  it('renders correct icons for each state', () => {
    // Test empty state icon
    renderWithMockState([], null);
    const { rerender } = render(<TripSelector />);
    expect(
      screen.getByTestId('trip-selector-empty').querySelector('.w-4.h-4')
    ).toBeInTheDocument();

    // Test no selection state icon
    const mockTrips = [{ tripId: 'trip1', title: 'Beach Vacation' }];
    renderWithMockState(mockTrips, null);
    rerender(<TripSelector />);
    expect(
      screen.getByTestId('trip-selector-no-selection').querySelector('.w-4.h-4')
    ).toBeInTheDocument();

    // Test selected trip icon
    renderWithMockState(mockTrips, 'trip1');
    rerender(<TripSelector />);
    expect(
      screen.getByTestId('trip-selector').querySelector('.w-4.h-4')
    ).toBeInTheDocument();
  });

  it('applies correct CSS classes for layout', () => {
    const mockTrips = [
      {
        tripId: 'trip1',
        title: 'Beach Vacation',
        description: 'Fun in the sun',
      },
    ];
    renderWithMockState(mockTrips, 'trip1');
    render(<TripSelector />);

    const tripButton = screen.getByTestId('trip-selector');
    expect(tripButton).toHaveClass(
      'btn',
      'btn-ghost',
      'gap-2',
      'max-w-64',
      'justify-start'
    );
  });

  it('truncates long trip titles and descriptions', () => {
    const mockTrips = [
      {
        tripId: 'trip1',
        title: 'Very Long Trip Title That Should Be Truncated',
        description:
          'Very long description that should also be truncated when displayed',
      },
    ];
    renderWithMockState(mockTrips, 'trip1');
    render(<TripSelector />);

    const titleElement = screen.getByText(
      'Very Long Trip Title That Should Be Truncated'
    );
    const descriptionElement = screen.getByText(
      'Very long description that should also be truncated when displayed'
    );

    expect(titleElement).toHaveClass('truncate');
    expect(descriptionElement).toHaveClass('truncate');
  });
});

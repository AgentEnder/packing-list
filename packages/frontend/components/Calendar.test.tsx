import { render, screen, fireEvent } from '@testing-library/react';
import { Calendar } from './Calendar';
import { vi } from 'vitest';

// Mock date-fns to avoid timezone issues in tests
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns');
  return {
    ...actual,
    format: vi.fn((date: Date, formatStr: string) => {
      if (formatStr === 'MMMM yyyy') return 'January 2024';
      if (formatStr === 'MMM d') return 'Jan 1';
      if (formatStr === 'd') {
        // Return different day numbers for different dates
        const day = date.getDate();
        return day.toString();
      }
      return date.toISOString();
    }),
    startOfMonth: vi.fn(() => new Date(2024, 0, 1)),
    endOfMonth: vi.fn(() => new Date(2024, 0, 31)),
    startOfWeek: vi.fn(() => new Date(2023, 11, 31)), // Dec 31, 2023 (Sunday)
    endOfWeek: vi.fn(() => new Date(2024, 1, 3)), // Feb 3, 2024 (Saturday)
    eachDayOfInterval: vi.fn(() => [
      new Date(2024, 0, 1), // Jan 1
      new Date(2024, 0, 2), // Jan 2
      new Date(2024, 0, 3), // Jan 3
    ]),
    isSameMonth: vi.fn(
      (date1: Date, date2: Date) =>
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
    ),
    isSameDay: vi.fn(
      (date1: Date, date2: Date) => date1.getTime() === date2.getTime()
    ),
    addMonths: vi.fn(
      (date: Date, months: number) =>
        new Date(date.getFullYear(), date.getMonth() + months, date.getDate())
    ),
    subMonths: vi.fn(
      (date: Date, months: number) =>
        new Date(date.getFullYear(), date.getMonth() - months, date.getDate())
    ),
  };
});

describe('Calendar Component', () => {
  const mockTrips = [
    {
      tripId: 'trip-1',
      title: 'Test Trip',
      startDate: new Date(2024, 0, 5),
      endDate: new Date(2024, 0, 10),
    },
  ];

  it('renders calendar with trip indicators', () => {
    render(<Calendar trips={mockTrips} />);

    expect(screen.getByText('January 2024')).toBeInTheDocument();
    expect(screen.getByText('Test Trip')).toBeInTheDocument();
  });

  it('calls onDateRangeSelect when dates are selected', () => {
    const mockOnDateRangeSelect = vi.fn();
    render(
      <Calendar trips={mockTrips} onDateRangeSelect={mockOnDateRangeSelect} />
    );

    // Click first date (Jan 1)
    const firstDate = screen.getByText('1');
    fireEvent.click(firstDate);

    // Should show selection state
    expect(
      screen.getByText(/Click to select start date|Click end date/)
    ).toBeInTheDocument();

    // Click second date (Jan 2)
    const secondDate = screen.getByText('2');
    fireEvent.click(secondDate);

    // Should call the callback
    expect(mockOnDateRangeSelect).toHaveBeenCalledWith(
      new Date(2024, 0, 1),
      new Date(2024, 0, 2)
    );
  });

  it('shows cancel button during date selection', () => {
    const mockOnDateRangeSelect = vi.fn();
    render(
      <Calendar trips={mockTrips} onDateRangeSelect={mockOnDateRangeSelect} />
    );

    // Click first date
    const firstDate = screen.getByText('1');
    fireEvent.click(firstDate);

    // Should show cancel button
    expect(screen.getByText('Cancel')).toBeInTheDocument();

    // Click cancel
    fireEvent.click(screen.getByText('Cancel'));

    // Should hide cancel button
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('prevents date selection when clicking on trip indicators', () => {
    const mockOnDateRangeSelect = vi.fn();
    const mockOnTripClick = vi.fn();

    render(
      <Calendar
        trips={mockTrips}
        onDateRangeSelect={mockOnDateRangeSelect}
        onTripClick={mockOnTripClick}
      />
    );

    // Click on trip indicator
    const tripIndicator = screen.getByText('Test Trip');
    fireEvent.click(tripIndicator);

    // Should call trip click, not date selection
    expect(mockOnTripClick).toHaveBeenCalledWith('trip-1');
    expect(mockOnDateRangeSelect).not.toHaveBeenCalled();
  });

  it('handles month navigation', () => {
    render(<Calendar trips={mockTrips} />);

    const prevButton = screen.getByLabelText('Previous month');
    const nextButton = screen.getByLabelText('Next month');

    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();

    // These buttons should be clickable
    fireEvent.click(prevButton);
    fireEvent.click(nextButton);
  });

  it('shows dynamic preview range on hover during date selection', () => {
    const mockOnDateRangeSelect = vi.fn();
    render(
      <Calendar trips={mockTrips} onDateRangeSelect={mockOnDateRangeSelect} />
    );

    // Start date selection by clicking first date
    const startDate = screen.getByText('1');
    fireEvent.click(startDate);

    // Should show selection state
    expect(screen.getByText('Trips & Preview')).toBeInTheDocument();

    // Hover over a different date to see preview range
    const endDate = screen.getByText('2');
    fireEvent.mouseEnter(endDate);

    // The preview should still show "Trips & Preview" text
    expect(screen.getByText('Trips & Preview')).toBeInTheDocument();

    // Mouse leave should still maintain the preview
    fireEvent.mouseLeave(endDate);
    expect(screen.getByText('Trips & Preview')).toBeInTheDocument();

    // Cancel selection
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Should return to normal state
    expect(screen.getByText('Visible trips')).toBeInTheDocument();
    expect(screen.queryByText('Trips & Preview')).not.toBeInTheDocument();
  });

  it('cancels date selection on Escape key press', () => {
    const mockOnDateRangeSelect = vi.fn();
    render(
      <Calendar trips={mockTrips} onDateRangeSelect={mockOnDateRangeSelect} />
    );

    // Start date selection
    const startDate = screen.getByText('1');
    fireEvent.click(startDate);

    // Should show selection state
    expect(screen.getByText('Trips & Preview')).toBeInTheDocument();

    // Press Escape key
    fireEvent.keyDown(document, { key: 'Escape' });

    // Should cancel selection
    expect(screen.getByText('Visible trips')).toBeInTheDocument();
    expect(screen.queryByText('Trips & Preview')).not.toBeInTheDocument();
  });

  it('cancels date selection on right-click', () => {
    const mockOnDateRangeSelect = vi.fn();
    render(
      <Calendar trips={mockTrips} onDateRangeSelect={mockOnDateRangeSelect} />
    );

    // Start date selection
    const startDate = screen.getByText('1');
    fireEvent.click(startDate);

    // Should show selection state
    expect(screen.getByText('Trips & Preview')).toBeInTheDocument();

    // Right-click on any date
    const endDate = screen.getByText('2');
    fireEvent.contextMenu(endDate);

    // Should cancel selection
    expect(screen.getByText('Visible trips')).toBeInTheDocument();
    expect(screen.queryByText('Trips & Preview')).not.toBeInTheDocument();
  });

  it('does not interfere with right-click when not selecting', () => {
    const mockOnDateRangeSelect = vi.fn();
    render(
      <Calendar trips={mockTrips} onDateRangeSelect={mockOnDateRangeSelect} />
    );

    // Right-click without starting selection should not cause any issues
    const someDate = screen.getByText('1');
    fireEvent.contextMenu(someDate);

    // Should remain in normal state
    expect(screen.getByText('Visible trips')).toBeInTheDocument();
  });
});

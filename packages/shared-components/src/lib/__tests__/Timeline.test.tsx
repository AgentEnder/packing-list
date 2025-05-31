import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { TripEvent } from '@packing-list/model';

import { Timeline } from '../Timeline.js';

describe('Timeline', () => {
  it('should render empty state when no events provided', () => {
    render(<Timeline events={[]} />);
    expect(screen.getByText('No events in timeline')).toBeInTheDocument();
  });

  it('should render events sorted by date', () => {
    const events: TripEvent[] = [
      {
        id: '2',
        type: 'arrive_destination',
        date: '2024-01-02',
        location: 'Paris',
      },
      {
        id: '1',
        type: 'leave_home',
        date: '2024-01-01',
        location: 'Home',
      },
    ];

    render(<Timeline events={events} />);

    const dates = screen.getAllByText(/Jan \d{1,2}, 2024/);
    expect(dates).toHaveLength(2);
    expect(dates[0]).toHaveTextContent('Jan 1, 2024');
    expect(dates[1]).toHaveTextContent('Jan 2, 2024');
  });

  it('should display correct event type labels', () => {
    const events: TripEvent[] = [
      {
        id: '1',
        type: 'leave_home',
        date: '2024-01-01',
        location: 'Home',
      },
      {
        id: '2',
        type: 'arrive_destination',
        date: '2024-01-02',
        location: 'Paris',
      },
      {
        id: '3',
        type: 'leave_destination',
        date: '2024-01-03',
        location: 'Paris',
      },
      {
        id: '4',
        type: 'arrive_home',
        date: '2024-01-04',
        location: 'Home',
      },
    ];

    render(<Timeline events={events} />);

    expect(screen.getByText('Leave Home')).toBeInTheDocument();
    expect(screen.getByText('Arrive at Destination')).toBeInTheDocument();
    expect(screen.getByText('Leave Destination')).toBeInTheDocument();
    expect(screen.getByText('Arrive Home')).toBeInTheDocument();
  });

  it('should display location and notes when provided', () => {
    const events: TripEvent[] = [
      {
        id: '1',
        type: 'arrive_destination',
        date: '2024-01-01',
        location: 'Paris',
        notes: 'Check-in at 3 PM',
      },
    ];

    render(<Timeline events={events} />);

    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByText('Check-in at 3 PM')).toBeInTheDocument();
  });

  it('should call onEventClick when event is clicked', () => {
    const onEventClick = vi.fn();
    const event: TripEvent = {
      id: '1',
      type: 'arrive_destination',
      date: '2024-01-01',
      location: 'Paris',
    };

    render(<Timeline events={[event]} onEventClick={onEventClick} />);

    const eventBox = screen.getByText('Arrive at Destination').parentElement;
    if (!eventBox) {
      throw new Error('Event box not found');
    }
    fireEvent.click(eventBox);

    expect(onEventClick).toHaveBeenCalledWith(event);
  });

  it('should apply hover styles when onEventClick is provided', () => {
    const event: TripEvent = {
      id: '1',
      type: 'arrive_destination',
      date: '2024-01-01',
      location: 'Paris',
    };

    render(<Timeline events={[event]} onEventClick={() => undefined} />);

    const eventBox = screen.getByText('Arrive at Destination').parentElement;
    expect(eventBox).toHaveClass('cursor-pointer');
    expect(eventBox).toHaveClass('hover:bg-base-200');
  });

  it('should not apply hover styles when onEventClick is not provided', () => {
    const event: TripEvent = {
      id: '1',
      type: 'arrive_destination',
      date: '2024-01-01',
      location: 'Paris',
    };

    render(<Timeline events={[event]} />);

    const eventBox = screen.getByText('Arrive at Destination').parentElement;
    expect(eventBox).not.toHaveClass('cursor-pointer');
    expect(eventBox).not.toHaveClass('hover:bg-base-200');
  });
});

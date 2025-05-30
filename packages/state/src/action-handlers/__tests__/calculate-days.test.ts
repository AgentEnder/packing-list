import { describe, it, expect } from 'vitest';
import { enumerateTripDays } from '../calculate-days.js';
import { TripEvent, Day } from '@packing-list/model';
import { parseISO } from 'date-fns';

describe('enumerateTripDays', () => {
  it('should return empty array for no events', () => {
    expect(enumerateTripDays([])).toEqual([]);
  });

  it('should handle a simple round trip with no intermediate stops', () => {
    const events: TripEvent[] = [
      {
        id: 'event-1',
        type: 'leave_home',
        date: '2024-07-25',
        notes: 'Morning departure',
      },
      {
        id: 'event-2',
        type: 'arrive_destination',
        date: '2024-07-25',
        location: 'Paris',
        notes: 'Evening arrival',
      },
      {
        id: 'event-3',
        type: 'leave_destination',
        date: '2024-07-28',
        location: 'Paris',
        notes: 'Afternoon departure',
      },
      {
        id: 'event-4',
        type: 'arrive_home',
        date: '2024-07-28',
        notes: 'Late night arrival',
      },
    ];

    const days = enumerateTripDays(events);

    expect(days).toHaveLength(4); // 25, 26, 27, 28 July

    // First day - departure and arrival in Paris
    expect(days[0]).toMatchObject({
      date: parseISO('2024-07-25').setHours(0, 0, 0, 0),
      travel: true,
      location: 'Paris',
    });

    // Middle days - staying in Paris
    expect(days[1]).toMatchObject({
      date: parseISO('2024-07-26').setHours(0, 0, 0, 0),
      travel: false,
      location: 'Paris',
    });
    expect(days[2]).toMatchObject({
      date: parseISO('2024-07-27').setHours(0, 0, 0, 0),
      travel: false,
      location: 'Paris',
    });

    // Last day - departure and arrival home
    expect(days[3]).toMatchObject({
      date: parseISO('2024-07-28').setHours(0, 0, 0, 0),
      travel: true,
      location: 'Home',
    });
  });

  it('should handle multi-city trip with same-day transitions', () => {
    const events: TripEvent[] = [
      {
        id: 'event-1',
        type: 'leave_home',
        date: '2024-07-25',
        notes: 'Morning departure',
      },
      {
        id: 'event-2',
        type: 'arrive_destination',
        date: '2024-07-25',
        location: 'Houston',
        notes: 'Afternoon arrival',
      },
      {
        id: 'event-3',
        type: 'leave_destination',
        date: '2024-07-28',
        location: 'Houston',
        notes: 'Morning departure',
      },
      {
        id: 'event-4',
        type: 'arrive_destination',
        date: '2024-07-28',
        location: 'Miami',
        notes: 'Evening arrival',
      },
      {
        id: 'event-5',
        type: 'leave_destination',
        date: '2024-07-31',
        location: 'Miami',
        notes: 'Afternoon departure',
      },
      {
        id: 'event-6',
        type: 'arrive_home',
        date: '2024-07-31',
        notes: 'Night arrival',
      },
    ];

    const days = enumerateTripDays(events);

    // Check first day - Houston arrival
    expect(days[0]).toMatchObject({
      date: parseISO('2024-07-25').setHours(0, 0, 0, 0),
      travel: true,
      location: 'Houston',
    });

    // Check transition day - Houston to Miami
    const houstonToMiamiDay = days.find(
      (d: Day) => d.date === parseISO('2024-07-28').setHours(0, 0, 0, 0)
    );
    expect(houstonToMiamiDay).toMatchObject({
      travel: true,
      location: 'Miami',
    });

    // Check last day - return home
    const lastDay = days[days.length - 1];
    expect(lastDay).toMatchObject({
      date: parseISO('2024-07-31').setHours(0, 0, 0, 0),
      travel: true,
      location: 'Home',
    });

    // Verify non-travel days in Miami
    const miamiDays = days.filter(
      (d: Day) =>
        d.date > parseISO('2024-07-28').setHours(0, 0, 0, 0) &&
        d.date < parseISO('2024-07-31').setHours(0, 0, 0, 0)
    );
    miamiDays.forEach((day: Day) => {
      expect(day).toMatchObject({
        location: 'Miami',
        travel: false,
      });
    });
  });

  it('should handle events in non-chronological order', () => {
    const events: TripEvent[] = [
      {
        id: 'event-2',
        type: 'arrive_destination',
        date: '2024-07-25',
        location: 'Berlin',
        notes: 'Evening arrival',
      },
      {
        id: 'event-1',
        type: 'leave_home',
        date: '2024-07-25',
        notes: 'Morning departure',
      },
    ];

    const days = enumerateTripDays(events);

    // Should still process leave_home before arrive_destination
    expect(days[0]).toMatchObject({
      date: parseISO('2024-07-25').setHours(0, 0, 0, 0),
      travel: true,
      location: 'Berlin',
    });
  });

  it('should handle multi-day travel segments', () => {
    const events: TripEvent[] = [
      {
        id: 'event-1',
        type: 'leave_home',
        date: '2024-07-25',
        notes: 'Start road trip',
      },
      {
        id: 'event-2',
        type: 'arrive_destination',
        date: '2024-07-27', // Arrive two days later
        location: 'Grand Canyon',
        notes: 'Arrive at Grand Canyon after 2 days of driving',
      },
      {
        id: 'event-3',
        type: 'leave_destination',
        date: '2024-07-30',
        location: 'Grand Canyon',
        notes: 'Start return journey',
      },
      {
        id: 'event-4',
        type: 'arrive_home',
        date: '2024-08-01', // Two day return trip
        notes: 'Return home after 2 days of driving',
      },
    ];

    const days = enumerateTripDays(events);

    // Should have 8 days total (25,26,27,28,29,30,31,1)
    expect(days).toHaveLength(8);

    // First day - departure
    expect(days[0]).toMatchObject({
      date: parseISO('2024-07-25').setHours(0, 0, 0, 0),
      travel: true,
      location: 'Home',
    });

    // Second day - still traveling
    expect(days[1]).toMatchObject({
      date: parseISO('2024-07-26').setHours(0, 0, 0, 0),
      travel: true,
      location: 'Traveling',
    });

    // Third day - arrival at Grand Canyon
    expect(days[2]).toMatchObject({
      date: parseISO('2024-07-27').setHours(0, 0, 0, 0),
      travel: true,
      location: 'Grand Canyon',
    });

    // Days at Grand Canyon should not be travel days
    const stationaryDays = days.slice(3, 5);
    stationaryDays.forEach((day) => {
      expect(day).toMatchObject({
        location: 'Grand Canyon',
        travel: false,
      });
    });

    // July 30 - Start return journey
    expect(days[5]).toMatchObject({
      date: parseISO('2024-07-30').setHours(0, 0, 0, 0),
      travel: true,
      location: 'Grand Canyon',
    });

    // July 31 - Still traveling
    expect(days[6]).toMatchObject({
      date: parseISO('2024-07-31').setHours(0, 0, 0, 0),
      travel: true,
      location: 'Traveling',
    });

    // August 1 - Return home
    expect(days[7]).toMatchObject({
      date: parseISO('2024-08-01').setHours(0, 0, 0, 0),
      travel: true,
      location: 'Home',
    });
  });
});

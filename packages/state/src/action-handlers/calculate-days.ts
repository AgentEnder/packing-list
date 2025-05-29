import { Day, Trip, TripEvent } from '@packing-list/model';
import { StoreType } from '../store.js';
import { ActionHandler } from '../actions.js';

export type CalculateDaysAction = {
  type: 'CALCULATE_DAYS';
  payload: Trip;
};

export const calculateDaysHandler: ActionHandler<CalculateDaysAction> = (
  state: StoreType,
  action: CalculateDaysAction
) => {
  return {
    ...state,
    trip: {
      ...state.trip,
      days: enumerateTripDays(action.payload.tripEvents ?? []),
    },
  };
};

export function enumerateTripDays(tripEvents: TripEvent[]): Day[] {
  if (!tripEvents || tripEvents.length === 0) {
    return [];
  }

  // Sort events by date, and then by departure / arrival.
  // Its assumed that if both are present, the departure will come first.
  const sortedEvents = [...tripEvents].sort((a, b) => {
    if (a.date === b.date) {
      return a.type.localeCompare(b.type);
    }
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const startDate = new Date(sortedEvents[0].date);
  const endDate = new Date(sortedEvents[sortedEvents.length - 1].date);

  const days: Day[] = [];
  const currentDate = new Date(startDate);

  // Create a map of events by date for quick lookup
  const eventsByDate = new Map<string, TripEvent[]>();
  sortedEvents.forEach((event) => {
    const arr = eventsByDate.get(event.date) || [];
    arr.push(event);
    eventsByDate.set(event.date, arr);
  });

  function getEventsOnDate(date: string): TripEvent[] | undefined {
    const events = eventsByDate.get(date);
    if (!events) {
      return [];
    }
    return events;
  }

  // Track current state
  let currentLocation = 'home';
  let traveling = false;

  while (currentDate <= endDate) {
    const dateString = currentDate.toISOString().split('T')[0];
    const eventsOnThisDay = getEventsOnDate(dateString);

    // Create day object
    const day: Day = {
      location: currentLocation,
      expectedClimate: getClimateForLocation(currentLocation),
      items: [],
      travel: traveling,
      date: currentDate.getTime(),
    };

    if (eventsOnThisDay) {
      console.log('eventsOnThisDay', eventsOnThisDay, dateString);
      for (const event of eventsOnThisDay) {
        // All days that have an event are travel days...
        // You either just left, or are arriving.
        day.travel = true;

        switch (event?.type) {
          case 'leave_home':
            currentLocation = 'Home';
            traveling = true;
            break;
          case 'leave_destination':
            currentLocation = 'Traveling';
            traveling = true;
            break;
          case 'arrive_destination':
            currentLocation = event.location || 'destination';
            traveling = false;
            break;
          case 'arrive_home':
            currentLocation = 'Home';
            traveling = false;
            break;
        }
      }
    } else {
      day.travel = traveling;
    }
    day.location = currentLocation;
    day.expectedClimate = getClimateForLocation(currentLocation);

    days.push(day);

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
}

function getClimateForLocation(location: string): string {
  // Default climate mapping - could be enhanced with real data
  const climateMap: Record<string, string> = {
    home: 'temperate',
    Traveling: 'variable',
    destination: 'temperate',
  };

  return climateMap[location] || 'temperate';
}

import { Day, Trip, TripEvent } from '@packing-list/model';
import { StoreType } from '../store.js';
import { ActionHandler } from '../actions.js';
import { addDays, parseISO, isSameDay, compareAsc } from 'date-fns';

export type CalculateDaysAction = {
  type: 'CALCULATE_DAYS';
  payload: Trip;
};

export const calculateDaysHandler: ActionHandler<CalculateDaysAction> = (
  state: StoreType,
  action: CalculateDaysAction
) => {
  const selectedTripId = state.trips.selectedTripId;
  if (!selectedTripId) {
    return state;
  }

  const tripData = state.trips.byId[selectedTripId];
  if (!tripData) {
    return state;
  }

  return {
    ...state,
    trips: {
      ...state.trips,
      byId: {
        ...state.trips.byId,
        [selectedTripId]: {
          ...tripData,
          trip: {
            ...tripData.trip,
            days: enumerateTripDays(action.payload.tripEvents ?? []),
          },
        },
      },
    },
  };
};

export function enumerateTripDays(tripEvents: TripEvent[]): Day[] {
  if (!tripEvents || tripEvents.length === 0) {
    return [];
  }

  // Sort events by date, and then by departure / arrival.
  const sortedEvents = [...tripEvents].sort((a, b) => {
    const aDate = parseISO(a.date);
    const bDate = parseISO(b.date);
    aDate.setHours(0, 0, 0, 0);
    bDate.setHours(0, 0, 0, 0);
    const dateCompare = compareAsc(aDate, bDate);
    if (dateCompare === 0) {
      // For same day events, departures should come before arrivals
      if (a.type.includes('leave') && b.type.includes('arrive')) return -1;
      if (a.type.includes('arrive') && b.type.includes('leave')) return 1;
      return a.type.localeCompare(b.type);
    }
    return dateCompare;
  });

  const startDate = parseISO(sortedEvents[0].date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = parseISO(sortedEvents[sortedEvents.length - 1].date);
  endDate.setHours(0, 0, 0, 0);

  const days: Day[] = [];
  let currentDate = startDate;

  // Track current state
  let currentLocation = 'home';
  let traveling = false;

  while (compareAsc(currentDate, endDate) <= 0) {
    const eventsOnThisDay = sortedEvents.filter((event) => {
      const eventDate = parseISO(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return isSameDay(currentDate, eventDate);
    });

    // Create day object
    const day: Day = {
      location: currentLocation,
      expectedClimate: getClimateForLocation(currentLocation),
      items: [],
      travel: false, // Start with no travel
      date: currentDate.getTime(),
    };

    if (eventsOnThisDay.length > 0) {
      for (const event of eventsOnThisDay) {
        switch (event?.type) {
          case 'leave_home':
            day.location = 'Home';
            day.travel = true; // Mark as travel when leaving
            currentLocation = 'Traveling';
            traveling = true;
            break;
          case 'leave_destination':
            day.location = currentLocation;
            day.travel = true; // Mark as travel when leaving
            currentLocation = 'Traveling';
            traveling = true;
            break;
          case 'arrive_destination':
            currentLocation = event.location || 'destination';
            day.location = currentLocation;
            day.travel = traveling; // Keep travel status from previous state
            traveling = false;
            break;
          case 'arrive_home':
            currentLocation = 'Home';
            day.location = 'Home';
            day.travel = traveling; // Keep travel status from previous state
            traveling = false;
            break;
        }
      }
    } else {
      day.location = currentLocation;
      day.travel = traveling;
    }

    day.expectedClimate = getClimateForLocation(day.location);
    days.push(day);

    // Move to next day
    currentDate = addDays(currentDate, 1);
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

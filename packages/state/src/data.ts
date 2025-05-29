import { TripEvent } from '@packing-list/model';
import { StoreType } from './store.js';
import { enumerateTripDays } from './action-handlers/calculate-days.js';

const tripEvents: TripEvent[] = [
  {
    id: 'event-1',
    type: 'leave_home',
    date: '2024-07-25',
    notes: 'Flight departs at 8:30 AM',
  },
  {
    id: 'event-2',
    type: 'arrive_destination',
    date: '2024-07-26',
    location: 'Houston, TX',
    notes: 'Stay at Hotel ZaZa Houston Memorial City',
  },
  {
    id: 'event-3',
    type: 'leave_destination',
    date: '2024-07-28',
    location: 'Houston, TX',
    notes: 'Flight to Miami at 2:15 PM',
  },
  {
    id: 'event-4',
    type: 'arrive_destination',
    date: '2024-07-29',
    location: 'Miami, FL',
    notes: 'Stay at Fontainebleau Miami Beach',
  },
  {
    id: 'event-5',
    type: 'leave_destination',
    date: '2024-07-31',
    location: 'Miami, FL',
    notes: 'Flight home at 6:45 PM',
  },
  {
    id: 'event-6',
    type: 'arrive_home',
    date: '2024-08-02',
    notes: 'Expected arrival 11:30 PM',
  },
];

export const DEMO_DATA: StoreType = {
  people: [
    {
      id: 'person-1',
      name: 'Sarah Johnson',
      age: 42,
      gender: 'female',
    },
    {
      id: 'person-2',
      name: 'Mike Johnson',
      age: 45,
      gender: 'male',
    },
    {
      id: 'person-3',
      name: 'Emma Johnson',
      age: 12,
      gender: 'female',
    },
    {
      id: 'person-4',
      name: 'Alex Johnson',
      age: 8,
      gender: 'male',
    },
  ],
  itemOverrides: [],
  defaultItemRules: [],
  trip: {
    days: enumerateTripDays(tripEvents),
    tripEvents,
  },
  calculated: {
    defaultItems: [],
  },
};

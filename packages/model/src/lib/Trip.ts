import { Day } from './Day.js';
import { TripEvent } from './TripEvent.js';

export type Trip = {
  id: string;
  days: Day[];
  tripEvents?: TripEvent[];
};

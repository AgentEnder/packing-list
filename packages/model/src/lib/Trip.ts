import { Day } from './Day.js';
import { TripEvent } from './TripEvent.js';

export type Trip = {
  days: Day[];
  tripEvents?: TripEvent[];
};

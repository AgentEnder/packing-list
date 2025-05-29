export type TripEvent = {
  id: string;
  type:
    | 'leave_home'
    | 'arrive_home'
    | 'leave_destination'
    | 'arrive_destination';
  date: string;
  location?: string;
  notes?: string;
};

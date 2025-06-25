import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';

interface TripEvent {
  tripId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  color?: string;
}

interface TripEventWithPosition extends TripEvent {
  stablePosition: number;
}

interface CalendarProps {
  trips: TripEvent[];
  onTripClick?: (tripId: string) => void;
  selectedTripId?: string;
}

export function Calendar({
  trips,
  onTripClick,
  selectedTripId,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Get the full calendar grid including previous/next month days
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // Create position mapping based on overlapping trips only
  const createStablePositions = (): TripEventWithPosition[] => {
    // First, sort all trips by start date and ID for consistent ordering
    const sortedTrips = trips.slice().sort((a, b) => {
      const startDateDiff =
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      if (startDateDiff !== 0) return startDateDiff;
      return a.tripId.localeCompare(b.tripId);
    });

    // Assign positions based on overlapping groups
    const tripsWithPositions: TripEventWithPosition[] = [];

    for (const trip of sortedTrips) {
      const tripStart = new Date(trip.startDate);
      const tripEnd = new Date(trip.endDate);

      // Find all existing trips that overlap with this trip
      const overlappingTrips = tripsWithPositions.filter((existingTrip) => {
        const existingStart = new Date(existingTrip.startDate);
        const existingEnd = new Date(existingTrip.endDate);

        // Check if trips overlap
        return tripStart <= existingEnd && tripEnd >= existingStart;
      });

      // Find the lowest available position among overlapping trips
      const usedPositions = overlappingTrips.map((t) => t.stablePosition);
      let position = 0;
      while (usedPositions.includes(position)) {
        position++;
      }

      tripsWithPositions.push({ ...trip, stablePosition: position });
    }

    return tripsWithPositions;
  };

  const allTripsWithPositions = useMemo(() => createStablePositions(), [trips]);

  const getTripsForDate = (date: Date): TripEventWithPosition[] => {
    return allTripsWithPositions.filter((trip) => {
      const tripStart = new Date(trip.startDate);
      const tripEnd = new Date(trip.endDate);
      return date >= tripStart && date <= tripEnd;
    });
  };

  const isFirstDayOfTrip = (date: Date, trip: TripEvent) => {
    return isSameDay(date, new Date(trip.startDate));
  };

  const isLastDayOfTrip = (date: Date, trip: TripEvent) => {
    return isSameDay(date, new Date(trip.endDate));
  };

  return (
    <div className="bg-base-100 rounded-lg shadow-lg border p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={goToPreviousMonth}
            className="btn btn-ghost btn-sm btn-square"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToNextMonth}
            className="btn btn-ghost btn-sm btn-square"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-base-content/70"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const dayTrips = getTripsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={`
                min-h-[100px] p-1 border border-base-300 relative flex flex-col
                ${isCurrentMonth ? 'bg-base-100' : 'bg-base-200/30'}
                ${isToday ? 'ring-2 ring-primary ring-opacity-50' : ''}
              `}
            >
              {/* Day Number */}
              <div
                className={`
                text-sm font-medium mb-1
                ${isCurrentMonth ? 'text-base-content' : 'text-base-content/30'}
                ${isToday ? 'text-primary font-bold' : ''}
              `}
              >
                {format(day, 'd')}
              </div>

              {/* Trip Events */}
              <div className="relative flex-1">
                {dayTrips.map((trip) => {
                  const isSelected = trip.tripId === selectedTripId;
                  const isFirstDay = isFirstDayOfTrip(day, trip);
                  const isLastDay = isLastDayOfTrip(day, trip);

                  return (
                    <div
                      key={`${trip.tripId}-${day.toISOString()}`}
                      onClick={() => onTripClick?.(trip.tripId)}
                      style={{
                        position: 'absolute',
                        top: `${trip.stablePosition * 18}px`, // Use stable position instead of array index
                        left: 0,
                        right: 0,
                        height: '16px', // Fixed height for all trip indicators
                      }}
                      className={`
                        text-xs px-1 rounded cursor-pointer transition-all flex items-center
                        ${
                          isSelected
                            ? 'bg-primary text-primary-content ring-2 ring-inset ring-primary/30'
                            : 'bg-primary/50 text-primary-content hover:bg-primary/75'
                        }
                        ${isFirstDay ? 'rounded-l-md' : 'rounded-l-none'}
                        ${isLastDay ? 'rounded-r-md' : 'rounded-r-none'}
                      `}
                      title={`${trip.title} (${format(
                        trip.startDate,
                        'MMM d'
                      )} - ${format(trip.endDate, 'MMM d')})`}
                    >
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        {isFirstDay && (
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                        )}
                        <span className="truncate text-xs leading-none">
                          {isFirstDay ? trip.title : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {trips.length > 0 && (
        <div className="mt-4 p-4 bg-base-200 rounded-lg">
          <h3 className="text-sm font-medium mb-2">Visible trips</h3>
          <div className="flex flex-wrap gap-2">
            {trips
              .filter((trip) => {
                const tripStart = new Date(trip.startDate);
                const tripEnd = new Date(trip.endDate);
                return tripStart <= calendarEnd && tripEnd >= calendarStart;
              })
              .map((trip) => (
                <div
                  key={trip.tripId}
                  onClick={() => onTripClick?.(trip.tripId)}
                  className={`
                    flex items-center gap-2 px-2 py-1 rounded text-xs cursor-pointer transition-all
                    ${
                      trip.tripId === selectedTripId
                        ? 'bg-primary text-primary-content'
                        : 'bg-base-100 hover:bg-base-300'
                    }
                  `}
                >
                  <MapPin className="w-3 h-3" />
                  <span>{trip.title}</span>
                  <span className="text-xs opacity-70">
                    {format(trip.startDate, 'MMM d')} -{' '}
                    {format(trip.endDate, 'MMM d')}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

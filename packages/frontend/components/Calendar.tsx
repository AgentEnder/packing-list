import { useMemo, useState, useEffect } from 'react';
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
import { navigate } from 'vike/client/router';
import { applyBaseUrl } from '@packing-list/shared-utils';

interface TripEvent {
  tripId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  color?: string;
  isPreview?: boolean;
}

interface TripEventWithPosition extends TripEvent {
  stablePosition: number;
}

interface CalendarProps {
  trips: TripEvent[];
  onTripClick?: (tripId: string) => void;
  selectedTripId?: string;
  onDateRangeSelect?: (startDate: Date, endDate: Date) => void;
}

export function Calendar({
  trips,
  onTripClick,
  selectedTripId,
  onDateRangeSelect,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateSelectionState, setDateSelectionState] = useState<{
    startDate: Date | null;
    endDate: Date | null;
    isSelecting: boolean;
  }>({
    startDate: null,
    endDate: null,
    isSelecting: false,
  });

  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const cancelSelection = () => {
    setDateSelectionState({
      startDate: null,
      endDate: null,
      isSelecting: false,
    });
    setHoverDate(null);
  };

  // Handle keyboard events for cancellation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dateSelectionState.isSelecting) {
        cancelSelection();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dateSelectionState.isSelecting]);

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

  const getPreviewTrip = () => {
    if (!dateSelectionState.isSelecting || !dateSelectionState.startDate)
      return null;

    const startDate = dateSelectionState.startDate;
    const endDate = hoverDate || startDate;

    // Determine the actual range (start could be after end)
    const rangeStart = startDate <= endDate ? startDate : endDate;
    const rangeEnd = startDate <= endDate ? endDate : startDate;

    return {
      tripId: 'preview',
      title: 'New Trip',
      startDate: rangeStart,
      endDate: rangeEnd,
      isPreview: true,
    };
  };

  // Create position mapping based on overlapping trips only
  const createStablePositions = (
    includePreview = false
  ): TripEventWithPosition[] => {
    const previewTrip = includePreview ? getPreviewTrip() : null;
    const allTrips = previewTrip ? [...trips, previewTrip] : trips;

    // First, sort all trips by start date and ID for consistent ordering
    const sortedTrips = allTrips.slice().sort((a, b) => {
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
  const allTripsWithPreview = useMemo(
    () =>
      dateSelectionState.isSelecting
        ? createStablePositions(true)
        : allTripsWithPositions,
    [
      allTripsWithPositions,
      dateSelectionState.isSelecting,
      dateSelectionState.startDate,
      hoverDate,
    ]
  );

  const getTripsForDate = (date: Date): TripEventWithPosition[] => {
    return allTripsWithPreview.filter((trip) => {
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

  const handleDateClick = (date: Date, event: React.MouseEvent) => {
    // Prevent date selection if clicking on a trip
    if ((event.target as HTMLElement).closest('[data-trip-indicator]')) {
      return;
    }

    if (!onDateRangeSelect) return;

    if (!dateSelectionState.isSelecting) {
      // Start new selection
      setDateSelectionState({
        startDate: date,
        endDate: null,
        isSelecting: true,
      });
    } else if (dateSelectionState.startDate && !dateSelectionState.endDate) {
      // Complete selection
      const startDate = dateSelectionState.startDate;
      const endDate = date;

      // Ensure start date is before end date
      const finalStartDate = startDate <= endDate ? startDate : endDate;
      const finalEndDate = startDate <= endDate ? endDate : startDate;

      setDateSelectionState({
        startDate: null,
        endDate: null,
        isSelecting: false,
      });
      setHoverDate(null);

      onDateRangeSelect(finalStartDate, finalEndDate);
    }
  };

  const isDateInSelection = (date: Date) => {
    if (!dateSelectionState.startDate) return false;

    if (!dateSelectionState.endDate) {
      return isSameDay(date, dateSelectionState.startDate);
    }

    const start = dateSelectionState.startDate;
    const end = dateSelectionState.endDate;
    return date >= start && date <= end;
  };

  const isSelectionStart = (date: Date) => {
    return (
      dateSelectionState.startDate &&
      isSameDay(date, dateSelectionState.startDate)
    );
  };

  const isSelectionEnd = (date: Date) => {
    return (
      dateSelectionState.endDate && isSameDay(date, dateSelectionState.endDate)
    );
  };

  const isInPreviewRange = (date: Date) => {
    if (!dateSelectionState.isSelecting || !dateSelectionState.startDate)
      return false;

    const startDate = dateSelectionState.startDate;
    const endDate = hoverDate || startDate;

    // Determine the actual range (start could be after end)
    const rangeStart = startDate <= endDate ? startDate : endDate;
    const rangeEnd = startDate <= endDate ? endDate : startDate;

    return date >= rangeStart && date <= rangeEnd;
  };

  return (
    <div className="bg-base-100 rounded-lg shadow-lg border p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          {dateSelectionState.isSelecting && (
            <p className="text-sm text-base-content/70 mt-1">
              {dateSelectionState.startDate
                ? `Start: ${format(
                    dateSelectionState.startDate,
                    'MMM d'
                  )} - Click end date (ESC or right-click to cancel)`
                : 'Click to select start date (ESC or right-click to cancel)'}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {dateSelectionState.isSelecting && (
            <button onClick={cancelSelection} className="btn btn-ghost btn-sm">
              Cancel
            </button>
          )}
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
          const inSelection = isDateInSelection(day);
          const isSelStart = isSelectionStart(day);
          const isSelEnd = isSelectionEnd(day);
          const inPreviewRange = isInPreviewRange(day);

          return (
            <div
              key={day.toISOString()}
              onClick={(e) => handleDateClick(day, e)}
              onContextMenu={(e) => {
                if (dateSelectionState.isSelecting) {
                  e.preventDefault();
                  cancelSelection();
                }
              }}
              onMouseEnter={() =>
                dateSelectionState.isSelecting && setHoverDate(day)
              }
              onMouseLeave={() =>
                dateSelectionState.isSelecting && setHoverDate(null)
              }
              className={`
                min-h-[100px] p-1 border border-base-300 relative flex flex-col cursor-pointer transition-all
                ${isCurrentMonth ? 'bg-base-100' : 'bg-base-200/30'}
                ${isToday ? 'ring-2 ring-primary ring-opacity-50' : ''}
                ${inSelection ? 'bg-accent/20' : ''}
                ${isSelStart ? 'bg-accent/40 ring-2 ring-accent/50' : ''}
                ${isSelEnd ? 'bg-accent/40 ring-2 ring-accent/50' : ''}
                ${
                  inPreviewRange && !inSelection
                    ? 'bg-accent/30 border-accent/50'
                    : ''
                }
                ${onDateRangeSelect ? 'hover:bg-base-200/50' : ''}
              `}
            >
              {/* Day Number */}
              <div
                className={`
                text-sm mb-1 transition-all
                ${isCurrentMonth ? 'text-base-content' : 'text-base-content/30'}
                ${isToday ? 'text-primary font-bold' : ''}
                ${
                  isSelStart || isSelEnd
                    ? 'font-bold text-accent-content'
                    : 'font-medium'
                }
                ${
                  inPreviewRange && !inSelection
                    ? 'font-semibold text-accent'
                    : ''
                }
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
                      data-trip-indicator
                      onClick={(e) => {
                        e.stopPropagation();
                        if (trip.isPreview) {
                          onDateRangeSelect?.(trip.startDate, trip.endDate);
                        } else {
                          onTripClick?.(trip.tripId);
                        }
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          applyBaseUrl(
                            import.meta.env.PUBLIC_ENV__BASE_URL,
                            `/trips/${trip.tripId}/settings`
                          )
                        );
                      }}
                      style={{
                        position: 'absolute',
                        top: `${trip.stablePosition * 18}px`, // Use stable position instead of array index
                        left: 0,
                        right: 0,
                        height: '16px', // Fixed height for all trip indicators
                      }}
                      className={`
                        text-xs px-1 rounded transition-all flex items-center cursor-pointer
                        ${
                          trip.isPreview
                            ? 'bg-accent/30 text-accent-content border-2 border-dashed border-accent/50 cursor-default'
                            : isSelected
                            ? 'bg-primary text-primary-content ring-2 ring-inset ring-primary/30'
                            : 'bg-primary/50 text-primary-content hover:bg-primary/75'
                        }
                        ${isFirstDay ? 'rounded-l-md' : 'rounded-l-none'}
                        ${isLastDay ? 'rounded-r-md' : 'rounded-r-none'}
                      `}
                      title={
                        trip.isPreview
                          ? `Preview: ${trip.title} (${format(
                              trip.startDate,
                              'MMM d'
                            )} - ${format(trip.endDate, 'MMM d')})`
                          : `${trip.title} (${format(
                              trip.startDate,
                              'MMM d'
                            )} - ${format(trip.endDate, 'MMM d')})`
                      }
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
          <h3 className="text-sm font-medium mb-2">
            {dateSelectionState.isSelecting
              ? 'Trips & Preview'
              : 'Visible trips'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {allTripsWithPreview
              .filter((trip) => {
                const tripStart = new Date(trip.startDate);
                const tripEnd = new Date(trip.endDate);
                return tripStart <= calendarEnd && tripEnd >= calendarStart;
              })
              .map((trip) => (
                <div
                  key={trip.tripId}
                  onClick={() => !trip.isPreview && onTripClick?.(trip.tripId)}
                  className={`
                    flex items-center gap-2 px-2 py-1 rounded text-xs transition-all
                    ${
                      trip.isPreview
                        ? 'bg-accent/20 text-accent-content border border-dashed border-accent/50 cursor-default'
                        : `cursor-pointer ${
                            trip.tripId === selectedTripId
                              ? 'bg-primary text-primary-content'
                              : 'bg-base-100 hover:bg-base-300'
                          }`
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

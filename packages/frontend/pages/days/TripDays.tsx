import { StoreType, useAppSelector, useAppDispatch } from '@packing-list/state';
import { createSelector } from '@reduxjs/toolkit';
import { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { TripEvent } from '@packing-list/model';
import { format, isSameMonth, parseISO } from 'date-fns';
import { TripDayRow } from './TripDayRow';

const selectTripInfo = createSelector(
  (state: StoreType) => state.trip,
  (state: StoreType) => state.calculated.packingListItems,
  (trip, packingListItems) => ({
    days: trip.days,
    tripEvents: trip.tripEvents || [],
    packingListItems,
  })
);

function formatDayLabel(timestamp: number, allDates: Date[]): string {
  const date = new Date(timestamp);

  // Check if all dates are in the same month
  const sameMonth = allDates.every((d) => isSameMonth(d, date));

  if (sameMonth) {
    return format(date, 'dd');
  } else {
    return format(date, 'MMM dd');
  }
}

interface TripDaysProps {
  onEventClick?: (event: TripEvent) => void;
}

export function TripDays({ onEventClick }: TripDaysProps) {
  const dispatch = useAppDispatch();
  const { days, tripEvents, packingListItems } = useAppSelector(selectTripInfo);

  const handleToggleItem = (itemId: string) => {
    dispatch({
      type: 'TOGGLE_ITEM_PACKED',
      payload: { itemId },
    });
  };

  if (days.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No trip days configured yet
      </div>
    );
  }

  const dates = useMemo(() => {
    return days.map((day) => day.date);
  }, [days]);

  const dayLabels = useMemo<Map<number, string>>(() => {
    const allDateObjects = dates.map((ts) => new Date(ts));
    const map = new Map<number, string>();
    for (const day of days) {
      const dayLabel = formatDayLabel(day.date, allDateObjects);
      map.set(day.date, dayLabel);
    }
    return map;
  }, [days, dates]);

  return (
    <ul className="list bg-base-100 rounded-box shadow-md">
      <li className="p-4 pb-2 text-xs opacity-60 tracking-wide flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        Trip Schedule
      </li>

      {days.map((day, index) => {
        const dayLabel = dayLabels.get(day.date);
        if (!dayLabel) {
          throw new Error(`Day label not found for day ${day.date}`);
        }
        const dayDate = format(new Date(day.date), 'yyyy-MM-dd');
        const dayEvents = tripEvents.filter(
          (event) => format(parseISO(event.date), 'yyyy-MM-dd') === dayDate
        );
        const dayItems =
          packingListItems?.filter((item) => item.dayIndex === index) || [];

        return (
          <TripDayRow
            key={index}
            index={index}
            dayLabel={dayLabel}
            date={day.date}
            location={day.location}
            expectedClimate={day.expectedClimate}
            isTravel={day.travel}
            events={dayEvents}
            packingListItems={dayItems}
            onEventClick={onEventClick}
            onToggleItem={handleToggleItem}
          />
        );
      })}
    </ul>
  );
}

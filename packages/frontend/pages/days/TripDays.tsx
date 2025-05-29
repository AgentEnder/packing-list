import { StoreType, useAppSelector } from '@packing-list/state';
import { createSelector } from '@reduxjs/toolkit';
import { useMemo } from 'react';

const selectTripInfo = createSelector(
  (state: StoreType) => state.trip,
  (trip) => ({
    days: trip.days,
    tripEvents: trip.tripEvents || [],
  })
);

function formatDayLabel(date: Date, allDates: Date[]): string {
  // Check if all dates are in the same month
  const months = [...new Set(allDates.map((d) => d.getMonth()))];
  const sameMonth = months.length === 1;

  if (sameMonth) {
    // Add 1 to the date to start at 1 instead of 0
    return date.getDate().toString();
  } else {
    date.setTime(date.getTime() + date.getTimezoneOffset() * 60000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

export function TripDays() {
  const { days } = useAppSelector(selectTripInfo);

  if (days.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No trip days configured yet
      </div>
    );
  }

  if (!days.length) {
    return (
      <div className="text-center text-gray-500 py-8">No trip dates found</div>
    );
  }

  const dates = useMemo(() => {
    return days.map((day) => new Date(day.date));
  }, [days]);

  return (
    <ul className="list bg-base-100 rounded-box shadow-md">
      <li className="p-4 pb-2 text-xs opacity-60 tracking-wide">Day by day</li>

      {days.map((day, index) => {
        const date = dates[index];
        const dayLabel = formatDayLabel(date, dates);
        const paddedIndex = dayLabel.toString().padStart(2, '0');

        return (
          <li key={index} className="list-row">
            <div className="text-4xl font-thin opacity-30 tabular-nums">
              {paddedIndex}
            </div>
            <div className="flex flex-col items-center">
              {day.travel && (
                <div className="text-xs text-blue-600 font-semibold">
                  Travel
                </div>
              )}
            </div>
            <div className="list-col-grow">
              <div className="font-medium">{day.location}</div>
              <div className="text-xs uppercase font-semibold opacity-60">
                {day.expectedClimate}
              </div>
              {day.items.length > 0 && (
                <div className="text-xs text-gray-500">
                  {day.items.length} item{day.items.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            <button className="btn btn-square btn-ghost">
              <svg
                className="size-[1.2em]"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <g
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeWidth="2"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M6 3L20 12 6 21 6 3z"></path>
                </g>
              </svg>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

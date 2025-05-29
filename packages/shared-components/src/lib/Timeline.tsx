import React from 'react';
import { TripEvent } from '@packing-list/model';

interface TimelineProps {
  events: TripEvent[];
  onEventClick?: (event: TripEvent) => void;
  className?: string;
}

const eventTypeLabels: Record<string, string> = {
  leave_home: 'Leave Home',
  arrive_destination: 'Arrive at Destination',
  leave_destination: 'Leave Destination',
  arrive_home: 'Arrive Home',
};

const eventTypeIcons: Record<string, React.ReactElement> = {
  leave_home: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-4 h-4"
    >
      <path
        fillRule="evenodd"
        d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z"
        clipRule="evenodd"
      />
    </svg>
  ),
  arrive_destination: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-4 h-4"
    >
      <path
        fillRule="evenodd"
        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
        clipRule="evenodd"
      />
    </svg>
  ),
  leave_destination: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-4 h-4"
    >
      <path
        fillRule="evenodd"
        d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
        clipRule="evenodd"
      />
    </svg>
  ),
  arrive_home: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-4 h-4"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  date.setTime(date.getTime() + date.getTimezoneOffset() * 60000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function Timeline({
  events,
  onEventClick,
  className = '',
}: TimelineProps) {
  if (events.length === 0) {
    return (
      <div className={`text-center text-gray-500 py-8 ${className}`}>
        No events in timeline
      </div>
    );
  }

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <ul className={`timeline timeline-vertical ${className}`}>
      {sortedEvents.map((event, index) => (
        <li key={event.id}>
          {index > 0 && <hr />}
          <div className="timeline-start text-end">
            {formatDate(event.date)}
          </div>
          <div className="timeline-middle">
            <div className="flex items-center justify-center w-8 h-8 bg-base-200 rounded-full">
              {eventTypeIcons[event.type] || eventTypeIcons.arrive_destination}
            </div>
          </div>
          <div
            className={`timeline-end timeline-box ${
              onEventClick ? 'cursor-pointer hover:bg-base-200' : ''
            }`}
            onClick={() => onEventClick?.(event)}
          >
            <div className="font-semibold">
              {eventTypeLabels[event.type] || event.type}
            </div>
            {event.location && (
              <div className="text-sm text-gray-600">{event.location}</div>
            )}
            {event.notes && (
              <div className="text-xs text-gray-500 mt-1">{event.notes}</div>
            )}
          </div>
          {index < sortedEvents.length - 1 && <hr />}
        </li>
      ))}
    </ul>
  );
}

export default Timeline;

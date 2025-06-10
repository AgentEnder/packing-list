import React from 'react';
import { TripEvent } from '@packing-list/model';
import { Home, MapPin, Luggage, CheckCircle } from 'lucide-react';
import { formatDate } from '@packing-list/shared-utils';

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
  leave_home: <Home className="w-4 h-4" />,
  arrive_destination: <MapPin className="w-4 h-4" />,
  leave_destination: <Luggage className="w-4 h-4" />,
  arrive_home: <CheckCircle className="w-4 h-4" />,
};


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
            data-testid={`timeline-event-${event.type}${
              event.location ? `-${event.location}` : ''
            }`}
          >
            <div
              className="font-semibold"
              data-testid={`timeline-event-title-${event.type}`}
            >
              {eventTypeLabels[event.type] || event.type}
            </div>
            {event.location && (
              <div
                className="text-sm text-gray-600"
                data-testid={`timeline-event-location-${event.location}`}
              >
                {event.location}
              </div>
            )}
            {event.notes && (
              <div
                className="text-xs text-gray-500 mt-1"
                data-testid={`timeline-event-notes-${event.id}`}
              >
                {event.notes}
              </div>
            )}
          </div>
          {index < sortedEvents.length - 1 && <hr />}
        </li>
      ))}
    </ul>
  );
}

export default Timeline;

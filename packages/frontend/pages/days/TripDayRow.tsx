import { ChevronDown, ChevronRight, Plane } from 'lucide-react';
import { PackingListItem, TripEvent } from '@packing-list/model';
import { useState } from 'react';

interface TripDayRowProps {
  index: number;
  dayLabel: string;
  date: number;
  location: string;
  expectedClimate: string;
  isTravel: boolean;
  events: TripEvent[];
  packingListItems: PackingListItem[];
  onEventClick?: (event: TripEvent) => void;
  onToggleItem?: (itemId: string) => void;
}

function calculatePackingProgress(items: PackingListItem[]) {
  if (!items || items.length === 0) return 0;
  const packedItems = items.filter((item) => item.isPacked).length;
  return Math.round((packedItems / items.length) * 100);
}

function formatEventDescription(event: TripEvent): string {
  switch (event.type) {
    case 'leave_home':
      return 'Departing';
    case 'arrive_home':
      return 'Returning Home';
    case 'leave_destination':
      return 'Departing';
    case 'arrive_destination':
      return 'Arriving';
    default:
      return '';
  }
}

export function TripDayRow({
  dayLabel,
  location,
  expectedClimate,
  isTravel,
  events,
  packingListItems,
  onEventClick,
  onToggleItem,
}: TripDayRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const packingProgress = calculatePackingProgress(packingListItems);
  const paddedIndex = dayLabel.toString().padStart(2, '0');

  return (
    <li className={`flex flex-col ${isTravel ? 'bg-base-200/50' : ''}`}>
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-base-200/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="text-4xl font-thin opacity-30 tabular-nums font-mono">
          {paddedIndex}
        </div>
        <div className="flex items-center justify-center w-6">
          {isTravel && <Plane className="w-4 h-4 text-primary/60" />}
        </div>
        <div className="flex-1 min-h-[2.5rem] flex flex-col justify-center">
          {events.length > 0 ? (
            <div className="space-y-2 w-full">
              {events.map((event) => (
                <button
                  key={event.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(event);
                  }}
                  className="block w-full text-left text-sm hover:bg-base-200 rounded transition-colors"
                >
                  <div className="font-medium">
                    {formatEventDescription(event)}
                    {event.type.includes('destination') && event.location
                      ? ` ${event.location}`
                      : ''}
                  </div>
                  {event.notes && (
                    <div className="text-xs text-gray-500">{event.notes}</div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="font-medium">{location}</div>
              <div className="text-xs uppercase font-semibold opacity-60">
                {expectedClimate}
              </div>
            </>
          )}
        </div>
        {packingListItems && packingListItems.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 min-w-[120px]">
              <div className="flex-1 h-1 bg-base-300 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    packingProgress === 100
                      ? 'bg-success'
                      : packingProgress > 0
                      ? 'bg-primary'
                      : 'bg-base-300'
                  }`}
                  style={{ width: `${packingProgress}%` }}
                />
              </div>
              <div className="text-xs tabular-nums text-base-content/60 min-w-[3ch]">
                {packingProgress}%
              </div>
            </div>
            <div className="text-xs text-gray-500 min-w-[4ch]">
              {packingListItems.length} item
              {packingListItems.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
        <div className="flex items-center justify-center w-8">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
      </div>

      {/* Expanded packing list */}
      {isExpanded && packingListItems && packingListItems.length > 0 && (
        <div className="px-8 pb-4">
          <div className="divider my-2"></div>
          <ul className="space-y-2">
            {packingListItems.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={item.isPacked}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleItem?.(item.id);
                  }}
                  className="checkbox checkbox-sm"
                />
                <span
                  className={item.isPacked ? 'line-through opacity-50' : ''}
                >
                  {item.quantity > 1 && (
                    <span className="font-medium mr-2">{item.quantity}×</span>
                  )}
                  {item.itemName}
                </span>
                {item.personName && (
                  <span className="text-xs bg-base-200 px-2 py-0.5 rounded">
                    {item.personName}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

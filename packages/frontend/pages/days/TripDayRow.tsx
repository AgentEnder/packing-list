import { ChevronDown, ChevronRight, Plane } from 'lucide-react';
import { PackingListItem, TripEvent } from '@packing-list/model';
import { useState, useEffect, useRef } from 'react';
import { useAppDispatch, actions } from '@packing-list/state';

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

interface ProgressBarProps {
  packingListItems: PackingListItem[];
  packingProgress: number;
}

interface CircularProgressProps {
  progress: number;
}

function CircularProgress({ progress }: CircularProgressProps) {
  const size = 20;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size}>
      {/* Background circle */}
      <circle
        className="stroke-base-300"
        fill="none"
        strokeWidth={strokeWidth}
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      {/* Progress circle */}
      <circle
        className={`transition-all duration-300 ${
          progress === 100
            ? 'stroke-success/40'
            : progress > 0
            ? 'stroke-primary/40'
            : 'stroke-base-300'
        }`}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        r={radius}
        cx={size / 2}
        cy={size / 2}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

function ProgressBar({ packingListItems, packingProgress }: ProgressBarProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 flex-1">
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
  );
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
  index,
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
  const dispatch = useAppDispatch();
  const prevProgress = useRef(packingProgress);
  const rowRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (
      !prefersReduced &&
      packingProgress === 100 &&
      prevProgress.current < 100
    ) {
      const rect = rowRef.current?.getBoundingClientRect();
      const payload = rect
        ? {
            x: rect.left + rect.width / 2,
            y: rect.top + window.scrollY,
            w: rect.width,
            h: rect.height,
          }
        : undefined;
      dispatch(actions.triggerConfettiBurst(payload));
    }
    prevProgress.current = packingProgress;
  }, [packingProgress, dispatch]);

  return (
    <li
      ref={rowRef}
      className={`flex flex-col ${isTravel ? 'bg-base-200/50' : ''}`}
    >
      <div
        className="flex items-start sm:items-center gap-2 sm:gap-4 p-2 sm:p-4 cursor-pointer hover:bg-base-200/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        data-testid={`day-row-${index}`}
      >
        <div className="text-2xl sm:text-4xl font-thin opacity-30 tabular-nums font-mono pt-1 sm:pt-0">
          {paddedIndex}
        </div>
        <div className="flex items-start sm:items-center justify-center w-4 sm:w-6 pt-2 sm:pt-0">
          {/* Stack both items in a centered column on small screens */}
          <div className="sm:hidden flex flex-col items-center gap-1">
            {packingListItems && packingListItems.length > 0 && (
              <CircularProgress progress={packingProgress} />
            )}
            {isTravel && <Plane className="w-4 h-4 text-primary/60" />}
          </div>
          {/* Show only plane icon on larger screens */}
          {isTravel && (
            <Plane
              className={`hidden sm:block w-4 h-4 ${
                packingListItems && packingListItems.length > 0
                  ? 'text-primary'
                  : 'text-primary/60'
              }`}
            />
          )}
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
                  data-testid={`event-button-${event.type}-${index}`}
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
              <div
                className="font-medium"
                data-testid={`day-location-${index}`}
              >
                {location}
              </div>
              <div className="text-xs uppercase font-semibold opacity-60">
                {expectedClimate}
              </div>
            </>
          )}
        </div>
        {/* Progress bar - shown on larger screens */}
        {packingListItems && packingListItems.length > 0 && (
          <div className="hidden sm:block min-w-[200px]">
            <ProgressBar
              packingListItems={packingListItems}
              packingProgress={packingProgress}
            />
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

      {/* Expanded section */}
      {isExpanded && packingListItems && packingListItems.length > 0 && (
        <div className="px-8 pb-4">
          {/* Progress bar - shown on small screens */}
          <div className="sm:hidden mb-4">
            <ProgressBar
              packingListItems={packingListItems}
              packingProgress={packingProgress}
            />
          </div>
          <div className="divider my-2 hidden sm:flex"></div>
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

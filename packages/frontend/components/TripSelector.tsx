import React from 'react';
import {
  useAppSelector,
  selectAccurateTripSummaries,
} from '@packing-list/state';
import { MapPin, Plus } from 'lucide-react';
import { Link } from './Link';

export const TripSelector: React.FC = () => {
  const tripSummaries = useAppSelector(selectAccurateTripSummaries);
  const selectedTripId = useAppSelector((state) => state.trips.selectedTripId);

  const selectedTrip = tripSummaries.find(
    (trip) => trip.tripId === selectedTripId
  );

  // If no trips exist, show create trip button
  if (tripSummaries.length === 0) {
    return (
      <Link
        href="/trips/new"
        className="btn btn-ghost gap-2"
        data-testid="trip-selector-empty"
      >
        <Plus className="w-4 h-4" />
        <span>Create Your First Trip</span>
      </Link>
    );
  }

  // If trips exist but none selected, go to trip management
  if (!selectedTrip) {
    return (
      <Link
        href="/trips"
        className="btn btn-ghost gap-2"
        data-testid="trip-selector-no-selection"
      >
        <MapPin className="w-4 h-4" />
        <span>Select a Trip</span>
      </Link>
    );
  }

  // Show current trip, click goes to trip management
  return (
    <Link
      href="/trips"
      className="btn btn-ghost gap-2 max-w-64 justify-start"
      data-testid="trip-selector"
    >
      <MapPin className="w-4 h-4 flex-shrink-0" />
      <div className="flex flex-col items-start min-w-0 flex-1">
        <span className="font-medium truncate w-full text-left">
          {selectedTrip.title}
        </span>
        {selectedTrip.description && (
          <span className="text-xs text-base-content/70 truncate w-full text-left">
            {selectedTrip.description}
          </span>
        )}
      </div>
    </Link>
  );
};

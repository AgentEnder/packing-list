import React from 'react';
import {
  useAppSelector,
  useAppDispatch,
  selectAccurateTripSummaries,
} from '@packing-list/state';
import { ChevronDown, Plus, MapPin } from 'lucide-react';
import { Link } from './Link';

export const TripSelector: React.FC = () => {
  const dispatch = useAppDispatch();
  const tripSummaries = useAppSelector(selectAccurateTripSummaries);
  const selectedTripId = useAppSelector((state) => state.trips.selectedTripId);
  const isOpen = useAppSelector((state) => state.ui.tripSelector.isOpen);

  const selectedTrip = tripSummaries.find(
    (trip) => trip.tripId === selectedTripId
  );

  const handleToggleSelector = () => {
    dispatch({
      type: 'TOGGLE_TRIP_SELECTOR',
    });
  };

  const handleSelectTrip = (tripId: string) => {
    dispatch({
      type: 'SELECT_TRIP',
      payload: { tripId },
    });
  };

  // If no trips exist, show a simple create button
  if (tripSummaries.length === 0) {
    return (
      <div className="dropdown dropdown-start">
        <div
          tabIndex={0}
          role="button"
          className="btn btn-ghost gap-2"
          data-testid="trip-selector-empty"
        >
          <MapPin className="w-4 h-4" />
          <span>Create Your First Trip</span>
          <Plus className="w-4 h-4" />
        </div>
        <ul
          tabIndex={0}
          className="dropdown-content menu bg-base-100 rounded-box z-[1] w-64 p-2 shadow-lg border"
        >
          <li>
            <Link
              href="/trips/new"
              className="flex items-center gap-2 p-3"
              data-testid="create-first-trip-link"
            >
              <Plus className="w-4 h-4" />
              Create Your First Trip
            </Link>
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div className={`dropdown dropdown-start ${isOpen ? 'dropdown-open' : ''}`}>
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost gap-2 max-w-64 justify-start"
        onClick={handleToggleSelector}
        data-testid="trip-selector"
      >
        <MapPin className="w-4 h-4 flex-shrink-0" />
        <div className="flex flex-col items-start min-w-0 flex-1">
          <span className="font-medium truncate w-full text-left">
            {selectedTrip?.title || 'Select Trip'}
          </span>
          {selectedTrip?.description && (
            <span className="text-xs text-base-content/70 truncate w-full text-left">
              {selectedTrip.description}
            </span>
          )}
        </div>
        <ChevronDown className="w-4 h-4 flex-shrink-0" />
      </div>

      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-100 rounded-box z-[1] w-80 p-2 shadow-lg border max-h-96 overflow-y-auto"
        data-testid="trip-selector-dropdown"
      >
        {/* Current trips */}
        {tripSummaries.map((trip) => (
          <li key={trip.tripId}>
            <button
              className={`flex flex-col items-start gap-1 p-3 ${
                trip.tripId === selectedTripId
                  ? 'bg-primary/10 border-l-4 border-primary'
                  : ''
              }`}
              onClick={() => handleSelectTrip(trip.tripId)}
              data-testid={`trip-option-${trip.tripId}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-medium truncate">{trip.title}</span>
                {trip.tripId === selectedTripId && (
                  <span className="badge badge-primary badge-xs">Current</span>
                )}
              </div>
              {trip.description && (
                <span className="text-sm text-base-content/70 truncate w-full text-left">
                  {trip.description}
                </span>
              )}
              <div className="flex gap-4 text-xs text-base-content/60 mt-1">
                <span>{trip.totalPeople} people</span>
                <span>
                  {trip.packedItems}/{trip.totalItems} packed
                </span>
              </div>
            </button>
          </li>
        ))}

        {/* Divider */}
        <div className="divider my-2"></div>

        {/* Actions */}
        <li>
          <Link
            href="/trips/new"
            className="flex items-center gap-2 p-3 font-medium"
            data-testid="create-trip-link"
          >
            <Plus className="w-4 h-4" />
            Create New Trip
          </Link>
        </li>
        <li>
          <Link
            href="/trips"
            className="flex items-center gap-2 p-3"
            data-testid="manage-trips-link"
          >
            <MapPin className="w-4 h-4" />
            Manage All Trips
          </Link>
        </li>
      </ul>
    </div>
  );
};

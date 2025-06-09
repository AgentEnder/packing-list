import { Link } from './Link';
import {
  MapPin,
  Plus,
  ArrowRight,
  AlertTriangle,
  PlayCircle,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@packing-list/state';

interface NoTripSelectedProps {
  title: string;
  message: string;
  showCreateAction?: boolean;
  actionText?: string;
  actionHref?: string;
}

export function NoTripSelected({
  title,
  message,
  showCreateAction = true,
  actionText = 'Go to Trips',
  actionHref = '/trips',
}: NoTripSelectedProps) {
  const dispatch = useAppDispatch();
  const tripSummaries = useAppSelector((state) => state.trips.summaries);

  // Show demo option only if there are no trips at all
  const hasNoTrips = tripSummaries.length === 0;

  const handleLoadDemo = () => {
    const SESSION_DEMO_CHOICE_KEY = 'session-demo-choice';
    sessionStorage.setItem(SESSION_DEMO_CHOICE_KEY, 'demo');
    dispatch({ type: 'LOAD_DEMO_DATA' });
  };

  return (
    <div className="text-center py-12" data-testid="no-trip-selected">
      <AlertTriangle className="w-16 h-16 mx-auto text-warning mb-4" />
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-base-content/70 mb-6 max-w-md mx-auto">{message}</p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {hasNoTrips && (
          <button
            onClick={handleLoadDemo}
            className="btn btn-secondary gap-2"
            data-testid="try-demo-button"
          >
            <PlayCircle className="w-4 h-4" />
            Try Demo Trip
          </button>
        )}

        <Link
          href={actionHref}
          className="btn btn-primary gap-2"
          data-testid="view-trips-button"
        >
          <MapPin className="w-4 h-4" />
          {actionText}
        </Link>

        {showCreateAction && (
          <Link
            href="/trips/new"
            className="btn btn-outline gap-2"
            data-testid="create-new-trip-button"
          >
            <Plus className="w-4 h-4" />
            Create New Trip
          </Link>
        )}
      </div>

      <div className="mt-8 p-4 bg-base-200 rounded-lg max-w-lg mx-auto">
        <h4 className="font-medium mb-2">What you can do:</h4>
        <ul className="text-sm text-left space-y-1">
          {hasNoTrips && (
            <li className="flex items-center gap-2">
              <ArrowRight className="w-3 h-3" />
              Try the demo trip to see how the app works
            </li>
          )}
          <li className="flex items-center gap-2">
            <ArrowRight className="w-3 h-3" />
            {hasNoTrips
              ? 'Create your first trip to start planning'
              : 'Select an existing trip from your trips list'}
          </li>
          {!hasNoTrips && (
            <li className="flex items-center gap-2">
              <ArrowRight className="w-3 h-3" />
              Create a new trip to start planning
            </li>
          )}
          <li className="flex items-center gap-2">
            <ArrowRight className="w-3 h-3" />
            Import trip data if you have an existing itinerary
          </li>
        </ul>
      </div>
    </div>
  );
}

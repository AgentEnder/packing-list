import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@packing-list/state';
import { usePageContext } from 'vike-react/usePageContext';
import { Link } from '../../../components/Link';
import { PageHeader } from '../../../components/PageHeader';
import { PageContainer } from '../../../components/PageContainer';
import { applyBaseUrl, formatDate } from '@packing-list/shared-utils';
import { navigate } from 'vike/client/router';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Package,
  Settings,
  Eye,
  Edit,
  CheckCircle,
  AlertTriangle,
  PlusCircle,
  List,
  BarChart3,
} from 'lucide-react';

export default function TripDetailsPage() {
  const pageContext = usePageContext();
  const tripId = pageContext.routeParams?.tripId as string;
  const dispatch = useAppDispatch();

  const tripSummaries = useAppSelector((state) => state.trips.summaries);
  const tripData = useAppSelector((state) => state.trips.byId[tripId]);
  const selectedTripId = useAppSelector((state) => state.trips.selectedTripId);

  const trip = tripSummaries.find((t) => t.tripId === tripId);

  // If trip doesn't exist, redirect to trips page
  useEffect(() => {
    if (!trip) {
      navigate(applyBaseUrl(import.meta.env.PUBLIC_ENV__BASE_URL, '/trips'));
    }
  }, [trip]);

  const handleSwitchToTrip = () => {
    if (tripId !== selectedTripId) {
      dispatch({
        type: 'SELECT_TRIP',
        payload: { tripId },
      });
    }
    navigate(applyBaseUrl(import.meta.env.PUBLIC_ENV__BASE_URL, '/'));
  };

  const getPackingProgress = () => {
    if (!trip || trip.totalItems === 0) {
      return { percentage: 0, status: 'Not started' };
    }
    const percentage = Math.round((trip.packedItems / trip.totalItems) * 100);
    if (percentage === 100) return { percentage, status: 'Complete' };
    if (percentage >= 75) return { percentage, status: 'Nearly done' };
    if (percentage >= 50) return { percentage, status: 'In progress' };
    if (percentage >= 25) return { percentage, status: 'Getting started' };
    return { percentage, status: 'Just started' };
  };

  if (!trip) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 mx-auto text-error mb-4" />
          <h3 className="text-xl font-semibold mb-2">Trip Not Found</h3>
          <p className="text-base-content/70 mb-6">
            The trip you&apos;re looking for doesn&apos;t exist or has been
            deleted.
          </p>
          <Link href="/trips" className="btn btn-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to Trips
          </Link>
        </div>
      </PageContainer>
    );
  }

  const progress = getPackingProgress();

  return (
    <PageContainer>
      <PageHeader
        title={trip.title}
        actions={
          <div className="flex gap-2">
            <Link href="/trips" className="btn btn-ghost">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <Link
              href={`/trips/${tripId}/settings`}
              className="btn btn-outline"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            {tripId !== selectedTripId && (
              <button
                onClick={handleSwitchToTrip}
                className="btn btn-primary"
                data-testid="switch-to-trip"
              >
                <MapPin className="w-4 h-4" />
                Switch to This Trip
              </button>
            )}
          </div>
        }
      />

      {/* Trip Status Banner */}
      {tripId === selectedTripId && (
        <div className="alert alert-info mb-6">
          <CheckCircle className="w-5 h-5" />
          <span>This is your currently active trip</span>
        </div>
      )}

      {/* Trip Description */}
      {trip.description && (
        <div className="card bg-base-100 shadow-lg mb-6">
          <div className="card-body">
            <p className="text-base-content/80">{trip.description}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trip Statistics */}
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5" />
                Trip Overview
              </h3>

              <div className="stats stats-vertical lg:stats-horizontal shadow-none">
                <div className="stat">
                  <div className="stat-figure text-primary">
                    <Users className="w-8 h-8" />
                  </div>
                  <div className="stat-title">Travelers</div>
                  <div className="stat-value text-primary">
                    {trip.totalPeople}
                  </div>
                  <div className="stat-desc">
                    {trip.totalPeople === 0 ? (
                      <Link href="/people" className="link link-primary">
                        Add travelers
                      </Link>
                    ) : (
                      <Link href="/people" className="link link-primary">
                        Manage people
                      </Link>
                    )}
                  </div>
                </div>

                <div className="stat">
                  <div className="stat-figure text-secondary">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <div className="stat-title">Trip Days</div>
                  <div className="stat-value text-secondary">
                    {tripData?.trip.days.length || 0}
                  </div>
                  <div className="stat-desc">
                    {!tripData?.trip.days.length ? (
                      <Link href="/days" className="link link-secondary">
                        Plan itinerary
                      </Link>
                    ) : (
                      <Link href="/days" className="link link-secondary">
                        View itinerary
                      </Link>
                    )}
                  </div>
                </div>

                <div className="stat">
                  <div className="stat-figure text-accent">
                    <Package className="w-8 h-8" />
                  </div>
                  <div className="stat-title">Packing Items</div>
                  <div className="stat-value text-accent">
                    {trip.totalItems}
                  </div>
                  <div className="stat-desc">
                    {trip.totalItems === 0 ? (
                      <Link href="/defaults" className="link link-accent">
                        Create packing rules
                      </Link>
                    ) : (
                      <Link href="/packing-list" className="link link-accent">
                        View packing list
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Packing Progress */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title flex items-center gap-2 mb-4">
                <Package className="w-5 h-5" />
                Packing Progress
              </h3>

              {trip.totalItems > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">
                      {trip.packedItems} of {trip.totalItems} items packed
                    </span>
                    <span className="text-sm font-medium">
                      {progress.percentage}%
                    </span>
                  </div>

                  <div className="w-full bg-base-300 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all duration-300 ${
                        progress.percentage === 100
                          ? 'bg-success'
                          : progress.percentage >= 75
                          ? 'bg-warning'
                          : 'bg-primary'
                      }`}
                      style={{ width: `${progress.percentage}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-base-content/70">
                      Status: {progress.status}
                    </span>
                    <Link
                      href="/packing-list"
                      className="btn btn-primary btn-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View Packing List
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto text-base-content/30 mb-3" />
                  <p className="text-base-content/70 mb-4">
                    No packing items yet. Create some packing rules to get
                    started.
                  </p>
                  <Link href="/defaults" className="btn btn-primary btn-sm">
                    <PlusCircle className="w-4 h-4" />
                    Create Packing Rules
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions & Trip Info */}
        <div className="space-y-6">
          {/* Trip Actions */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title flex items-center gap-2 mb-4">
                <List className="w-5 h-5" />
                Quick Actions
              </h3>

              <div className="space-y-3">
                <Link
                  href="/packing-list"
                  className="btn btn-primary w-full gap-2"
                >
                  <Package className="w-4 h-4" />
                  View Packing List
                </Link>

                <Link href="/people" className="btn btn-ghost w-full gap-2">
                  <Users className="w-4 h-4" />
                  Manage Travelers
                </Link>

                <Link href="/days" className="btn btn-ghost w-full gap-2">
                  <Calendar className="w-4 h-4" />
                  Plan Itinerary
                </Link>

                <Link href="/defaults" className="btn btn-ghost w-full gap-2">
                  <Settings className="w-4 h-4" />
                  Packing Rules
                </Link>

                <div className="divider"></div>

                <Link
                  href={`/trips/${tripId}/settings`}
                  className="btn btn-outline w-full gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Trip Settings
                </Link>
              </div>
            </div>
          </div>

          {/* Trip Info */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5" />
                Trip Details
              </h3>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-base-content/70">
                    Created:
                  </span>
                  <br />
                  <span>{formatDate(trip.createdAt)}</span>
                </div>

                {trip.updatedAt !== trip.createdAt && (
                  <div>
                    <span className="font-medium text-base-content/70">
                      Last Updated:
                    </span>
                    <br />
                    <span>{formatDate(trip.updatedAt)}</span>
                  </div>
                )}

                <div>
                  <span className="font-medium text-base-content/70">
                    Trip ID:
                  </span>
                  <br />
                  <span className="font-mono text-xs text-base-content/50">
                    {trip.tripId}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

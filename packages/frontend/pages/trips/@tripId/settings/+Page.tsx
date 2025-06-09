import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@packing-list/state';
import { usePageContext } from 'vike-react/usePageContext';
import { Link } from '../../../../components/Link';
import { PageHeader } from '../../../../components/PageHeader';
import { PageContainer } from '../../../../components/PageContainer';
import { ConfirmDialog } from '@packing-list/shared-components';
import { navigate } from 'vike/client/router';
import {
  ArrowLeft,
  Save,
  Trash2,
  Settings,
  Calendar,
  MapPin,
  Users,
  Eye,
  AlertTriangle,
} from 'lucide-react';

export default function TripSettingsPage() {
  const pageContext = usePageContext();
  const tripId = pageContext.routeParams?.tripId as string;
  const dispatch = useAppDispatch();

  const tripSummaries = useAppSelector((state) => state.trips.summaries);
  const tripData = useAppSelector((state) => state.trips.byId[tripId]);
  const selectedTripId = useAppSelector((state) => state.trips.selectedTripId);

  const trip = tripSummaries.find((t) => t.tripId === tripId);

  const [formData, setFormData] = useState({
    title: trip?.title || '',
    description: trip?.description || '',
  });

  const [tripSettings, setTripSettings] = useState({
    defaultViewMode: tripData?.packingListView.viewMode || 'by-day',
    showPackedItems: tripData?.packingListView.filters.packed || true,
    showUnpackedItems: tripData?.packingListView.filters.unpacked || true,
    showExcludedItems: tripData?.packingListView.filters.excluded || false,
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // If trip doesn't exist, redirect to trips page
  useEffect(() => {
    if (!trip) {
      navigate('/trips');
    }
  }, [trip]);

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSettingsChange = (field: string, value: boolean | string) => {
    setTripSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!trip) return;

    setIsSaving(true);

    try {
      // Update trip summary
      if (
        formData.title !== trip.title ||
        formData.description !== trip.description
      ) {
        dispatch({
          type: 'UPDATE_TRIP_SUMMARY',
          payload: {
            tripId,
            title: formData.title,
            description: formData.description,
          },
        });
      }

      // Update trip settings
      dispatch({
        type: 'UPDATE_PACKING_LIST_VIEW',
        payload: {
          viewMode: tripSettings.defaultViewMode as 'by-day' | 'by-person',
          filters: {
            packed: tripSettings.showPackedItems,
            unpacked: tripSettings.showUnpackedItems,
            excluded: tripSettings.showExcludedItems,
          },
        },
      });

      // Navigate back to trips page
      await navigate('/trips');
    } catch (error) {
      console.error('Failed to save trip settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTrip = () => {
    if (!trip) return;

    dispatch({
      type: 'DELETE_TRIP',
      payload: { tripId },
    });

    setDeleteModalOpen(false);
    navigate('/trips');
  };

  const handleSwitchToTrip = () => {
    if (tripId !== selectedTripId) {
      dispatch({
        type: 'SELECT_TRIP',
        payload: { tripId },
      });
    }
    navigate('/');
  };

  const canSave = formData.title.trim().length > 0;

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

  return (
    <PageContainer>
      <PageHeader
        title="Trip Settings"
        actions={
          <div className="flex gap-2">
            <Link href="/trips" className="btn btn-ghost">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <button
              onClick={handleSave}
              disabled={!canSave || isSaving}
              className="btn btn-primary gap-2"
              data-testid="save-trip-settings"
            >
              {isSaving ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        }
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Basic Information */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5" />
              Basic Information
            </h3>

            <div className="space-y-6 w-full">
              <div className="form-control">
                <fieldset className="fieldset w-full">
                  <legend className="fieldset-legend">Trip Title</legend>
                  <input
                    type="text"
                    placeholder="Enter trip title"
                    className="input input-bordered w-full"
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    data-testid="trip-title-input"
                  />
                </fieldset>
              </div>

              <div className="form-control">
                <fieldset className="fieldset w-full">
                  <legend className="fieldset-legend">Description</legend>
                  <textarea
                    placeholder="Add a description for your trip (optional)"
                    className="textarea textarea-bordered h-24 w-full"
                    value={formData.description}
                    onChange={(e) =>
                      handleFormChange('description', e.target.value)
                    }
                    data-testid="trip-description-input"
                  />
                </fieldset>
              </div>
            </div>
          </div>
        </div>

        {/* Packing List Preferences */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5" />
              Packing List Preferences
            </h3>

            <div className="space-y-6">
              <div className="form-control">
                <fieldset className="fieldset w-full">
                  <legend className="fieldset-legend">Default View Mode</legend>
                  <select
                    className="select select-bordered"
                    value={tripSettings.defaultViewMode}
                    onChange={(e) =>
                      handleSettingsChange('defaultViewMode', e.target.value)
                    }
                    data-testid="view-mode-select"
                  >
                    <option value="by-day">By Day</option>
                    <option value="by-person">By Person</option>
                  </select>
                </fieldset>
              </div>

              <div className="form-control">
                <fieldset className="fieldset w-full">
                  <legend className="fieldset-legend">Item Visibility</legend>
                  <div className="space-y-3 flex flex-col gap-2">
                    <label className="label cursor-pointer justify-start gap-3">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={tripSettings.showPackedItems}
                        onChange={(e) =>
                          handleSettingsChange(
                            'showPackedItems',
                            e.target.checked
                          )
                        }
                        data-testid="show-packed-checkbox"
                      />
                      <span className="label-text">Show packed items</span>
                    </label>

                    <label className="label cursor-pointer justify-start gap-3">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={tripSettings.showUnpackedItems}
                        onChange={(e) =>
                          handleSettingsChange(
                            'showUnpackedItems',
                            e.target.checked
                          )
                        }
                        data-testid="show-unpacked-checkbox"
                      />
                      <span className="label-text">Show unpacked items</span>
                    </label>

                    <label className="label cursor-pointer justify-start gap-3">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={tripSettings.showExcludedItems}
                        onChange={(e) =>
                          handleSettingsChange(
                            'showExcludedItems',
                            e.target.checked
                          )
                        }
                        data-testid="show-excluded-checkbox"
                      />
                      <span className="label-text">Show excluded items</span>
                    </label>
                  </div>
                </fieldset>
              </div>
            </div>
          </div>
        </div>

        {/* Trip Statistics */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5" />
              Trip Information
            </h3>

            <div className="stats stats-vertical shadow-none">
              <div className="stat px-0">
                <div className="stat-figure text-primary">
                  <Users className="w-6 h-6" />
                </div>
                <div className="stat-title">People</div>
                <div className="stat-value text-primary">
                  {tripData?.people.length || 0}
                </div>
                <div className="stat-desc">
                  <Link href="/people" className="link link-primary">
                    Manage people
                  </Link>
                </div>
              </div>

              <div className="stat px-0">
                <div className="stat-figure text-secondary">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="stat-title">Days</div>
                <div className="stat-value text-secondary">
                  {tripData?.trip.days.length || 0}
                </div>
                <div className="stat-desc">
                  <Link href="/days" className="link link-secondary">
                    Manage itinerary
                  </Link>
                </div>
              </div>
            </div>

            <div className="divider"></div>

            <div className="flex flex-col gap-2">
              <p className="text-sm text-base-content/70">
                Created: {new Date(trip.createdAt).toLocaleDateString()}
              </p>
              {trip.updatedAt !== trip.createdAt && (
                <p className="text-sm text-base-content/70">
                  Updated: {new Date(trip.updatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5" />
              Actions
            </h3>

            <div className="space-y-3">
              {tripId !== selectedTripId && (
                <button
                  onClick={handleSwitchToTrip}
                  className="btn btn-primary w-full gap-2"
                  data-testid="switch-to-trip"
                >
                  <MapPin className="w-4 h-4" />
                  Switch to This Trip
                </button>
              )}

              <Link
                href={`/trips/${tripId}`}
                className="btn btn-ghost w-full gap-2"
                data-testid="view-trip-details"
              >
                <Eye className="w-4 h-4" />
                View Trip Details
              </Link>

              <div className="divider"></div>

              <button
                onClick={() => setDeleteModalOpen(true)}
                className="btn btn-error btn-outline w-full gap-2"
                data-testid="delete-trip-button"
              >
                <Trash2 className="w-4 h-4" />
                Delete Trip
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Trip"
        message={`Are you sure you want to delete "${trip.title}"? This action cannot be undone.`}
        confirmText="Delete Trip"
        cancelText="Cancel"
        confirmVariant="error"
        onConfirm={handleDeleteTrip}
        data-testid="delete-trip-confirm-dialog"
      />
    </PageContainer>
  );
}

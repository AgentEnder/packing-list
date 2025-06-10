import { useState } from 'react';
import {
  useAppSelector,
  useAppDispatch,
  selectAccurateTripSummaries,
} from '@packing-list/state';
import { formatDate } from '@packing-list/shared-utils';
import { Link } from '../../components/Link';
import { PageHeader } from '../../components/PageHeader';
import { PageContainer } from '../../components/PageContainer';
import { Modal } from '@packing-list/shared-components';
import { uuid } from '@packing-list/shared-utils';
import {
  Plus,
  MapPin,
  Calendar,
  Users,
  Package,
  Settings,
  Trash2,
  Copy,
  MoreVertical,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';

export default function TripsPage() {
  const dispatch = useAppDispatch();
  const tripSummaries = useAppSelector(selectAccurateTripSummaries);
  const selectedTripId = useAppSelector((state) => state.trips.selectedTripId);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<string | null>(null);
  const tripDataById = useAppSelector((state) => state.trips.byId);

  const handleSelectTrip = (tripId: string) => {
    dispatch({
      type: 'SELECT_TRIP',
      payload: { tripId },
    });
  };

  const handleDeleteTrip = (tripId: string) => {
    setTripToDelete(tripId);
    setDeleteModalOpen(true);
  };

  const confirmDeleteTrip = () => {
    if (tripToDelete) {
      dispatch({
        type: 'DELETE_TRIP',
        payload: { tripId: tripToDelete },
      });
      setDeleteModalOpen(false);
      setTripToDelete(null);
    }
  };

  const handleDuplicateTrip = (tripId: string) => {
    const originalTrip = tripSummaries.find((t) => t.tripId === tripId);
    if (originalTrip) {
      const newTripId = uuid();
      dispatch({
        type: 'CREATE_TRIP',
        payload: {
          tripId: newTripId,
          title: `${originalTrip.title} (Copy)`,
          description: originalTrip.description,
        },
      });
    }
  };

  const tripToDeleteData = tripSummaries.find((t) => t.tripId === tripToDelete);

  return (
    <PageContainer>
      <PageHeader
        title="Trips"
        actions={
          <Link href="/trips/new" className="btn btn-primary gap-2">
            <Plus className="w-4 h-4" />
            New Trip
          </Link>
        }
      />

      <div className="mb-6">
        <p className="text-base-content/70">Manage all your packing trips</p>
      </div>

      {tripSummaries.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No trips yet</h3>
          <p className="text-base-content/70 mb-6">
            Create your first trip to start planning your packing list
          </p>
          <Link
            href="/trips/new"
            className="btn btn-primary gap-2"
            data-testid="create-first-trip-link"
          >
            <Plus className="w-4 h-4" />
            Create Your First Trip
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tripSummaries.map((trip) => (
            <div
              key={trip.tripId}
              className={`card bg-base-100 shadow-lg border-2 transition-all hover:shadow-xl ${
                trip.tripId === selectedTripId
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-transparent'
              }`}
            >
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="card-title text-lg truncate">
                      {trip.title}
                      {trip.tripId === selectedTripId && (
                        <span className="badge badge-primary badge-sm">
                          Current
                        </span>
                      )}
                    </h3>
                    {trip.description && (
                      <p className="text-sm text-base-content/70 line-clamp-2 mt-1">
                        {trip.description}
                      </p>
                    )}
                  </div>

                  <div className="dropdown dropdown-end">
                    <div
                      tabIndex={0}
                      role="button"
                      className="btn btn-ghost btn-sm btn-square"
                      data-testid={`trip-menu-${trip.tripId}`}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </div>
                    <ul
                      tabIndex={0}
                      className="dropdown-content menu bg-base-100 rounded-box z-[1] w-48 p-2 shadow-lg border"
                    >
                      <li>
                        <Link
                          href={`/trips/${trip.tripId}/edit`}
                          className="flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Link>
                      </li>
                      <li>
                        <button
                          onClick={() => handleDuplicateTrip(trip.tripId)}
                          className="flex items-center gap-2"
                          data-testid={`duplicate-trip-${trip.tripId}`}
                        >
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </button>
                      </li>
                      <div className="divider my-1"></div>
                      <li>
                        <button
                          onClick={() => handleDeleteTrip(trip.tripId)}
                          className="flex items-center gap-2 text-error"
                          data-testid={`delete-trip-${trip.tripId}`}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="stat p-0">
                    <div className="stat-figure text-primary">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="stat-title text-xs">People</div>
                    <div className="stat-value text-lg">{trip.totalPeople}</div>
                  </div>
                  <div className="stat p-0">
                    <div className="stat-figure text-secondary">
                      <Package className="w-5 h-5" />
                    </div>
                    <div className="stat-title text-xs">Packed</div>
                    <div className="stat-value text-lg">
                      {trip.packedItems}/{trip.totalItems}
                    </div>
                  </div>
                </div>

                {tripDataById[trip.tripId].trip.days?.length && (
                  <div className="flex gap-2 w-fit">
                    <div>
                      {format(
                        new Date(tripDataById[trip.tripId].trip.days[0].date),
                        'MMM d'
                      )}
                    </div>
                    <div>-</div>
                    <div>
                      {format(
                        new Date(
                          tripDataById[trip.tripId].trip.days[
                            tripDataById[trip.tripId].trip.days.length - 1
                          ].date
                        ),
                        'MMM d'
                      )}
                    </div>
                  </div>
                )}

                <div className="text-xs text-base-content/60 mt-2">
                  Created {formatDate(trip.createdAt)}
                  {trip.updatedAt !== trip.createdAt && (
                    <span> • Updated {formatDate(trip.updatedAt)}</span>
                  )}
                </div>

                <div className="card-actions justify-between mt-4">
                  {trip.tripId !== selectedTripId ? (
                    <button
                      onClick={() => handleSelectTrip(trip.tripId)}
                      className="btn btn-primary btn-sm flex-1"
                      data-testid={`select-trip-${trip.tripId}`}
                    >
                      <MapPin className="w-4 h-4" />
                      Switch to Trip
                    </button>
                  ) : (
                    <Link
                      href="/"
                      className="btn btn-primary btn-sm flex-1"
                      data-testid={`go-to-trip-${trip.tripId}`}
                    >
                      <Calendar className="w-4 h-4" />
                      Go to Trip
                    </Link>
                  )}
                  <Link
                    href={`/trips/${trip.tripId}/settings`}
                    className="btn btn-ghost btn-sm btn-square"
                    data-testid={`trip-settings-${trip.tripId}`}
                  >
                    <Settings className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Trip"
        size="sm"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to delete &ldquo;{tripToDeleteData?.title}
            &rdquo;? This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteTrip}
              className="btn btn-error"
              data-testid="confirm-delete-trip"
            >
              <Trash2 className="w-4 h-4" />
              Delete Trip
            </button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}

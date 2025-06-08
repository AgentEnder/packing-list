import { useState, ChangeEvent, FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '@packing-list/state';
import { uuid } from '../../utils/uuid';
import { createSelector } from '@reduxjs/toolkit';
import { TripEvent } from '@packing-list/model';
import { Modal } from '@packing-list/shared-components';
import { TripWizard } from './TripWizard';
import { TripDays } from './TripDays';
import { PageHeader } from '../../components/PageHeader';
import { PageContainer } from '../../components/PageContainer';
import { HelpBlurb } from '../../components/HelpBlurb';
import { selectCurrentTrip } from '@packing-list/state';

// Event types
const eventTypes = [
  { value: 'leave_home', label: 'Leave Home' },
  { value: 'arrive_destination', label: 'Arrive at Destination' },
  { value: 'leave_destination', label: 'Leave Destination' },
  { value: 'arrive_home', label: 'Arrive Home' },
];

// Modal component using shared Dialog

// Selector for tripEvents
const selectTripEvents = createSelector(
  selectCurrentTrip,
  (trip) => trip?.tripEvents || []
);

export default function DaysPage() {
  const tripEvents: TripEvent[] = useAppSelector(selectTripEvents);
  const dispatch = useAppDispatch();
  const [modalOpen, setModalOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<TripEvent>({
    id: '',
    type: 'leave_home',
    date: '',
    location: '',
    notes: '',
  });

  const openAddModal = () => {
    setForm({ id: '', type: 'leave_home', date: '', location: '', notes: '' });
    setEditId(null);
    setModalOpen(true);
  };

  const openEditModal = (event: TripEvent) => {
    setForm(event);
    setEditId(event.id);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (
      !form.type ||
      !form.date ||
      (form.type !== 'arrive_home' && !form.location)
    )
      return;
    let newEvents = [...tripEvents];
    if (editId) {
      newEvents = newEvents.map((ev) =>
        ev.id === editId ? { ...form, id: editId } : ev
      );
    } else {
      newEvents.push({ ...form, id: uuid() });
    }
    dispatch({ type: 'UPDATE_TRIP_EVENTS', payload: newEvents });
    setModalOpen(false);
  };

  const handleWizardSave = (events: TripEvent[]) => {
    dispatch({ type: 'UPDATE_TRIP_EVENTS', payload: events });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Trip Schedule"
        actions={
          <>
            <button
              className="btn btn-primary"
              onClick={() => setWizardOpen(true)}
            >
              Configure Trip
            </button>
            <button
              className="btn btn-outline btn-primary"
              onClick={openAddModal}
            >
              Add Event
            </button>
          </>
        }
      />

      <HelpBlurb storageKey="trip-timeline" title="Planning Your Trip">
        <p>
          Plan your trip schedule to help calculate the right amount of items to
          pack. Add key events to track your journey and automatically determine
          the trip duration.
        </p>

        <div className="bg-base-200 rounded-lg p-4 my-4">
          <h3 className="text-sm font-medium mb-2">How It Works</h3>
          <p className="text-sm text-base-content/70 m-0">
            Your trip schedule helps calculate packing needs:
            <br />
            • Total trip duration determines quantities for daily items
            <br />
            • Multiple destinations can affect what you need to pack
            <br />• Travel dates help plan for seasonal items
          </p>
        </div>
      </HelpBlurb>

      {/* Trip Wizard */}
      <TripWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSave={handleWizardSave}
        currentEvents={tripEvents}
      />

      {/* Manual Event Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title="Add Event">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <select
            className="select select-bordered"
            name="type"
            value={form.type}
            onChange={handleChange}
          >
            {eventTypes.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
          <input
            className="input input-bordered"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            required
          />
          {form.type !== 'arrive_home' && (
            <input
              className="input input-bordered"
              name="location"
              placeholder="Location"
              value={form.location}
              onChange={handleChange}
              required
            />
          )}
          <textarea
            className="textarea textarea-bordered"
            name="notes"
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={handleChange}
          />
          <button type="submit" className="btn btn-primary">
            {editId ? 'Update Event' : 'Add Event'}
          </button>
        </form>
      </Modal>

      {/* Trip Days Display */}
      {tripEvents.length > 0 ? (
        <div className="mb-6">
          <TripDays onEventClick={openEditModal} />
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">No trip configured yet</div>
          <button
            className="btn btn-primary"
            onClick={() => setWizardOpen(true)}
          >
            Configure Your Trip
          </button>
        </div>
      )}
    </PageContainer>
  );
}

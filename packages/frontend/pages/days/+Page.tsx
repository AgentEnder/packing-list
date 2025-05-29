import React, { useState, ChangeEvent, FormEvent, ReactNode } from 'react';
import { useAppDispatch, useAppSelector, StoreType } from '@packing-list/state';
import { uuid } from '../../utils/uuid';
import { createSelector } from '@reduxjs/toolkit';
import { TripEvent } from '@packing-list/model';
import { Timeline } from '@packing-list/shared-components';
import { TripWizard } from './TripWizard';
import { TripDays } from './TripDays';

// Event types
const eventTypes = [
  { value: 'leave_home', label: 'Leave Home' },
  { value: 'arrive_destination', label: 'Arrive at Destination' },
  { value: 'leave_destination', label: 'Leave Destination' },
  { value: 'arrive_home', label: 'Arrive Home' },
];

// Modal component
function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="modal modal-open">
        <div className="modal-box relative">
          <button
            className="btn btn-sm btn-circle absolute right-2 top-2"
            onClick={onClose}
          >
            ✕
          </button>
          {children}
        </div>
      </div>
    </div>
  );
}

// Selector for tripEvents
const selectTripEvents = createSelector(
  (state: StoreType) => state.trip,
  (trip) => trip.tripEvents ?? []
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

  const handleDelete = (id: string) => {
    const newEvents = tripEvents.filter((ev) => ev.id !== id);
    dispatch({ type: 'UPDATE_TRIP_EVENTS', payload: newEvents });
  };

  const handleWizardSave = (events: TripEvent[]) => {
    dispatch({ type: 'UPDATE_TRIP_EVENTS', payload: events });
  };

  const handleEventClick = (event: TripEvent) => {
    openEditModal(event);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Trip Timeline</h1>
        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Trip Wizard */}
      <TripWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSave={handleWizardSave}
        currentEvents={tripEvents}
      />

      {/* Manual Event Modal */}
      <Modal open={modalOpen} onClose={closeModal}>
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

      {/* Timeline Display */}
      {tripEvents.length > 0 ? (
        <div className="mb-6">
          <Timeline
            events={tripEvents}
            onEventClick={handleEventClick}
            className="max-w-xl mx-auto"
          />
          <TripDays />
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
    </div>
  );
}

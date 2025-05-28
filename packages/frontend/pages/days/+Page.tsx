import React, { useState, ChangeEvent, FormEvent, ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '@packing-list/state';
import { uuid } from '../../utils/uuid';
import { createSelector } from '@reduxjs/toolkit';

// Event types
const eventTypes = [
  { value: 'leave_home', label: 'Leave Home' },
  { value: 'arrive_destination', label: 'Arrive at Destination' },
  { value: 'leave_destination', label: 'Leave Destination' },
  { value: 'arrive_home', label: 'Arrive Home' },
];

type TripEvent = {
  id: string;
  type: string;
  date: string;
  location?: string;
  notes?: string;
};

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

// Helper for event label
function getEventLabel(type: string) {
  return eventTypes.find((e) => e.value === type)?.label || type;
}

// Selector for tripEvents
const selectTripEvents = createSelector(
  (state: any) => state.trip.tripEvents,
  (tripEvents) => tripEvents || []
);

export default function DaysPage() {
  const tripEvents: TripEvent[] = useAppSelector(selectTripEvents);
  // You will need to get dispatch from useDispatch (assuming Redux)
  const dispatch = useAppDispatch();
  const [modalOpen, setModalOpen] = useState(false);
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

  // Sort events by date
  const sortedEvents = [...tripEvents].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Trip Timeline</h1>
      </div>
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
      <ul className="timeline timeline-vertical timeline-snap-icon max-w-xl mx-auto">
        {sortedEvents.length === 0 && (
          <li className="text-gray-500">No events added yet.</li>
        )}
        {sortedEvents.map((event, idx) => (
          <li key={event.id} className="timeline-item">
            <div className="timeline-middle">
              <span className="badge badge-primary">{idx + 1}</span>
            </div>
            <div className="timeline-start md:text-end mb-10">
              <div className="font-semibold">{getEventLabel(event.type)}</div>
              <div className="text-gray-500 text-sm">{event.date}</div>
              {event.location && (
                <div className="text-gray-500">{event.location}</div>
              )}
              {event.notes && (
                <div className="text-xs text-gray-400 mt-1">{event.notes}</div>
              )}
              <div className="flex gap-2 mt-2 justify-end">
                <button
                  className="btn btn-outline btn-primary btn-xs"
                  onClick={() => openEditModal(event)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-outline btn-error btn-xs"
                  onClick={() => handleDelete(event.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
        {/* Skeleton Add Event */}
        <li className="timeline-item">
          <div className="timeline-middle">
            <button
              className="btn btn-circle btn-outline btn-primary text-3xl"
              onClick={openAddModal}
              type="button"
              aria-label="Add event"
            >
              +
            </button>
          </div>
          <div className="timeline-end mb-10">
            <span className="font-semibold">Add Event</span>
          </div>
        </li>
      </ul>
    </div>
  );
}

import React, { useState, ChangeEvent, useEffect } from 'react';
import { TripEvent } from '@packing-list/model';
import { Timeline } from '@packing-list/shared-components';
import { uuid } from '../../utils/uuid';

interface Destination {
  id: string;
  location: string;
  arriveDate: string;
  leaveDate: string;
  arriveNotes?: string;
  leaveNotes?: string;
}

interface TripWizardProps {
  open: boolean;
  onClose: () => void;
  onSave: (events: TripEvent[]) => void;
  currentEvents?: TripEvent[];
}

const steps = [
  { id: 1, title: 'Trip Duration' },
  { id: 2, title: 'Destinations' },
  { id: 3, title: 'Review' },
];

function parseExistingEvents(events: TripEvent[]) {
  const leaveHomeEvent = events.find((e) => e.type === 'leave_home');
  const arriveHomeEvent = events.find((e) => e.type === 'arrive_home');

  // Group destination events by location
  const arriveEvents = events.filter((e) => e.type === 'arrive_destination');
  const leaveEvents = events.filter((e) => e.type === 'leave_destination');

  const destinations: Destination[] = [];
  arriveEvents.forEach((arriveEvent) => {
    const leaveEvent = leaveEvents.find(
      (e) => e.location === arriveEvent.location
    );
    if (leaveEvent && arriveEvent.location) {
      destinations.push({
        id: uuid(),
        location: arriveEvent.location,
        arriveDate: arriveEvent.date,
        leaveDate: leaveEvent.date,
        arriveNotes: arriveEvent.notes,
        leaveNotes: leaveEvent.notes,
      });
    }
  });

  return {
    leaveHomeDate: leaveHomeEvent?.date || '',
    arriveHomeDate: arriveHomeEvent?.date || '',
    leaveHomeNotes: leaveHomeEvent?.notes || '',
    arriveHomeNotes: arriveHomeEvent?.notes || '',
    destinations: destinations.sort((a, b) =>
      a.arriveDate.localeCompare(b.arriveDate)
    ),
  };
}

export function TripWizard({
  open,
  onClose,
  onSave,
  currentEvents = [],
}: TripWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [tripData, setTripData] = useState({
    leaveHomeDate: '',
    arriveHomeDate: '',
    leaveHomeNotes: '',
    arriveHomeNotes: '',
  });
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [newDestination, setNewDestination] = useState<Destination>({
    id: '',
    location: '',
    arriveDate: '',
    leaveDate: '',
    arriveNotes: '',
    leaveNotes: '',
  });
  const [editingDestinationId, setEditingDestinationId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (currentEvents.length > 0) {
      const parsed = parseExistingEvents(currentEvents);
      setTripData({
        leaveHomeDate: parsed.leaveHomeDate,
        arriveHomeDate: parsed.arriveHomeDate,
        leaveHomeNotes: parsed.leaveHomeNotes,
        arriveHomeNotes: parsed.arriveHomeNotes,
      });
      setDestinations(parsed.destinations);
    }
  }, [currentEvents]);

  const handleTripDataChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setTripData({ ...tripData, [e.target.name]: e.target.value });
  };

  const handleNewDestinationChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setNewDestination({ ...newDestination, [e.target.name]: e.target.value });
  };

  const handleAddDestination = () => {
    if (
      !newDestination.location ||
      !newDestination.arriveDate ||
      !newDestination.leaveDate
    )
      return;

    setDestinations([...destinations, { ...newDestination, id: uuid() }]);
    setNewDestination({
      id: '',
      location: '',
      arriveDate: '',
      leaveDate: '',
      arriveNotes: '',
      leaveNotes: '',
    });
  };

  const handleRemoveDestination = (id: string) => {
    setDestinations(destinations.filter((d) => d.id !== id));
  };

  const handleEditDestination = (id: string) => {
    const destination = destinations.find((d) => d.id === id);
    if (destination) {
      setNewDestination(destination);
      setEditingDestinationId(id);
    }
  };

  const handleUpdateDestination = () => {
    if (!editingDestinationId) return;

    setDestinations(
      destinations.map((dest) =>
        dest.id === editingDestinationId
          ? { ...newDestination, id: dest.id }
          : dest
      )
    );

    setNewDestination({
      id: '',
      location: '',
      arriveDate: '',
      leaveDate: '',
      arriveNotes: '',
      leaveNotes: '',
    });
    setEditingDestinationId(null);
  };

  const handleCancelEdit = () => {
    setNewDestination({
      id: '',
      location: '',
      arriveDate: '',
      leaveDate: '',
      arriveNotes: '',
      leaveNotes: '',
    });
    setEditingDestinationId(null);
  };

  const generateTripEvents = (): TripEvent[] => {
    const events: TripEvent[] = [];

    // Leave home event
    if (tripData.leaveHomeDate) {
      events.push({
        id: uuid(),
        type: 'leave_home',
        date: tripData.leaveHomeDate,
        notes: tripData.leaveHomeNotes,
      });
    }

    // Sort destinations by arrival date
    const sortedDestinations = [...destinations].sort((a, b) =>
      a.arriveDate.localeCompare(b.arriveDate)
    );

    // Add destination events
    sortedDestinations.forEach((dest) => {
      events.push({
        id: uuid(),
        type: 'arrive_destination',
        date: dest.arriveDate,
        location: dest.location,
        notes: dest.arriveNotes,
      });
      events.push({
        id: uuid(),
        type: 'leave_destination',
        date: dest.leaveDate,
        location: dest.location,
        notes: dest.leaveNotes,
      });
    });

    // Arrive home event
    if (tripData.arriveHomeDate) {
      events.push({
        id: uuid(),
        type: 'arrive_home',
        date: tripData.arriveHomeDate,
        notes: tripData.arriveHomeNotes,
      });
    }

    return events;
  };

  const handleSave = () => {
    const events = generateTripEvents();
    onSave(events);
    onClose();
  };

  const handleClose = () => {
    onClose();
    // Reset form when closing
    setNewDestination({
      id: '',
      location: '',
      arriveDate: '',
      leaveDate: '',
      arriveNotes: '',
      leaveNotes: '',
    });
    setCurrentStep(1);
  };

  const canProceedToStep2 = tripData.leaveHomeDate && tripData.arriveHomeDate;
  const canProceedToStep3 = destinations.length > 0;

  if (!open) return null;

  return (
    <dialog className={`modal ${open ? 'modal-open' : ''}`}>
      <div className="modal-box w-11/12 max-w-2xl">
        <button
          className="btn btn-sm btn-circle absolute right-2 top-2"
          onClick={handleClose}
        >
          ✕
        </button>

        <h3 className="font-bold text-lg mb-4">
          {currentEvents.length > 0 ? 'Edit Trip' : 'Configure Trip'}
        </h3>

        {/* Steps indicator */}
        <ul className="steps steps-horizontal w-full mb-6">
          {steps.map((step) => (
            <li
              key={step.id}
              className={`step ${currentStep >= step.id ? 'step-primary' : ''}`}
            >
              {step.title}
            </li>
          ))}
        </ul>

        {/* Step 1: Trip Duration */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">When is your trip?</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label">
                  <span className="label-text">Leave Home Date</span>
                </label>
                <input
                  type="date"
                  name="leaveHomeDate"
                  className="input input-bordered w-full"
                  value={tripData.leaveHomeDate}
                  onChange={handleTripDataChange}
                  required
                />
                <textarea
                  name="leaveHomeNotes"
                  placeholder="Departure notes (optional)"
                  className="textarea textarea-bordered w-full"
                  value={tripData.leaveHomeNotes}
                  onChange={handleTripDataChange}
                />
              </div>
              <div className="space-y-2">
                <label className="label">
                  <span className="label-text">Arrive Home Date</span>
                </label>
                <input
                  type="date"
                  name="arriveHomeDate"
                  className="input input-bordered w-full"
                  value={tripData.arriveHomeDate}
                  onChange={handleTripDataChange}
                  min={tripData.leaveHomeDate}
                  required
                />
                <textarea
                  name="arriveHomeNotes"
                  placeholder="Return notes (optional)"
                  className="textarea textarea-bordered w-full"
                  value={tripData.arriveHomeNotes}
                  onChange={handleTripDataChange}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                className="btn btn-primary"
                disabled={!canProceedToStep2}
                onClick={() => setCurrentStep(2)}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Destinations */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Add Destinations</h4>

            {/* Existing destinations */}
            {destinations.length > 0 && (
              <div className="space-y-2">
                {destinations.map((dest) => (
                  <div
                    key={dest.id}
                    className="flex items-center justify-between bg-base-200 p-3 rounded"
                  >
                    <div>
                      <span className="font-medium">{dest.location}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {new Date(dest.arriveDate).toLocaleDateString()} -{' '}
                        {new Date(dest.leaveDate).toLocaleDateString()}
                      </span>
                      {(dest.arriveNotes || dest.leaveNotes) && (
                        <div className="mt-2 text-sm">
                          {dest.arriveNotes && (
                            <div>
                              <span className="font-medium">Arrival:</span>{' '}
                              {dest.arriveNotes}
                            </div>
                          )}
                          {dest.leaveNotes && (
                            <div>
                              <span className="font-medium">Departure:</span>{' '}
                              {dest.leaveNotes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleEditDestination(dest.id)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-error"
                        onClick={() => handleRemoveDestination(dest.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add/Edit destination form */}
            <div className="border-2 border-dashed border-gray-300 p-4 rounded">
              <h5 className="text-sm font-medium mb-3">
                {editingDestinationId
                  ? 'Edit Destination'
                  : 'Add New Destination'}
              </h5>
              <div className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  name="location"
                  placeholder="Destination"
                  className="input input-bordered w-full"
                  value={newDestination.location}
                  onChange={handleNewDestinationChange}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="label">
                      <span className="label-text">Arrival Date</span>
                    </label>
                    <input
                      type="date"
                      name="arriveDate"
                      className="input input-bordered w-full"
                      value={newDestination.arriveDate}
                      onChange={handleNewDestinationChange}
                      min={tripData.leaveHomeDate}
                      max={tripData.arriveHomeDate}
                    />
                    <textarea
                      name="arriveNotes"
                      placeholder="Arrival notes (optional)"
                      className="textarea textarea-bordered w-full"
                      value={newDestination.arriveNotes}
                      onChange={handleNewDestinationChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="label">
                      <span className="label-text">Departure Date</span>
                    </label>
                    <input
                      type="date"
                      name="leaveDate"
                      className="input input-bordered w-full"
                      value={newDestination.leaveDate}
                      onChange={handleNewDestinationChange}
                      min={newDestination.arriveDate || tripData.leaveHomeDate}
                      max={tripData.arriveHomeDate}
                    />
                    <textarea
                      name="leaveNotes"
                      placeholder="Departure notes (optional)"
                      className="textarea textarea-bordered w-full"
                      value={newDestination.leaveNotes}
                      onChange={handleNewDestinationChange}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                {editingDestinationId ? (
                  <>
                    <button
                      className="btn btn-ghost"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleUpdateDestination}
                      disabled={
                        !newDestination.location ||
                        !newDestination.arriveDate ||
                        !newDestination.leaveDate
                      }
                    >
                      Update Destination
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-outline btn-primary"
                    onClick={handleAddDestination}
                    disabled={
                      !newDestination.location ||
                      !newDestination.arriveDate ||
                      !newDestination.leaveDate
                    }
                  >
                    Add Destination
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <button className="btn" onClick={() => setCurrentStep(1)}>
                Back
              </button>
              <button
                className="btn btn-primary"
                disabled={!canProceedToStep3}
                onClick={() => setCurrentStep(3)}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Review Your Trip</h4>
            <div className="max-h-96 overflow-y-auto">
              <Timeline
                events={generateTripEvents()}
                className="max-w-xl mx-auto"
              />
            </div>
            <div className="flex justify-between">
              <button className="btn" onClick={() => setCurrentStep(2)}>
                Back
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                {currentEvents.length > 0 ? 'Update Trip' : 'Save Trip'}
              </button>
            </div>
          </div>
        )}
      </div>
      <form method="dialog" className="modal-backdrop" onClick={handleClose}>
        <button>close</button>
      </form>
    </dialog>
  );
}

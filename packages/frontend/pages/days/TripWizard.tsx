import React, { useState, ChangeEvent, useEffect } from 'react';
import { TripEvent } from '@packing-list/model';
import { Timeline } from '@packing-list/shared-components';
import { uuid } from '../../utils/uuid';

interface Destination {
  id: string;
  location: string;
  arriveDate: string;
  leaveDate: string;
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
      });
    }
  });

  return {
    leaveHomeDate: leaveHomeEvent?.date || '',
    arriveHomeDate: arriveHomeEvent?.date || '',
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
  });
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [newDestination, setNewDestination] = useState({
    location: '',
    arriveDate: '',
    leaveDate: '',
  });

  // Initialize wizard state from existing events when opened
  useEffect(() => {
    if (open && currentEvents.length > 0) {
      const parsed = parseExistingEvents(currentEvents);
      setTripData({
        leaveHomeDate: parsed.leaveHomeDate,
        arriveHomeDate: parsed.arriveHomeDate,
      });
      setDestinations(parsed.destinations);
    } else if (open) {
      // Reset to empty state if no current events
      setTripData({ leaveHomeDate: '', arriveHomeDate: '' });
      setDestinations([]);
      setCurrentStep(1);
    }
  }, [open, currentEvents]);

  if (!open) return null;

  const handleTripDataChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTripData({ ...tripData, [e.target.name]: e.target.value });
  };

  const handleDestinationChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewDestination({ ...newDestination, [e.target.name]: e.target.value });
  };

  const addDestination = () => {
    if (
      !newDestination.location ||
      !newDestination.arriveDate ||
      !newDestination.leaveDate
    )
      return;

    const destination: Destination = {
      id: uuid(),
      ...newDestination,
    };

    setDestinations([...destinations, destination]);
    setNewDestination({ location: '', arriveDate: '', leaveDate: '' });
  };

  const removeDestination = (id: string) => {
    setDestinations(destinations.filter((d) => d.id !== id));
  };

  const generateTripEvents = (): TripEvent[] => {
    const events: TripEvent[] = [];

    // Leave home event
    if (tripData.leaveHomeDate) {
      events.push({
        id: uuid(),
        type: 'leave_home',
        date: tripData.leaveHomeDate,
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
      });
      events.push({
        id: uuid(),
        type: 'leave_destination',
        date: dest.leaveDate,
        location: dest.location,
      });
    });

    // Arrive home event
    if (tripData.arriveHomeDate) {
      events.push({
        id: uuid(),
        type: 'arrive_home',
        date: tripData.arriveHomeDate,
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
    setNewDestination({ location: '', arriveDate: '', leaveDate: '' });
    setCurrentStep(1);
  };

  const canProceedToStep2 = tripData.leaveHomeDate && tripData.arriveHomeDate;
  const canProceedToStep3 = destinations.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="modal modal-open">
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
                className={`step ${
                  currentStep >= step.id ? 'step-primary' : ''
                }`}
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
                <div>
                  <label className="label">
                    <span className="label-text">Leave Home Date</span>
                  </label>
                  <input
                    type="date"
                    name="leaveHomeDate"
                    className="input input-bordered w-full"
                    value={tripData.leaveHomeDate}
                    onChange={handleTripDataChange}
                  />
                </div>
                <div>
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
                          {dest.arriveDate} - {dest.leaveDate}
                        </span>
                      </div>
                      <button
                        className="btn btn-sm btn-error"
                        onClick={() => removeDestination(dest.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new destination */}
              <div className="border-2 border-dashed border-gray-300 p-4 rounded">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    name="location"
                    placeholder="Destination"
                    className="input input-bordered"
                    value={newDestination.location}
                    onChange={handleDestinationChange}
                  />
                  <input
                    type="date"
                    name="arriveDate"
                    className="input input-bordered"
                    value={newDestination.arriveDate}
                    onChange={handleDestinationChange}
                    min={tripData.leaveHomeDate}
                    max={tripData.arriveHomeDate}
                  />
                  <input
                    type="date"
                    name="leaveDate"
                    className="input input-bordered"
                    value={newDestination.leaveDate}
                    onChange={handleDestinationChange}
                    min={newDestination.arriveDate}
                    max={tripData.arriveHomeDate}
                  />
                </div>
                <button
                  className="btn btn-outline btn-primary mt-3"
                  onClick={addDestination}
                >
                  Add Destination
                </button>
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
      </div>
    </div>
  );
}

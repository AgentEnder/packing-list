import { useState, ChangeEvent, useEffect } from 'react';
import { TripEvent } from '@packing-list/model';
import { Timeline, Modal } from '@packing-list/shared-components';
import { formatDate } from '@packing-list/shared-utils';
import { uuid } from '../../utils/uuid';
import { RulePackSelector } from '../../components/RulePackSelector';
import { useAppDispatch, useAppSelector } from '@packing-list/state';

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
  fullPage?: boolean;
}

const steps = [
  { id: 1, title: 'Trip Duration' },
  { id: 2, title: 'Destinations' },
  { id: 3, title: 'Review' },
  { id: 4, title: 'Packing Rules', optional: true },
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
  fullPage = false,
}: TripWizardProps) {
  const dispatch = useAppDispatch();
  const currentStep = useAppSelector((s) => s.ui.tripWizard.currentStep);
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
    if (!fullPage) onClose();
  };

  const handleRulesApplied = () => {
    const events = generateTripEvents();
    onSave(events);
    if (!fullPage) onClose();
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
    dispatch({ type: 'SET_WIZARD_STEP', payload: { step: 1 } });
  };

  const canAccessStep = (stepId: number): boolean => {
    switch (stepId) {
      case 1:
        return true;
      case 2:
        return Boolean(tripData.leaveHomeDate && tripData.arriveHomeDate);
      case 3:
        return (
          Boolean(tripData.leaveHomeDate && tripData.arriveHomeDate) &&
          destinations.length > 0
        );
      case 4:
        return (
          Boolean(tripData.leaveHomeDate && tripData.arriveHomeDate) &&
          destinations.length > 0
        );
      default:
        return false;
    }
  };

  const handleStepClick = (stepId: number) => {
    if (canAccessStep(stepId)) {
      dispatch({ type: 'SET_WIZARD_STEP', payload: { step: stepId } });
    }
  };

  const canProceedToStep2 = Boolean(
    tripData.leaveHomeDate && tripData.arriveHomeDate
  );
  const canProceedToStep3 = destinations.length > 0;

  const isDateRangeValid = () => {
    if (!tripData.leaveHomeDate || !tripData.arriveHomeDate) return false;
    return tripData.leaveHomeDate <= tripData.arriveHomeDate;
  };

  const renderStepNavigation = (
    backStep: number | null,
    nextStep: number | null,
    canProceed = true,
    showSave = false
  ) => (
    <div className="flex justify-between mt-6">
      {backStep ? (
        <button
          className="btn"
          onClick={() =>
            dispatch({ type: 'SET_WIZARD_STEP', payload: { step: backStep } })
          }
        >
          Back
        </button>
      ) : (
        <div /> // Empty div for spacing
      )}
      <div className="flex gap-2">
        {showSave && (
          <button className="btn btn-primary" onClick={handleSave}>
            {currentEvents.length > 0 ? 'Update Trip' : 'Save Trip'}
          </button>
        )}
        {nextStep && (
          <button
            className="btn btn-primary"
            onClick={() =>
              dispatch({ type: 'SET_WIZARD_STEP', payload: { step: nextStep } })
            }
            disabled={!canProceed || (currentStep === 1 && !isDateRangeValid())}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );

  const getStepClasses = (step: {
    id: number;
    title: string;
    optional?: boolean;
  }) => {
    const isAccessible = canAccessStep(step.id);
    return `step ${currentStep >= step.id ? 'step-primary' : ''} ${
      isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
    }`;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Trip Duration</h2>

            <div className="grid gap-4">
              <div>
                <label className="label">
                  <span className="label-text">When do you leave home?</span>
                </label>
                <input
                  type="date"
                  name="leaveHomeDate"
                  value={tripData.leaveHomeDate}
                  onChange={handleTripDataChange}
                  className="input input-bordered w-full"
                />
                <textarea
                  name="leaveHomeNotes"
                  value={tripData.leaveHomeNotes}
                  onChange={handleTripDataChange}
                  placeholder="Notes (e.g., flight details)"
                  className="textarea textarea-bordered w-full mt-2"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">When do you return home?</span>
                </label>
                <input
                  type="date"
                  name="arriveHomeDate"
                  value={tripData.arriveHomeDate}
                  onChange={handleTripDataChange}
                  className="input input-bordered w-full"
                />
                <textarea
                  name="arriveHomeNotes"
                  value={tripData.arriveHomeNotes}
                  onChange={handleTripDataChange}
                  placeholder="Notes (e.g., flight details)"
                  className="textarea textarea-bordered w-full mt-2"
                />
              </div>
            </div>
            {renderStepNavigation(null, 2, canProceedToStep2)}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Add Destinations</h4>

            {/* Existing destinations */}
            {destinations.length > 0 && (
              <div className="space-y-2" data-testid="destinations-list">
                {destinations.map((dest) => (
                  <div
                    key={dest.id}
                    className="flex items-center justify-between bg-base-200 p-3 rounded"
                  >
                    <div>
                      <span className="font-medium">{dest.location}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {formatDate(dest.arriveDate)} -{' '}
                        {formatDate(dest.leaveDate)}
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
                        data-testid={`edit-destination-${dest.location}`}
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
            {renderStepNavigation(1, 3, Boolean(canProceedToStep3))}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Review Your Trip</h4>
            <div className="max-h-96 overflow-y-auto">
              <Timeline
                events={generateTripEvents()}
                className="max-w-xl mx-auto"
              />
            </div>
            {renderStepNavigation(2, 4, true, true)}
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Suggested Packing Rules</h4>
            <p className="text-base-content/70">
              Based on your trip details, here are some suggested rule packs
              that might be helpful. You can always modify these later from the
              Defaults page.
            </p>
            <RulePackSelector onRulesApplied={handleRulesApplied} />
            {renderStepNavigation(3, null, true, true)}
          </div>
        );
      default:
        return null;
    }
  };

  // Effect: Whenever user reaches step 4, update trip events in store so rule packs apply immediately
  useEffect(() => {
    if (currentStep === 4) {
      const events = generateTripEvents();
      dispatch({ type: 'UPDATE_TRIP_EVENTS', payload: events });
    }
  }, [currentStep]);

  const inner = (
    <>
      {/* Steps indicator */}
      <ul className="steps steps-horizontal w-full mb-6">
        {steps.map((step) => (
          <li
            key={step.id}
            className={getStepClasses(step)}
            onClick={() => handleStepClick(step.id)}
          >
            {step.title}
            {step.optional && (
              <span className="text-xs text-base-content/60 ml-1">
                (Optional)
              </span>
            )}
          </li>
        ))}
      </ul>

      {renderStep()}
    </>
  );

  if (fullPage) {
    return <div className="px-4">{inner}</div>;
  }

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title={currentEvents.length > 0 ? 'Edit Trip' : 'Configure Trip'}
      size="2xl"
      modalBoxClassName="w-11/12 max-w-2xl"
    >
      {inner}
    </Modal>
  );
}

import React, { useState } from 'react';
import { actions, useAppDispatch } from '@packing-list/state';
import { Link } from '../../../components/Link';
import { PageHeader } from '../../../components/PageHeader';
import { PageContainer } from '../../../components/PageContainer';
import type { TripEvent } from '@packing-list/model';
import {
  MapPin,
  Calendar,
  Plane,
  Car,
  Backpack,
  Mountain,
  Building,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { navigate } from 'vike/client/router';
import { uuid } from '@packing-list/shared-utils';

// Trip templates
const TRIP_TEMPLATES = [
  {
    id: 'business',
    name: 'Business Trip',
    description: 'Professional travel for work',
    icon: Building,
    defaultDuration: 3,
    category: 'work',
  },
  {
    id: 'vacation',
    name: 'Vacation',
    description: 'Leisure travel and relaxation',
    icon: Plane,
    defaultDuration: 7,
    category: 'leisure',
  },
  {
    id: 'weekend',
    name: 'Weekend Getaway',
    description: 'Short recreational trip',
    icon: Car,
    defaultDuration: 2,
    category: 'leisure',
  },
  {
    id: 'backpacking',
    name: 'Backpacking',
    description: 'Adventure travel with minimal gear',
    icon: Backpack,
    defaultDuration: 5,
    category: 'adventure',
  },
  {
    id: 'hiking',
    name: 'Hiking Trip',
    description: 'Outdoor adventure in nature',
    icon: Mountain,
    defaultDuration: 3,
    category: 'adventure',
  },
  {
    id: 'custom',
    name: 'Custom Trip',
    description: 'Start from scratch',
    icon: MapPin,
    defaultDuration: 5,
    category: 'custom',
  },
];

export default function NewTripPage() {
  const dispatch = useAppDispatch();
  const [step, setStep] = useState<'template' | 'details'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const template = TRIP_TEMPLATES.find((t) => t.id === selectedTemplate);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = TRIP_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setFormData((prev) => ({
        ...prev,
        title: template.name,
        description: template.description,
      }));
    }
    setStep('details');
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Helper function to create initial trip events from form data
  const createInitialTripEvents = (): TripEvent[] => {
    const events: TripEvent[] = [];

    // Add leave home event if start date is provided
    if (formData.startDate) {
      events.push({
        id: uuid(),
        type: 'leave_home',
        date: formData.startDate,
        notes: '',
      });
    }

    // Add destination events if both location and dates are provided
    if (formData.location && formData.startDate && formData.endDate) {
      events.push({
        id: uuid(),
        type: 'arrive_destination',
        date: formData.startDate,
        location: formData.location,
        notes: '',
      });
      events.push({
        id: uuid(),
        type: 'leave_destination',
        date: formData.endDate,
        location: formData.location,
        notes: '',
      });
    }

    // Add arrive home event if end date is provided
    if (formData.endDate) {
      events.push({
        id: uuid(),
        type: 'arrive_home',
        date: formData.endDate,
        notes: '',
      });
    }

    return events;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (canSubmit) {
      const tripId = uuid();

      // 1. Create the trip immediately so it becomes selected
      dispatch({
        type: 'CREATE_TRIP',
        payload: {
          tripId,
          title: formData.title || 'New Trip',
          description: formData.description,
        },
      });

      // 2. Prepopulate with initial events (leave/arrive home etc.)
      const initialEvents = createInitialTripEvents();
      dispatch({
        type: 'UPDATE_TRIP_EVENTS',
        payload: initialEvents,
      });

      // 3. Initialize the flow
      dispatch(
        actions.initFlow({
          steps: [
            { path: `/trips/${tripId}`, label: 'Trip' },
            { path: `/trips/${tripId}/wizard`, label: 'Configure Trip' },
            { path: '/people', label: 'People' },
            { path: '/defaults', label: 'Rules' },
            { path: '/packing-list', label: 'Packing List' },
          ],
          current: 1,
        })
      );

      // 4. Reset wizard to first step for new trip
      dispatch({ type: 'RESET_WIZARD' });

      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReduced) {
        const source = {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          w: 0,
          h: 0,
        };
        dispatch(actions.triggerConfettiBurst(source));
      }

      // Navigate to full-page wizard
      await navigate(`/trips/${tripId}/wizard`);
    }
  };

  const handleSkipDates = async () => {
    setIsSubmitting(true);

    try {
      const tripId = uuid();

      dispatch({
        type: 'CREATE_TRIP',
        payload: {
          tripId,
          title: formData.title || 'New Trip',
          description: formData.description,
        },
      });

      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReduced) {
        const source = {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          w: 0,
          h: 0,
        };
        dispatch(actions.triggerConfettiBurst(source));
      }

      // Navigate to the new trip
      await navigate('/');
    } catch (error) {
      console.error('Failed to create trip:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = formData.title.trim().length > 0;

  if (step === 'template') {
    return (
      <PageContainer>
        <PageHeader
          title="Create New Trip"
          actions={
            <Link href="/trips" className="btn btn-ghost gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Trips
            </Link>
          }
        />

        <div className="mb-6">
          <p className="text-base-content/70">
            Choose a template to get started quickly. After basic details,
            you&apos;ll configure your trip dates and destinations.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TRIP_TEMPLATES.map((template) => {
            const IconComponent = template.icon;
            return (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template.id)}
                className="card bg-base-100 shadow-lg border-2 border-transparent hover:border-primary transition-all hover:shadow-xl text-left p-0"
                data-testid={`template-${template.id}`}
              >
                <div className="card-body">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="card-title text-lg">{template.name}</h3>
                      <p className="text-sm text-base-content/70 mt-1">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-base-content/60">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {template.defaultDuration} days
                        </span>
                        <span className="capitalize">{template.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Trip Details"
        actions={
          <button
            onClick={() => setStep('template')}
            className="btn btn-ghost gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Templates
          </button>
        }
      />

      <div className="mb-6">
        <p className="text-base-content/70">
          Provide basic information for your {template?.name.toLowerCase()}.
          Next, you&apos;ll be able to configure dates, destinations, and
          packing rules.
        </p>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trip Title */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Trip Title *</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="input input-bordered w-full"
              placeholder="Enter trip title"
              required
              data-testid="trip-title-input"
            />
          </div>

          {/* Trip Description */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Description</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="textarea textarea-bordered w-full h-24"
              placeholder="Describe your trip (optional)"
              data-testid="trip-description-input"
            />
          </div>

          {/* Location */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Destination</span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="input input-bordered w-full"
              placeholder="Where are you going?"
              data-testid="trip-location-input"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Start Date</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                data-testid="trip-start-date-input"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">End Date</span>
              </label>
              <input
                type="date"
                name="endDate"
                min={formData.startDate || undefined}
                value={formData.endDate}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                data-testid="trip-end-date-input"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col gap-3 pt-4">
            <div className="flex gap-3">
              <Link href="/trips" className="btn btn-ghost">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="btn btn-primary gap-2 flex-1"
                data-testid="create-trip-submit"
              >
                {isSubmitting ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
                {isSubmitting ? 'Creating...' : 'Configure Trip Dates'}
              </button>
            </div>

            <div className="divider">OR</div>

            <button
              type="button"
              onClick={handleSkipDates}
              disabled={!canSubmit || isSubmitting}
              className="btn btn-outline gap-2"
              data-testid="skip-dates-submit"
            >
              <Check className="w-4 h-4" />
              Create Trip Without Dates
            </button>

            <p className="text-sm text-base-content/60 text-center">
              You can always add trip dates later from the Days page
            </p>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}

import React, { useState } from 'react';
import { useAppDispatch } from '@packing-list/state';
import { Link } from '../../../components/Link';
import { PageHeader } from '../../../components/PageHeader';
import { PageContainer } from '../../../components/PageContainer';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const tripId = `trip-${Date.now()}`;

      dispatch({
        type: 'CREATE_TRIP',
        payload: {
          tripId,
          title: formData.title || 'New Trip',
          description: formData.description,
        },
      });

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
            Choose a template to get started quickly, or create a custom trip
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
          Configure your {template?.name.toLowerCase()} details
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
                value={formData.endDate}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                data-testid="trip-end-date-input"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Link href="/trips" className="btn btn-ghost">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="btn btn-primary gap-2"
              data-testid="create-trip-submit"
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <Check className="w-4 h-4" />
              )}
              {isSubmitting ? 'Creating...' : 'Create Trip'}
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}

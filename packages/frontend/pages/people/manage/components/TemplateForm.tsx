// TemplateForm Component - Sprint 3
// Form for creating and editing user people templates

import { useState, type ChangeEvent, type FormEvent } from 'react';
import type { UserPerson } from '@packing-list/model';
import { calculateCurrentAge } from '@packing-list/model';
import { useAppDispatch } from '@packing-list/state';
import { upsertUserPerson } from '@packing-list/state';
import { useAuth } from '@packing-list/auth-state';
import { uuid } from '@packing-list/shared-utils';
import { Save, X, Calendar } from 'lucide-react';

const genders = ['male', 'female', 'other', 'prefer-not-to-say'];

export type TemplateFormProps = {
  template?: UserPerson;
  onCancel: () => void;
  onSave?: () => void;
  prefillBirthDate?: string; // For when coming from person form with age guess
  prefillName?: string; // For when coming from person form
  prefillGender?: string; // For when coming from person form
};

export const TemplateForm = ({
  template,
  onCancel,
  onSave,
  prefillBirthDate,
  prefillName,
  prefillGender,
}: TemplateFormProps) => {
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  const [form, setForm] = useState(() => ({
    name: template?.name || prefillName || '',
    birthDate: template?.birthDate || prefillBirthDate || '',
    gender: template?.gender || prefillGender || 'male',
    autoAddToNewTrips: template?.autoAddToNewTrips || false,
  }));

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate current age for display
  const currentAge = form.birthDate
    ? calculateCurrentAge(form.birthDate)
    : undefined;

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setForm((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setIsSubmitting(true);

    try {
      const userId = user?.id || 'local-user';

      const personData: UserPerson = {
        id: template?.id || uuid(),
        userId,
        name: form.name.trim(),
        birthDate: form.birthDate || undefined,
        gender: form.gender as UserPerson['gender'],
        settings: template?.settings || {},
        isUserProfile: template?.isUserProfile || false,
        autoAddToNewTrips: template?.isUserProfile
          ? true
          : form.autoAddToNewTrips, // User profiles always auto-add
        createdAt: template?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: (template?.version || 0) + 1,
        isDeleted: false,
      };

      dispatch(upsertUserPerson(personData));

      onSave?.();
      onCancel();
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!template;
  const isProfile = template?.isUserProfile;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-control">
        <label className="label" htmlFor="template-name">
          <span className="label-text font-medium">Name</span>
        </label>
        <input
          id="template-name"
          className="input input-bordered w-full"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Enter name"
          required
          disabled={isSubmitting}
          data-testid="template-name-input"
        />
      </div>

      <div className="form-control">
        <label className="label" htmlFor="template-birthDate">
          <span className="label-text font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Birth Date (optional)
          </span>
        </label>
        <input
          id="template-birthDate"
          className="input input-bordered w-full"
          name="birthDate"
          type="date"
          value={form.birthDate}
          onChange={handleChange}
          disabled={isSubmitting}
          data-testid="template-birthdate-input"
        />
        {currentAge !== undefined && (
          <div className="label">
            <span className="label-text-alt text-base-content/70">
              Current age: {currentAge} years old
            </span>
          </div>
        )}
        {prefillBirthDate && (
          <div className="label">
            <span className="label-text-alt text-warning">
              💡 Birth date estimated from entered age. Please adjust if needed.
            </span>
          </div>
        )}
      </div>

      <div className="form-control">
        <label className="label" htmlFor="template-gender">
          <span className="label-text font-medium">Gender (optional)</span>
        </label>
        <select
          id="template-gender"
          className="select select-bordered w-full"
          name="gender"
          value={form.gender}
          onChange={handleChange}
          disabled={isSubmitting}
          data-testid="template-gender-select"
        >
          {genders.map((g) => (
            <option key={g} value={g}>
              {g.charAt(0).toUpperCase() + g.slice(1).replace('-', ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Auto-add checkbox - only show for templates, not user profiles */}
      {!isProfile && (
        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              name="autoAddToNewTrips"
              checked={form.autoAddToNewTrips}
              onChange={handleChange}
              disabled={isSubmitting}
              data-testid="template-auto-add-checkbox"
            />
            <span className="label-text">Auto-add to new trips</span>
          </label>
          <div className="text-xs text-base-content/70 ml-6">
            Automatically add this template to new trips
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="modal-action gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-ghost"
          disabled={isSubmitting}
          data-testid="template-cancel-button"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting || !form.name.trim()}
          data-testid="template-save-button"
        >
          {isSubmitting ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isEditing ? 'Update' : 'Save'} {isProfile ? 'Profile' : 'Template'}
        </button>
      </div>
    </form>
  );
};

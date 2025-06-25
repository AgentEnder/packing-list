// TemplateForm Component - Sprint 3
// Form for creating and editing user people templates

import { useState, type ChangeEvent, type FormEvent } from 'react';
import type { UserPerson } from '@packing-list/model';
import { useAppDispatch, useAppSelector } from '@packing-list/state';
import { selectUserProfile, upsertUserPerson } from '@packing-list/state';
import { uuid } from '@packing-list/shared-utils';
import { User, Save, X } from 'lucide-react';

const genders = ['male', 'female', 'other', 'prefer-not-to-say'];

export type TemplateFormProps = {
  template?: UserPerson;
  onCancel: () => void;
  onSave?: () => void;
};

export const TemplateForm = ({
  template,
  onCancel,
  onSave,
}: TemplateFormProps) => {
  const dispatch = useAppDispatch();
  const userProfile = useAppSelector(selectUserProfile);

  const [form, setForm] = useState(() => ({
    name: template?.name || '',
    age: String(template?.age || ''),
    gender: template?.gender || 'male',
  }));

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setIsSubmitting(true);

    try {
      const userId = userProfile?.userId || 'local-user';

      const personData: UserPerson = {
        id: template?.id || uuid(),
        userId,
        name: form.name.trim(),
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender as UserPerson['gender'],
        settings: template?.settings || {},
        isUserProfile: template?.isUserProfile || false,
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
        <label className="label" htmlFor="template-age">
          <span className="label-text font-medium">Age (optional)</span>
        </label>
        <input
          id="template-age"
          className="input input-bordered w-full"
          name="age"
          type="number"
          min="0"
          max="150"
          value={form.age}
          onChange={handleChange}
          placeholder="Enter age"
          disabled={isSubmitting}
          data-testid="template-age-input"
        />
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

      {/* Visual indicator for profile vs template */}
      <div className="flex items-center gap-2 p-3 bg-base-200 rounded-lg">
        <User className="w-4 h-4 text-base-content/60" />
        <span className="text-sm text-base-content/70">
          {isProfile ? (
            <>
              This is your <strong>profile</strong> - it represents you and is
              automatically added to new trips.
            </>
          ) : (
            <>
              This is a <strong>template</strong> - use it to quickly add this
              person to any trip.
            </>
          )}
        </span>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-ghost"
          disabled={isSubmitting}
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting || !form.name.trim()}
        >
          {isSubmitting ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isEditing ? 'Save Changes' : 'Create Template'}
        </button>
      </div>
    </form>
  );
};

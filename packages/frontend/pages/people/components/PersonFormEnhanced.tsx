// Enhanced PersonForm Component - Sprint 3
// Integrates template selection and "Save as template" functionality

import { useState, type ChangeEvent, type FormEvent } from 'react';
import type { Person, UserPerson } from '@packing-list/model';
import { useAppDispatch, useAppSelector } from '@packing-list/state';
import { actions, selectUserProfile } from '@packing-list/state';
import { PersonTemplateSelector } from '../../../components/PersonTemplateSelector';
import { Bookmark, User } from 'lucide-react';

const genders = ['male', 'female', 'other', 'prefer-not-to-say'];

const DEFAULT_FORM = {
  name: '',
  age: '',
  gender: 'male',
  saveAsTemplate: false,
};

export type PersonFormEnhancedProps = {
  person?: Person;
  onCancel: () => void;
  showTemplateFeatures?: boolean; // Toggle template functionality
};

export const PersonFormEnhanced = ({
  person,
  onCancel,
  showTemplateFeatures = true,
}: PersonFormEnhancedProps) => {
  const dispatch = useAppDispatch();
  const userProfile = useAppSelector(selectUserProfile);

  const [form, setForm] = useState(() =>
    person
      ? {
          name: person.name,
          age: String(person.age || ''),
          gender: person.gender || 'male',
          saveAsTemplate: false,
        }
      : DEFAULT_FORM
  );

  const [selectedTemplate, setSelectedTemplate] = useState<UserPerson | null>(
    null
  );
  const [useTemplateSelector, setUseTemplateSelector] = useState(!person); // Show selector for new people

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTemplateSelect = (template: UserPerson) => {
    setSelectedTemplate(template);
    setForm((prev) => ({
      ...prev,
      name: template.name,
      age: String(template.age || ''),
      gender: template.gender || 'male',
    }));
    setUseTemplateSelector(false);
  };

  const handleCreateNew = (name: string) => {
    setForm((prev) => ({ ...prev, name }));
    setSelectedTemplate(null);
    setUseTemplateSelector(false);
  };

  const handleStartOver = () => {
    setForm(DEFAULT_FORM);
    setSelectedTemplate(null);
    setUseTemplateSelector(true);
  };

  const handleSaveAsTemplateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, saveAsTemplate: e.target.checked }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name) return;

    const personData: {
      name: string;
      age?: number;
      gender: Person['gender'];
      userPersonId?: string;
    } = {
      name: form.name,
      gender: form.gender as Person['gender'],
      userPersonId: selectedTemplate?.id, // Link to template if selected
    };

    if (form.age) {
      personData.age = Number(form.age);
    }

    if (person) {
      // Update existing person
      dispatch({
        type: 'UPDATE_PERSON',
        payload: {
          id: person.id,
          ...personData,
        },
      });
    } else {
      // Add new person
      dispatch(actions.addPerson(personData));
    }

    // Save as template if requested (and not editing existing person)
    if (!person && form.saveAsTemplate && userProfile) {
      dispatch({
        type: 'CREATE_USER_PERSON_TEMPLATE',
        payload: {
          userId: userProfile.userId,
          name: form.name,
          age: form.age ? Number(form.age) : undefined,
          gender: form.gender as UserPerson['gender'],
          isUserProfile: false,
        },
      });
    }

    onCancel();
  };

  return (
    <div className="card bg-base-100 shadow-xl border-2 border-primary min-h-[400px] flex flex-col">
      <form
        onSubmit={handleSubmit}
        className="card-body gap-2 flex-1 flex flex-col"
      >
        <div className="flex-1">
          {/* Template Selection (for new people only) */}
          {!person && showTemplateFeatures && (
            <div className="mb-6">
              {useTemplateSelector ? (
                <div>
                  <label className="label">
                    <span className="label-text font-medium">Add Person</span>
                  </label>
                  <PersonTemplateSelector
                    onSelectTemplate={handleTemplateSelect}
                    onCreateNew={handleCreateNew}
                    placeholder="Type a name or select from your templates..."
                    className="mb-2"
                  />
                  <p className="text-sm text-gray-600">
                    Start typing to see saved templates, or create a new person
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    {selectedTemplate ? (
                      <>
                        <User className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">
                          Using template:{' '}
                          <strong>{selectedTemplate.name}</strong>
                        </span>
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Creating new person</span>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleStartOver}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Form Fields */}
          {(!useTemplateSelector || person) && (
            <>
              <div className="form-control">
                <label className="label" htmlFor="name">
                  <span className="label-text">Name</span>
                </label>
                <input
                  id="name"
                  className="input input-bordered w-full mb-2"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Name"
                  required
                  data-testid="person-name-input"
                />
              </div>

              <div className="form-control">
                <label className="label" htmlFor="age">
                  <span className="label-text">Age (optional)</span>
                </label>
                <input
                  id="age"
                  className="input input-bordered w-full mb-2"
                  name="age"
                  type="number"
                  min="0"
                  max="150"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="Age"
                  data-testid="person-age-input"
                />
              </div>

              <div className="form-control">
                <label className="label" htmlFor="gender">
                  <span className="label-text">Gender (optional)</span>
                </label>
                <select
                  id="gender"
                  className="select select-bordered w-full"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  data-testid="person-gender-select"
                >
                  {genders.map((g) => (
                    <option key={g} value={g}>
                      {g.charAt(0).toUpperCase() + g.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Save as Template Option */}
              {!person && showTemplateFeatures && !selectedTemplate && (
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={form.saveAsTemplate}
                      onChange={handleSaveAsTemplateChange}
                      data-testid="save-as-template-checkbox"
                    />
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-gray-500" />
                      <span className="label-text">
                        Save as template for future trips
                      </span>
                    </div>
                  </label>
                  <div className="text-xs text-gray-500 ml-6 mt-1">
                    Templates let you quickly add this person to other trips
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        {(!useTemplateSelector || person) && (
          <div className="card-actions justify-end">
            <button
              type="submit"
              className="btn btn-primary"
              data-testid="save-person-button"
            >
              {person ? 'Save Changes' : 'Add Person'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onCancel}
              data-testid="cancel-person-button"
            >
              Cancel
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

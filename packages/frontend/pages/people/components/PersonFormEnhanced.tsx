// Enhanced PersonForm Component - Sprint 3
// Integrates template selection and "Save as template" functionality

import {
  useState,
  useRef,
  useEffect,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import type { Person, UserPerson } from '@packing-list/model';
import { getTemplateSuggestions } from '@packing-list/model';
import {
  createUserPerson,
  useAppDispatch,
  useAppSelector,
} from '@packing-list/state';
import {
  actions,
  selectUserProfile,
  selectUserPeople,
} from '@packing-list/state';
import { Bookmark, User, Plus } from 'lucide-react';

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
  const userPeople = useAppSelector(selectUserPeople);

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

  // Autocomplete state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const suggestions = getTemplateSuggestions(userPeople, form.name, 5);
  const hasExactMatch = suggestions.some(
    (s) => s.name.toLowerCase() === form.name.toLowerCase()
  );

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'name') {
      // Handle name field with autocomplete
      setForm((prev) => ({ ...prev, name: value }));
      setSelectedTemplate(null); // Clear template when manually editing name
      setIsDropdownOpen(value.length > 0 && !person && showTemplateFeatures);
      setHighlightedIndex(-1);
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleTemplateSelect = (template: UserPerson) => {
    setSelectedTemplate(template);
    setForm((prev) => ({
      ...prev,
      name: template.name,
      age: String(template.age || ''),
      gender: template.gender || 'male',
    }));
    setIsDropdownOpen(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen || person || !showTemplateFeatures) {
      if (e.key === 'ArrowDown' && form.name.trim()) {
        e.preventDefault();
        setIsDropdownOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const maxIndex = suggestions.length + (hasExactMatch ? 0 : 1) - 1;
          return prev < maxIndex ? prev + 1 : 0;
        });
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const maxIndex = suggestions.length + (hasExactMatch ? 0 : 1) - 1;
          return prev > 0 ? prev - 1 : maxIndex;
        });
        break;

      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          if (highlightedIndex < suggestions.length) {
            handleTemplateSelect(suggestions[highlightedIndex]);
          } else {
            // Selected "Create new" option
            setIsDropdownOpen(false);
          }
        } else if (form.name.trim()) {
          setIsDropdownOpen(false);
        }
        break;

      case 'Escape':
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
        nameInputRef.current?.blur();
        break;
    }
  };

  const handleNameBlur = () => {
    // Delay closing to allow clicks on suggestions
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
      }
    }, 200);
  };

  const handleNameFocus = () => {
    if (form.name.length > 0 && !person && showTemplateFeatures) {
      setIsDropdownOpen(true);
    }
  };

  const handleSaveAsTemplateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, saveAsTemplate: e.target.checked }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name) return;

    const personData: {
      name: string;
      age: number;
      gender: Person['gender'];
      userPersonId?: string;
    } = {
      name: form.name,
      gender: form.gender as Person['gender'],
      userPersonId: selectedTemplate?.id, // Link to template if selected
      age: form.age ? Number(form.age) : 0,
    };

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
      dispatch(
        createUserPerson({
          userId: userProfile.userId,
          name: form.name,
          age: form.age ? Number(form.age) : undefined,
          gender: form.gender as UserPerson['gender'],
          isUserProfile: false,
        })
      );
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
          {/* Template Status Indicator */}
          {!person && showTemplateFeatures && selectedTemplate && (
            <div className="mb-4 flex items-center justify-between bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                <span className="text-sm">
                  Using template: <strong>{selectedTemplate.name}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedTemplate(null);
                  setForm((prev) => ({ ...prev, age: '', gender: 'male' }));
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear
              </button>
            </div>
          )}

          {/* Name Field with Autocomplete */}
          <div className="form-control relative">
            <label className="label" htmlFor="name">
              <span className="label-text">Name</span>
            </label>
            <input
              ref={nameInputRef}
              id="name"
              className="input input-bordered w-full mb-2"
              name="name"
              value={form.name}
              onChange={handleChange}
              onKeyDown={handleNameKeyDown}
              onBlur={handleNameBlur}
              onFocus={handleNameFocus}
              placeholder="Name"
              required
              data-testid="person-name-input"
              autoComplete="off"
            />

            {/* Autocomplete Dropdown */}
            {isDropdownOpen &&
              !person &&
              showTemplateFeatures &&
              (suggestions.length > 0 ||
                (!hasExactMatch && form.name.trim())) && (
                <ul
                  ref={dropdownRef}
                  className="absolute z-50 w-full top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
                >
                  {suggestions.map((template, index) => (
                    <li key={template.id}>
                      <button
                        type="button"
                        onClick={() => handleTemplateSelect(template)}
                        className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-100 ${
                          index === highlightedIndex
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700'
                        }`}
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        <div className="flex-1">
                          <div className="font-medium">{template.name}</div>
                          {(template.age || template.gender) && (
                            <div className="text-sm text-gray-500">
                              {[
                                template.age ? `Age ${template.age}` : null,
                                template.gender,
                              ]
                                .filter(Boolean)
                                .join(' • ')}
                            </div>
                          )}
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            template.isUserProfile
                              ? 'text-green-600 bg-green-100'
                              : 'text-blue-600 bg-blue-100'
                          }`}
                        >
                          {template.isUserProfile ? 'You' : 'Template'}
                        </span>
                      </button>
                    </li>
                  ))}

                  {!hasExactMatch && form.name.trim() && (
                    <li>
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(false)}
                        className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-100 border-t border-gray-200 ${
                          highlightedIndex === suggestions.length
                            ? 'bg-green-50 text-green-700'
                            : 'text-gray-700'
                        }`}
                      >
                        <Plus className="w-4 h-4 text-green-500" />
                        <div className="flex-1">
                          <div className="font-medium">
                            Create &ldquo;{form.name.trim()}&rdquo;
                          </div>
                          <div className="text-sm text-gray-500">
                            Add as new person
                          </div>
                        </div>
                      </button>
                    </li>
                  )}
                </ul>
              )}
          </div>

          {/* Age Field */}
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

          {/* Gender Field */}
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
        </div>

        {/* Action Buttons */}
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
      </form>
    </div>
  );
};

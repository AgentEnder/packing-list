import React, { ChangeEvent, FormEvent, useState } from 'react';
import type { LegacyPerson } from '@packing-list/model';
import { useAppDispatch } from '@packing-list/state';
import { uuid } from '@packing-list/shared-utils';

const genders = ['male', 'female', 'other'];

const DEFAULT_FORM = {
  name: '',
  age: '',
  gender: 'male',
};

export type PersonFormProps = {
  person?: LegacyPerson;
  onCancel: () => void;
};

export const PersonForm = ({ person, onCancel }: PersonFormProps) => {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState(() =>
    person
      ? {
          name: person.name,
          age: String(person.age),
          gender: person.gender,
        }
      : DEFAULT_FORM
  );

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.age) return;

    if (person) {
      dispatch({
        type: 'UPDATE_PERSON',
        payload: {
          id: person.id,
          name: form.name,
          age: Number(form.age),
          gender: form.gender,
        },
      });
    } else {
      dispatch({
        type: 'ADD_PERSON',
        payload: {
          id: uuid(),
          name: form.name,
          age: Number(form.age),
          gender: form.gender,
        },
      });
    }
    onCancel();
  };

  return (
    <div className="card bg-base-100 shadow-xl border-2 border-primary min-h-[280px] flex flex-col">
      <form
        onSubmit={handleSubmit}
        className="card-body gap-2 flex-1 flex flex-col"
      >
        <div className="flex-1">
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
              <span className="label-text">Age</span>
            </label>
            <input
              id="age"
              className="input input-bordered w-full mb-2"
              name="age"
              type="number"
              min="0"
              value={form.age}
              onChange={handleChange}
              placeholder="Age"
              required
              data-testid="person-age-input"
            />
          </div>
          <div className="form-control">
            <label className="label" htmlFor="gender">
              <span className="label-text">Gender</span>
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
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="card-actions justify-end">
          <button
            type="submit"
            className="btn btn-primary"
            data-testid="save-person-button"
          >
            {person ? 'Save' : 'Add Person'}
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

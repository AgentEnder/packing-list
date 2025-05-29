import React, { ChangeEvent, FormEvent, ReactNode, useState } from 'react';

import { Person } from '@packing-list/model';
import {
  selectPeople,
  useAppDispatch,
  useAppSelector,
} from '@packing-list/state';

import { uuid } from '../../utils/uuid';

const genders = ['male', 'female', 'other'];

type PersonCardProps = {
  person: Person;
  onEdit: () => void;
  onDelete: () => void;
  isEditing: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSave: () => void;
  onCancel: () => void;
};

function PersonCard({
  person,
  onEdit,
  onDelete,
  isEditing,
  onChange,
  onSave,
  onCancel,
}: PersonCardProps) {
  if (isEditing) {
    return (
      <div className="card bg-base-100 shadow-xl border-2 border-primary">
        <div className="card-body gap-2">
          <input
            className="input input-bordered"
            name="name"
            value={person.name}
            onChange={onChange}
            placeholder="Name"
          />
          <input
            className="input input-bordered"
            name="age"
            type="number"
            value={person.age}
            onChange={onChange}
            placeholder="Age"
          />
          <select
            className="select select-bordered"
            name="gender"
            value={person.gender}
            onChange={onChange}
          >
            {genders.map((g) => (
              <option key={g} value={g}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </option>
            ))}
          </select>
          <div className="card-actions justify-end mt-2">
            <button className="btn btn-primary" onClick={onSave}>
              Save
            </button>
            <button className="btn btn-ghost" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body gap-2">
        <div className="font-medium text-lg">{person.name}</div>
        <div className="text-gray-500">Age: {person.age}</div>
        <div className="text-gray-500">Gender: {person.gender}</div>
        <div className="card-actions justify-end mt-2">
          <button
            className="btn btn-outline btn-primary btn-sm"
            onClick={onEdit}
          >
            Edit
          </button>
          <button
            className="btn btn-outline btn-error btn-sm"
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

function Modal({ open, onClose, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="modal modal-open">
        <div className="modal-box relative">
          <button
            className="btn btn-sm btn-circle absolute right-2 top-2"
            onClick={onClose}
          >
            ✕
          </button>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function PeoplePage() {
  const dispatch = useAppDispatch();
  const people = useAppSelector(selectPeople);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    name: '',
    age: '',
    gender: 'male',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState({
    name: '',
    age: '',
    gender: 'male',
  });

  // Modal handlers
  const openModal = () => {
    setModalForm({ name: '', age: '', gender: 'male' });
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);
  const handleModalChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setModalForm({ ...modalForm, [e.target.name]: e.target.value });
  };
  const handleModalSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!modalForm.name || !modalForm.age || !dispatch) return;
    dispatch({
      type: 'ADD_PERSON',
      payload: {
        id: uuid(),
        name: modalForm.name,
        age: Number(modalForm.age),
        gender: modalForm.gender,
      },
    });
    setModalOpen(false);
  };

  // Inline edit handlers
  const startEdit = (person: Person) => {
    setEditingId(person.id);
    setEditingForm({
      name: person.name,
      age: String(person.age),
      gender: person.gender,
    });
  };
  const handleEditChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setEditingForm({ ...editingForm, [e.target.name]: e.target.value });
  };
  const saveEdit = (id: string) => {
    if (!editingForm.name || !editingForm.age || !dispatch) return;
    dispatch({
      type: 'UPDATE_PERSON',
      payload: {
        id,
        name: editingForm.name,
        age: Number(editingForm.age),
        gender: editingForm.gender,
      },
    });
    setEditingId(null);
  };
  const cancelEdit = () => setEditingId(null);

  const handleDelete = (id: string) => {
    if (!dispatch) return;
    dispatch({ type: 'REMOVE_PERSON', payload: id });
    if (editingId === id) {
      setEditingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">People on this Trip</h1>
      </div>
      <Modal open={modalOpen} onClose={closeModal}>
        <form onSubmit={handleModalSubmit} className="flex flex-col gap-3">
          <input
            className="input input-bordered"
            name="name"
            placeholder="Name"
            value={modalForm.name}
            onChange={handleModalChange}
          />
          <input
            className="input input-bordered"
            name="age"
            type="number"
            placeholder="Age"
            value={modalForm.age}
            onChange={handleModalChange}
          />
          <select
            className="select select-bordered"
            name="gender"
            value={modalForm.gender}
            onChange={handleModalChange}
          >
            {genders.map((g) => (
              <option key={g} value={g}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary">
            Add Person
          </button>
        </form>
      </Modal>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {people.length === 0 && (
          <div className="text-gray-500 col-span-full">
            No people added yet.
          </div>
        )}
        {people.map((person) => (
          <PersonCard
            key={person.id}
            person={
              editingId === person.id
                ? { ...person, ...editingForm, age: Number(editingForm.age) }
                : person
            }
            isEditing={editingId === person.id}
            onEdit={() => startEdit(person)}
            onDelete={() => handleDelete(person.id)}
            onChange={handleEditChange}
            onSave={() => saveEdit(person.id)}
            onCancel={cancelEdit}
          />
        ))}
        {/* Skeleton Add Card */}
        <button
          className="card bg-base-200 shadow-xl flex flex-col items-center justify-center border-2 border-dashed border-primary cursor-pointer min-h-[180px] hover:bg-primary hover:text-white transition col-span-1"
          onClick={openModal}
          type="button"
          aria-label="Add person"
        >
          <span className="text-5xl mb-2">+</span>
          <span className="font-semibold">Add Person</span>
        </button>
      </div>
    </div>
  );
}

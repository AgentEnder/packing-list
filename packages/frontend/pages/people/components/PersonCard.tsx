import { Person } from '@packing-list/model';
import { useState } from 'react';
import { PersonForm } from './PersonForm';

export type PersonCardProps = {
  person: Person;
  onDelete: () => void;
};

export const PersonCard = ({ person, onDelete }: PersonCardProps) => {
  const [isEditing, setIsEditing] = useState(false);

  return isEditing ? (
    <PersonForm person={person} onCancel={() => setIsEditing(false)} />
  ) : (
    <div
      className="card bg-base-100 shadow-xl min-h-[280px] flex flex-col"
      data-testid={`person-card-${person.id}`}
    >
      <div className="card-body gap-2 flex-1 flex flex-col">
        <div className="flex-1">
          <div className="font-medium text-lg">{person.name}</div>
          <div className="text-gray-500">Age: {person.age}</div>
          <div className="text-gray-500">Gender: {person.gender}</div>
        </div>
        <div className="card-actions justify-end">
          <button
            className="btn btn-outline btn-primary btn-sm"
            onClick={() => setIsEditing(true)}
            data-testid="edit-person-button"
          >
            Edit
          </button>
          <button
            className="btn btn-outline btn-error btn-sm"
            onClick={onDelete}
            data-testid="delete-person-button"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

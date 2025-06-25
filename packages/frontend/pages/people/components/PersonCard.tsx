import { Person, isPersonFromUserProfile } from '@packing-list/model';
import { useState } from 'react';
import { PersonForm } from './PersonForm';
import { UserCheck } from 'lucide-react';

export type PersonCardProps = {
  person: Person;
  onDelete: () => void;
};

export const PersonCard = ({ person, onDelete }: PersonCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const isFromProfile = isPersonFromUserProfile(person);

  return isEditing ? (
    <PersonForm person={person} onCancel={() => setIsEditing(false)} />
  ) : (
    <div
      className="card bg-base-100 shadow-xl min-h-[280px] flex flex-col"
      data-testid={`person-card-${person.id}`}
    >
      <div className="card-body gap-2 flex-1 flex flex-col">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="font-medium text-lg">{person.name}</div>
            {isFromProfile && (
              <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                <UserCheck className="h-3 w-3" />
                You
              </div>
            )}
          </div>
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
            disabled={isFromProfile}
            title={
              isFromProfile
                ? 'Profile-based people cannot be deleted'
                : 'Delete this person'
            }
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

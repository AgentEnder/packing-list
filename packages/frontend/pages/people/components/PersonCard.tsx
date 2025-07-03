import {
  Person,
  isPersonFromUserProfile,
  isPersonFromTemplate,
  estimateBirthDateFromAge,
} from '@packing-list/model';
import { useState } from 'react';
import { PersonForm } from './PersonForm';
import {
  UserCheck,
  User,
  MoreVertical,
  Bookmark,
  Pencil,
  Trash,
} from 'lucide-react';
import {
  useAppSelector,
  selectUserProfile,
  useAppDispatch,
  useAuth,
} from '@packing-list/state';
import { upsertUserPerson } from '@packing-list/state';
import { applyBaseUrl, uuid } from '@packing-list/shared-utils';
import { navigate } from 'vike/client/router';

export type PersonCardProps = {
  person: Person;
  onDelete: () => void;
};

export const PersonCard = ({ person, onDelete }: PersonCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const userProfile = useAppSelector(selectUserProfile);

  const isFromUserProfile = isPersonFromUserProfile(person, userProfile);
  const isFromOtherTemplate =
    isPersonFromTemplate(person) && !isFromUserProfile;

  const handleSaveAsTemplate = async () => {
    if (!user || isFromUserProfile) return;

    // Convert Person to UserPerson template
    const templateData = {
      id: uuid(),
      userId: user.id,
      name: person.name,
      birthDate: person.age ? estimateBirthDateFromAge(person.age) : undefined,
      gender: person.gender,
      settings: {},
      isUserProfile: false,
      autoAddToNewTrips: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      isDeleted: false,
    };

    dispatch(upsertUserPerson(templateData));
    setShowMenu(false);
  };

  return isEditing ? (
    <PersonForm person={person} onCancel={() => setIsEditing(false)} />
  ) : (
    <div
      className="card bg-base-100 shadow-xl min-h-[280px] flex flex-col"
      data-testid={`person-card-${person.name
        .toLowerCase()
        .replace(/\s+/g, '-')}`}
    >
      <div className="card-body gap-2 flex-1 flex flex-col">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="font-medium text-lg">{person.name}</div>
            {isFromUserProfile && (
              <div
                className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium"
                data-testid="profile-indicator"
              >
                <UserCheck className="h-3 w-3" />
                You
              </div>
            )}
            {isFromOtherTemplate && (
              <div
                className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
                data-testid="template-indicator"
              >
                <User className="h-3 w-3" />
                From Template
              </div>
            )}
          </div>
          <div className="text-gray-500">Age: {person.age}</div>
          <div className="text-gray-500">Gender: {person.gender}</div>
        </div>
        <div className="card-actions justify-end">
          <div className="relative">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowMenu(!showMenu)}
              data-testid="person-menu-button"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                {isFromUserProfile ? (
                  <button
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                    onClick={() => {
                      navigate(
                        applyBaseUrl(
                          import.meta.env.PUBLIC_ENV__BASE_URL,
                          '/profile'
                        )
                      );
                    }}
                    data-testid="view-profile-button"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <button
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    data-testid="edit-person-button"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                )}

                {!isFromUserProfile && !isFromOtherTemplate && (
                  <button
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm flex items-center gap-2"
                    onClick={handleSaveAsTemplate}
                    data-testid="save-as-template-button"
                  >
                    <Bookmark className="h-3 w-3" />
                    Save as Template
                  </button>
                )}

                {!isFromUserProfile && (
                  <button
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm text-red-600"
                    onClick={() => {
                      onDelete();
                      setShowMenu(false);
                    }}
                    data-testid="delete-person-button"
                  >
                    <Trash className="h-3 w-3" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

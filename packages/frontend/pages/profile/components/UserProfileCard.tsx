import {
  User,
  Calendar,
  UserCheck,
  Settings as SettingsIcon,
} from 'lucide-react';
import { UserPerson, calculateCurrentAge } from '@packing-list/model';

interface UserProfileCardProps {
  profile: UserPerson;
}

export function UserProfileCard({ profile }: UserProfileCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatBirthDate = (dateString: string) => {
    // Parse YYYY-MM-DD string directly without timezone conversion
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getGenderDisplay = (gender?: string) => {
    if (!gender) return 'Not specified';
    return gender.charAt(0).toUpperCase() + gender.slice(1).replace(/-/g, ' ');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-full">
          <User className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Your Profile</h2>
          <p className="text-sm text-gray-600">
            Personal information and preferences
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div className="flex items-center gap-3">
          <UserCheck className="h-4 w-4 text-gray-500" />
          <div>
            <p className="text-sm font-medium text-gray-700">Name</p>
            <p className="text-gray-900">{profile.name}</p>
          </div>
        </div>

        {/* Age from Birth Date */}
        {profile.birthDate && (
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Age</p>
              <p className="text-gray-900">
                {calculateCurrentAge(profile.birthDate)} years old
              </p>
              <p className="text-xs text-gray-500">
                Born: {formatBirthDate(profile.birthDate)}
              </p>
            </div>
          </div>
        )}

        {/* Gender */}
        {profile.gender && (
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Gender</p>
              <p className="text-gray-900">
                {getGenderDisplay(profile.gender)}
              </p>
            </div>
          </div>
        )}

        {/* Settings */}
        {profile.settings && Object.keys(profile.settings).length > 0 && (
          <div className="flex items-start gap-3">
            <SettingsIcon className="h-4 w-4 text-gray-500 mt-1" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Custom Settings
              </p>
              <div className="text-sm text-gray-600 mt-1">
                {Object.keys(profile.settings).length} preference(s) saved
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Metadata */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <p>Created: {formatDate(profile.createdAt)}</p>
          <p>Last updated: {formatDate(profile.updatedAt)}</p>
        </div>
      </div>

      {/* Profile Status */}
      <div className="mt-4">
        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></div>
          Active Profile
        </div>
      </div>
    </div>
  );
}

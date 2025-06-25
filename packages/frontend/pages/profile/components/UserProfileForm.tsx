import React, { useState, useEffect } from 'react';
import {
  useAppDispatch,
  createUserProfile,
  updateUserProfile,
} from '@packing-list/state';
import { Save, User, Calendar, Users } from 'lucide-react';
import { UserPerson, validateUserPerson } from '@packing-list/model';

interface UserProfileFormProps {
  profile: UserPerson | null;
  userId: string;
  isEditing: boolean;
}

export function UserProfileForm({
  profile,
  userId,
  isEditing,
}: UserProfileFormProps) {
  const dispatch = useAppDispatch();

  // Form state
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    age: profile?.age?.toString() || '',
    gender: profile?.gender || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Update form when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        age: profile.age?.toString() || '',
        gender: profile.gender || '',
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      // Prepare form data
      const profileData = {
        userId,
        name: formData.name.trim(),
        age: formData.age ? parseInt(formData.age, 10) : undefined,
        gender: formData.gender
          ? (formData.gender as UserPerson['gender'])
          : undefined,
        settings: profile?.settings || {},
        isUserProfile: true,
      };

      // Validate
      const errors = validateUserPerson(profileData);
      if (errors.length > 0) {
        setValidationErrors(errors);
        setIsSubmitting(false);
        return;
      }

      // Submit
      if (isEditing && profile) {
        await dispatch(
          updateUserProfile({
            id: profile.id,
            ...profileData,
          }) as any
        );
      } else {
        await dispatch(createUserProfile(profileData) as any);
      }
    } catch (error) {
      console.error('Profile submission error:', error);
      setValidationErrors(['An unexpected error occurred. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-sm font-medium text-red-800">
            Please fix the following errors:
          </h4>
          <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Name Field */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <User className="h-4 w-4" />
          Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your name"
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          This will be used for personalized packing suggestions
        </p>
      </div>

      {/* Age Field */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Calendar className="h-4 w-4" />
          Age (optional)
        </label>
        <input
          type="number"
          value={formData.age}
          onChange={(e) => handleInputChange('age', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your age"
          min="0"
          max="150"
        />
        <p className="mt-1 text-xs text-gray-500">
          Helps provide age-appropriate packing recommendations
        </p>
      </div>

      {/* Gender Field */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Users className="h-4 w-4" />
          Gender (optional)
        </label>
        <select
          value={formData.gender}
          onChange={(e) => handleInputChange('gender', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select gender (optional)</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer-not-to-say">Prefer not to say</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Helps provide gender-specific packing suggestions
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {isSubmitting
            ? 'Saving...'
            : isEditing
            ? 'Update Profile'
            : 'Create Profile'}
        </button>
      </div>

      {/* Info Message */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Privacy Note:</strong> Your profile information is stored
          securely and used only to provide personalized packing
          recommendations. You can update or delete your profile at any time.
        </p>
      </div>
    </form>
  );
}

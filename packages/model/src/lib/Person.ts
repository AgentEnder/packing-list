/**
 * Represents a person on a trip (family member, travel companion, etc.)
 * Gender is used for packing rule conditions (e.g., clothing requirements)
 */
export type Person = {
  id: string;
  tripId: string;
  name: string;
  age?: number; // 0-150, used for age-specific packing rules
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say'; // Used for clothing and gender-specific items
  settings?: Record<string, unknown>;

  // Sprint 2: Reference to user person template
  userPersonId?: string; // Reference to UserPerson for profile-based people

  // Audit tracking
  lastModifiedBy?: string;

  // Sync tracking
  createdAt: string;
  updatedAt: string;
  version: number;
  isDeleted: boolean;
};

// Sprint 2: Helper functions for template management
export const isPersonFromTemplate = (person: Person): boolean => {
  return !!person.userPersonId;
};

export const isPersonFromUserProfile = (
  person: Person,
  userProfile?: { id: string; isUserProfile: boolean } | null
): boolean => {
  // This indicates the person was created from the user's profile specifically
  return !!(
    person.userPersonId &&
    userProfile &&
    person.userPersonId === userProfile.id &&
    userProfile.isUserProfile
  );
};

// UserPerson model for reusable people functionality
// Sprint 3: Enhanced implementation with template support

import { differenceInYears, parseISO } from 'date-fns';

export type UserPerson = {
  id: string;
  userId: string;
  name: string;
  birthDate?: string; // ISO date string (YYYY-MM-DD)
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  settings?: Record<string, unknown>;
  isUserProfile: boolean; // Sprint 3: FALSE for templates, TRUE for user profile
  autoAddToNewTrips?: boolean; // Sprint 3: Auto-add template to new trips

  // Sync tracking
  createdAt: string;
  updatedAt: string;
  version: number;
  isDeleted: boolean;
};

export type CreateUserPersonInput = Omit<
  UserPerson,
  'id' | 'createdAt' | 'updatedAt' | 'version' | 'isDeleted'
>;

export type UpdateUserPersonInput = Partial<CreateUserPersonInput> & {
  id: string;
};

// Age calculation utilities
export const calculateAgeAtDate = (
  birthDate: string,
  atDate: string
): number => {
  try {
    const birth = parseISO(birthDate);
    const reference = parseISO(atDate);
    return differenceInYears(reference, birth);
  } catch (error) {
    console.warn('Error calculating age:', error);
    return 0;
  }
};

export const calculateCurrentAge = (birthDate: string): number => {
  return calculateAgeAtDate(birthDate, new Date().toISOString());
};

export const calculateAgeForTrip = (
  birthDate: string | undefined,
  tripStartDate?: string
): number | undefined => {
  if (!birthDate) return undefined;

  // Use trip start date if available, otherwise current date
  const referenceDate = tripStartDate || new Date().toISOString();
  return calculateAgeAtDate(birthDate, referenceDate);
};

// Utility to estimate birth date from age (for migration/guessing)
export const estimateBirthDateFromAge = (age: number): string => {
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - age;
  // Use January 1st as default birth date for estimation
  return `${birthYear}-01-01`;
};

// Helper functions for user profile management
export const createUserProfile = (
  userId: string,
  name: string,
  birthDate?: string,
  gender?: UserPerson['gender'],
  settings?: Record<string, unknown>
): CreateUserPersonInput => ({
  userId,
  name,
  birthDate,
  gender,
  settings: settings || {},
  isUserProfile: true,
  autoAddToNewTrips: true, // User profiles are always auto-added
});

// Sprint 3: Helper functions for template management
export const createUserTemplate = (
  userId: string,
  name: string,
  birthDate?: string,
  gender?: UserPerson['gender'],
  settings?: Record<string, unknown>,
  autoAddToNewTrips?: boolean
): CreateUserPersonInput => ({
  userId,
  name,
  birthDate,
  gender,
  settings: settings || {},
  isUserProfile: false, // Templates are not profiles
  autoAddToNewTrips: autoAddToNewTrips || false,
});

export const isUserProfile = (person: UserPerson): boolean => {
  return person.isUserProfile;
};

export const isUserTemplate = (person: UserPerson): boolean => {
  return !person.isUserProfile;
};

// Sprint 3: Template helper functions
export const cloneAsTemplate = (
  person: UserPerson | CreateUserPersonInput,
  userId: string
): CreateUserPersonInput => ({
  userId,
  name: person.name,
  birthDate: person.birthDate,
  gender: person.gender,
  settings: person.settings || {},
  isUserProfile: false, // Always create as template
  autoAddToNewTrips: false, // Default to false for cloned templates
});

export const cloneFromTemplate = (
  template: UserPerson,
  userId: string
): CreateUserPersonInput => ({
  userId,
  name: template.name,
  birthDate: template.birthDate,
  gender: template.gender,
  settings: template.settings || {},
  isUserProfile: false, // When cloning from template, create another template
  autoAddToNewTrips: template.autoAddToNewTrips || false,
});

// Validation helpers
export const validateUserPersonName = (name: string): boolean => {
  return name.trim().length > 0;
};

export const validateUserPersonBirthDate = (birthDate?: string): boolean => {
  if (birthDate === undefined) return true;

  try {
    const parsed = parseISO(birthDate);
    const now = new Date();
    const minDate = new Date(now.getFullYear() - 150, 0, 1); // 150 years ago

    // Birth date should be in the past and not more than 150 years ago
    return parsed <= now && parsed >= minDate;
  } catch {
    return false;
  }
};

export const validateUserPersonGender = (gender?: string): boolean => {
  const validGenders = ['male', 'female', 'other', 'prefer-not-to-say'];
  return gender === undefined || validGenders.includes(gender);
};

export const validateUserPerson = (person: CreateUserPersonInput): string[] => {
  const errors: string[] = [];

  if (!validateUserPersonName(person.name)) {
    errors.push('Name is required and cannot be empty');
  }

  if (!validateUserPersonBirthDate(person.birthDate)) {
    errors.push(
      'Birth date must be a valid date in the past and not more than 150 years ago'
    );
  }

  if (!validateUserPersonGender(person.gender)) {
    errors.push(
      'Gender must be one of: male, female, other, prefer-not-to-say'
    );
  }

  return errors;
};

// Migration helper for backwards compatibility
export const migrateUserPersonFromAge = (
  oldPerson: UserPerson & { age?: number }
): UserPerson => {
  const { age, ...personWithoutAge } = oldPerson;

  return {
    ...personWithoutAge,
    birthDate: age ? estimateBirthDateFromAge(age) : undefined,
  };
};

export type ClonePersonAsTemplateInput = {
  userId: string;
  personData: {
    name: string;
    birthDate?: string;
    gender?: string;
  };
};

// Sprint 3: Additional action payload types
export type DeleteUserPersonInput = {
  id: string;
};

export const getTemplateSuggestions = (
  userPeople: UserPerson[],
  searchTerm: string,
  limit = 5
): UserPerson[] => {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return [];

  // Include ALL user people (both profile and templates) in search
  return userPeople
    .filter((person) => person.name.toLowerCase().includes(term))
    .sort((a, b) => {
      // Sort user profile first, then by exact match, then by name
      if (a.isUserProfile && !b.isUserProfile) return -1;
      if (!a.isUserProfile && b.isUserProfile) return 1;

      const aExact = a.name.toLowerCase() === term;
      const bExact = b.name.toLowerCase() === term;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
};

// Helper function to get people that should be auto-added to new trips
export const getAutoAddPeople = (userPeople: UserPerson[]): UserPerson[] => {
  return userPeople.filter(
    (person) => person.autoAddToNewTrips && !person.isDeleted
  );
};

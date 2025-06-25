// UserPerson model for reusable people functionality
// Sprint 3: Enhanced implementation with template support

export type UserPerson = {
  id: string;
  userId: string;
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  settings?: Record<string, unknown>;
  isUserProfile: boolean; // Sprint 3: FALSE for templates, TRUE for user profile

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

// Sprint 3: Additional action payload types
export type DeleteUserPersonInput = {
  id: string;
};

export type ClonePersonAsTemplateInput = {
  userId: string;
  personData: {
    name: string;
    age?: number;
    gender?: string;
  };
};

// Helper functions for user profile management
export const createUserProfile = (
  userId: string,
  name: string,
  age?: number,
  gender?: UserPerson['gender'],
  settings?: Record<string, unknown>
): CreateUserPersonInput => ({
  userId,
  name,
  age,
  gender,
  settings: settings || {},
  isUserProfile: true,
});

// Sprint 3: Helper functions for template management
export const createUserTemplate = (
  userId: string,
  name: string,
  age?: number,
  gender?: UserPerson['gender'],
  settings?: Record<string, unknown>
): CreateUserPersonInput => ({
  userId,
  name,
  age,
  gender,
  settings: settings || {},
  isUserProfile: false, // Templates are not profiles
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
  age: person.age,
  gender: person.gender,
  settings: person.settings || {},
  isUserProfile: false, // Always create as template
});

export const cloneFromTemplate = (
  template: UserPerson,
  userId: string
): CreateUserPersonInput => ({
  userId,
  name: template.name,
  age: template.age,
  gender: template.gender,
  settings: template.settings || {},
  isUserProfile: false, // When cloning from template, create another template
});

// Validation helpers
export const validateUserPersonName = (name: string): boolean => {
  return name.trim().length > 0;
};

export const validateUserPersonAge = (age?: number): boolean => {
  return age === undefined || (age >= 0 && age <= 150);
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

  if (!validateUserPersonAge(person.age)) {
    errors.push('Age must be between 0 and 150');
  }

  if (!validateUserPersonGender(person.gender)) {
    errors.push(
      'Gender must be one of: male, female, other, prefer-not-to-say'
    );
  }

  return errors;
};

// Sprint 3: Template search and matching
export const findTemplatesByName = (
  templates: UserPerson[],
  searchTerm: string
): UserPerson[] => {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return [];

  return templates
    .filter((template) => !template.isUserProfile) // Only templates
    .filter((template) => template.name.toLowerCase().includes(term))
    .sort((a, b) => {
      // Sort by exact match first, then by name similarity
      const aExact = a.name.toLowerCase() === term;
      const bExact = b.name.toLowerCase() === term;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.name.localeCompare(b.name);
    });
};

export const getTemplateSuggestions = (
  userPeople: UserPerson[],
  searchTerm: string,
  limit = 5
): UserPerson[] => {
  return findTemplatesByName(userPeople, searchTerm).slice(0, limit);
};

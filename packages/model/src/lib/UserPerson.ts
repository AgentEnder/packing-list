// UserPerson model for reusable people functionality
// Sprint 1: Profile-focused implementation

export type UserPerson = {
  id: string;
  userId: string;
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  settings?: Record<string, unknown>;
  isUserProfile: boolean; // Sprint 1: Defaults to true for profile management

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
  isUserProfile: true, // Sprint 1: Always true for profiles
});

export const isUserProfile = (person: UserPerson): boolean => {
  return person.isUserProfile;
};

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

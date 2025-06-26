import { describe, it, expect } from 'vitest';
import {
  UserPerson,
  CreateUserPersonInput,
  createUserProfile,
  createUserTemplate,
  isUserProfile,
  getAutoAddPeople,
  validateUserPersonName,
  validateUserPersonBirthDate,
  validateUserPersonGender,
  validateUserPerson,
  calculateAgeAtDate,
  calculateAgeForTrip,
  estimateBirthDateFromAge,
  migrateUserPersonFromAge,
} from '../UserPerson.js';

describe('UserPerson', () => {
  const mockUserPerson: UserPerson = {
    id: '1',
    userId: 'user1',
    name: 'John Doe',
    birthDate: '1994-01-01',
    gender: 'male',
    settings: { preferences: { theme: 'dark' } },
    isUserProfile: true,
    autoAddToNewTrips: true,
    createdAt: '2025-01-25T00:00:00Z',
    updatedAt: '2025-01-25T00:00:00Z',
    version: 1,
    isDeleted: false,
  };

  describe('Age calculation utilities', () => {
    describe('calculateAgeAtDate', () => {
      it('should calculate age correctly', () => {
        const birthDate = '1990-06-15';
        const atDate = '2025-06-15';
        expect(calculateAgeAtDate(birthDate, atDate)).toBe(35);
      });

      it('should handle birth date after reference date', () => {
        const birthDate = '1990-06-15';
        const atDate = '1990-01-01';
        expect(calculateAgeAtDate(birthDate, atDate)).toBe(0);
      });

      it('should handle birthday not yet reached in the year', () => {
        const birthDate = '1990-12-25';
        const atDate = '2025-06-15';
        expect(calculateAgeAtDate(birthDate, atDate)).toBe(34);
      });

      it('should handle birthday already passed in the year', () => {
        const birthDate = '1990-01-15';
        const atDate = '2025-06-15';
        expect(calculateAgeAtDate(birthDate, atDate)).toBe(35);
      });

      it('should handle invalid dates gracefully', () => {
        expect(calculateAgeAtDate('invalid', '2025-01-01')).toBe(0);
        expect(calculateAgeAtDate('1990-01-01', 'invalid')).toBe(0);
      });
    });

    describe('calculateAgeForTrip', () => {
      it('should calculate age based on trip start date', () => {
        const birthDate = '1990-01-01';
        const tripStartDate = '2025-01-01';
        expect(calculateAgeForTrip(birthDate, tripStartDate)).toBe(35);
      });

      it('should return undefined for undefined birth date', () => {
        expect(calculateAgeForTrip(undefined, '2025-01-01')).toBeUndefined();
      });

      it('should use current date when no trip start date provided', () => {
        const birthDate = '1990-01-01';
        const result = calculateAgeForTrip(birthDate);
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThan(0);
      });
    });

    describe('estimateBirthDateFromAge', () => {
      it('should estimate birth date from age', () => {
        const currentYear = new Date().getFullYear();
        const age = 30;
        const expectedBirthYear = currentYear - age;
        expect(estimateBirthDateFromAge(age)).toBe(
          `${expectedBirthYear}-01-01`
        );
      });

      it('should handle zero age', () => {
        const currentYear = new Date().getFullYear();
        expect(estimateBirthDateFromAge(0)).toBe(`${currentYear}-01-01`);
      });
    });

    describe('migrateUserPersonFromAge', () => {
      it('should migrate age to birthDate', () => {
        const oldPerson = {
          ...mockUserPerson,
          age: 30,
          birthDate: undefined,
        } as UserPerson & { age?: number };

        const migrated = migrateUserPersonFromAge(oldPerson);
        const currentYear = new Date().getFullYear();
        const expectedBirthYear = currentYear - 30;

        expect(migrated.birthDate).toBe(`${expectedBirthYear}-01-01`);
        expect('age' in migrated).toBe(false);
      });

      it('should handle undefined age', () => {
        const oldPerson = {
          ...mockUserPerson,
          age: undefined,
          birthDate: undefined,
        } as UserPerson & { age?: number };

        const migrated = migrateUserPersonFromAge(oldPerson);
        expect(migrated.birthDate).toBeUndefined();
      });
    });
  });

  describe('createUserProfile', () => {
    it('should create a user profile with required fields', () => {
      const profile = createUserProfile('user1', 'John Doe');

      expect(profile).toEqual({
        userId: 'user1',
        name: 'John Doe',
        birthDate: undefined,
        gender: undefined,
        settings: {},
        isUserProfile: true,
        autoAddToNewTrips: true,
      });
    });

    it('should create a user profile with all optional fields', () => {
      const profile = createUserProfile(
        'user1',
        'John Doe',
        '1994-01-01',
        'male',
        {
          theme: 'dark',
        }
      );

      expect(profile).toEqual({
        userId: 'user1',
        name: 'John Doe',
        birthDate: '1994-01-01',
        gender: 'male',
        settings: { theme: 'dark' },
        isUserProfile: true,
        autoAddToNewTrips: true,
      });
    });

    it('should default settings to empty object when not provided', () => {
      const profile = createUserProfile(
        'user1',
        'John Doe',
        '1994-01-01',
        'male'
      );

      expect(profile.settings).toEqual({});
    });
  });

  describe('createUserTemplate', () => {
    it('should create a user template with required fields', () => {
      const template = createUserTemplate('user1', 'John Doe');

      expect(template).toEqual({
        userId: 'user1',
        name: 'John Doe',
        birthDate: undefined,
        gender: undefined,
        settings: {},
        isUserProfile: false,
        autoAddToNewTrips: false,
      });
    });

    it('should create a user template with autoAddToNewTrips enabled', () => {
      const template = createUserTemplate(
        'user1',
        'John Doe',
        '1994-01-01',
        'male',
        {},
        true
      );

      expect(template).toEqual({
        userId: 'user1',
        name: 'John Doe',
        birthDate: '1994-01-01',
        gender: 'male',
        settings: {},
        isUserProfile: false,
        autoAddToNewTrips: true,
      });
    });

    it('should default autoAddToNewTrips to false when not provided', () => {
      const template = createUserTemplate(
        'user1',
        'John Doe',
        '1994-01-01',
        'male',
        {}
      );

      expect(template.autoAddToNewTrips).toBe(false);
    });
  });

  describe('isUserProfile', () => {
    it('should return true for user profiles', () => {
      expect(isUserProfile(mockUserPerson)).toBe(true);
    });

    it('should return false for non-user profiles', () => {
      const nonProfile = { ...mockUserPerson, isUserProfile: false };
      expect(isUserProfile(nonProfile)).toBe(false);
    });
  });

  describe('validateUserPersonName', () => {
    it('should return true for valid names', () => {
      expect(validateUserPersonName('John Doe')).toBe(true);
      expect(validateUserPersonName('A')).toBe(true);
      expect(validateUserPersonName('   Valid Name   ')).toBe(true);
    });

    it('should return false for invalid names', () => {
      expect(validateUserPersonName('')).toBe(false);
      expect(validateUserPersonName('   ')).toBe(false);
      expect(validateUserPersonName('\t\n')).toBe(false);
    });
  });

  describe('validateUserPersonBirthDate', () => {
    it('should return true for valid birth dates', () => {
      expect(validateUserPersonBirthDate('1990-01-01')).toBe(true);
      expect(validateUserPersonBirthDate('2000-12-31')).toBe(true);
      expect(validateUserPersonBirthDate(undefined)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateString = futureDate.toISOString().split('T')[0];
      expect(validateUserPersonBirthDate(futureDateString)).toBe(false);
    });

    it('should return false for dates more than 150 years ago', () => {
      const tooOldDate = new Date();
      tooOldDate.setFullYear(tooOldDate.getFullYear() - 151);
      const tooOldDateString = tooOldDate.toISOString().split('T')[0];
      expect(validateUserPersonBirthDate(tooOldDateString)).toBe(false);
    });

    it('should return false for invalid date format', () => {
      expect(validateUserPersonBirthDate('invalid-date')).toBe(false);
      expect(validateUserPersonBirthDate('2025-13-01')).toBe(false);
      expect(validateUserPersonBirthDate('2025-01-32')).toBe(false);
    });
  });

  describe('validateUserPersonGender', () => {
    it('should return true for valid genders', () => {
      expect(validateUserPersonGender('male')).toBe(true);
      expect(validateUserPersonGender('female')).toBe(true);
      expect(validateUserPersonGender('other')).toBe(true);
      expect(validateUserPersonGender('prefer-not-to-say')).toBe(true);
      expect(validateUserPersonGender(undefined)).toBe(true);
    });

    it('should return false for invalid genders', () => {
      expect(validateUserPersonGender('invalid')).toBe(false);
      expect(validateUserPersonGender('Male')).toBe(false);
      expect(validateUserPersonGender('')).toBe(false);
    });
  });

  describe('validateUserPerson', () => {
    const validPerson: CreateUserPersonInput = {
      userId: 'user1',
      name: 'John Doe',
      birthDate: '1990-01-01',
      gender: 'male',
      settings: {},
      isUserProfile: true,
    };

    it('should return no errors for valid person', () => {
      const errors = validateUserPerson(validPerson);
      expect(errors).toEqual([]);
    });

    it('should return error for empty name', () => {
      const invalidPerson = { ...validPerson, name: '' };
      const errors = validateUserPerson(invalidPerson);
      expect(errors).toContain('Name is required and cannot be empty');
    });

    it('should return error for invalid birth date', () => {
      const invalidPerson = { ...validPerson, birthDate: 'invalid-date' };
      const errors = validateUserPerson(invalidPerson);
      expect(errors).toContain(
        'Birth date must be a valid date in the past and not more than 150 years ago'
      );
    });

    it('should return error for invalid gender', () => {
      const invalidPerson = {
        ...validPerson,
        gender: 'invalid' as UserPerson['gender'],
      };
      const errors = validateUserPerson(invalidPerson);
      expect(errors).toContain(
        'Gender must be one of: male, female, other, prefer-not-to-say'
      );
    });

    it('should return multiple errors for multiple validation failures', () => {
      const invalidPerson: CreateUserPersonInput = {
        userId: 'user1',
        name: '',
        birthDate: 'invalid-date',
        gender: 'invalid' as UserPerson['gender'],
        settings: {},
        isUserProfile: true,
      };
      const errors = validateUserPerson(invalidPerson);
      expect(errors).toHaveLength(3);
      expect(errors).toContain('Name is required and cannot be empty');
      expect(errors).toContain(
        'Birth date must be a valid date in the past and not more than 150 years ago'
      );
      expect(errors).toContain(
        'Gender must be one of: male, female, other, prefer-not-to-say'
      );
    });

    it('should allow undefined optional fields', () => {
      const minimalPerson: CreateUserPersonInput = {
        userId: 'user1',
        name: 'John Doe',
        isUserProfile: true,
      };
      const errors = validateUserPerson(minimalPerson);
      expect(errors).toEqual([]);
    });
  });

  describe('getAutoAddPeople', () => {
    const userProfile: UserPerson = {
      id: '1',
      userId: 'user1',
      name: 'John Doe',
      isUserProfile: true,
      autoAddToNewTrips: true,
      createdAt: '2025-01-25T00:00:00Z',
      updatedAt: '2025-01-25T00:00:00Z',
      version: 1,
      isDeleted: false,
    };

    const autoAddTemplate: UserPerson = {
      id: '2',
      userId: 'user1',
      name: 'Travel Template',
      isUserProfile: false,
      autoAddToNewTrips: true,
      createdAt: '2025-01-25T00:00:00Z',
      updatedAt: '2025-01-25T00:00:00Z',
      version: 1,
      isDeleted: false,
    };

    const nonAutoAddTemplate: UserPerson = {
      id: '3',
      userId: 'user1',
      name: 'Manual Template',
      isUserProfile: false,
      autoAddToNewTrips: false,
      createdAt: '2025-01-25T00:00:00Z',
      updatedAt: '2025-01-25T00:00:00Z',
      version: 1,
      isDeleted: false,
    };

    const deletedAutoAddTemplate: UserPerson = {
      id: '4',
      userId: 'user1',
      name: 'Deleted Template',
      isUserProfile: false,
      autoAddToNewTrips: true,
      createdAt: '2025-01-25T00:00:00Z',
      updatedAt: '2025-01-25T00:00:00Z',
      version: 1,
      isDeleted: true,
    };

    it('should return only people with autoAddToNewTrips enabled', () => {
      const people = [userProfile, autoAddTemplate, nonAutoAddTemplate];
      const result = getAutoAddPeople(people);

      expect(result).toHaveLength(2);
      expect(result).toContain(userProfile);
      expect(result).toContain(autoAddTemplate);
      expect(result).not.toContain(nonAutoAddTemplate);
    });

    it('should exclude deleted people', () => {
      const people = [userProfile, autoAddTemplate, deletedAutoAddTemplate];
      const result = getAutoAddPeople(people);

      expect(result).toHaveLength(2);
      expect(result).toContain(userProfile);
      expect(result).toContain(autoAddTemplate);
      expect(result).not.toContain(deletedAutoAddTemplate);
    });

    it('should return empty array when no people should be auto-added', () => {
      const people = [nonAutoAddTemplate, deletedAutoAddTemplate];
      const result = getAutoAddPeople(people);

      expect(result).toHaveLength(0);
    });

    it('should return empty array for empty input', () => {
      const result = getAutoAddPeople([]);
      expect(result).toHaveLength(0);
    });
  });
});

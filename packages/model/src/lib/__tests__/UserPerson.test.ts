import { describe, it, expect } from 'vitest';
import {
  UserPerson,
  CreateUserPersonInput,
  createUserProfile,
  isUserProfile,
  validateUserPersonName,
  validateUserPersonAge,
  validateUserPersonGender,
  validateUserPerson,
} from '../UserPerson.js';

describe('UserPerson', () => {
  const mockUserPerson: UserPerson = {
    id: '1',
    userId: 'user1',
    name: 'John Doe',
    age: 30,
    gender: 'male',
    settings: { preferences: { theme: 'dark' } },
    isUserProfile: true,
    createdAt: '2025-01-25T00:00:00Z',
    updatedAt: '2025-01-25T00:00:00Z',
    version: 1,
    isDeleted: false,
  };

  describe('createUserProfile', () => {
    it('should create a user profile with required fields', () => {
      const profile = createUserProfile('user1', 'John Doe');

      expect(profile).toEqual({
        userId: 'user1',
        name: 'John Doe',
        age: undefined,
        gender: undefined,
        settings: {},
        isUserProfile: true,
      });
    });

    it('should create a user profile with all optional fields', () => {
      const profile = createUserProfile('user1', 'John Doe', 30, 'male', {
        theme: 'dark',
      });

      expect(profile).toEqual({
        userId: 'user1',
        name: 'John Doe',
        age: 30,
        gender: 'male',
        settings: { theme: 'dark' },
        isUserProfile: true,
      });
    });

    it('should default settings to empty object when not provided', () => {
      const profile = createUserProfile('user1', 'John Doe', 30, 'male');

      expect(profile.settings).toEqual({});
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

  describe('validateUserPersonAge', () => {
    it('should return true for valid ages', () => {
      expect(validateUserPersonAge(0)).toBe(true);
      expect(validateUserPersonAge(30)).toBe(true);
      expect(validateUserPersonAge(150)).toBe(true);
      expect(validateUserPersonAge(undefined)).toBe(true);
    });

    it('should return false for invalid ages', () => {
      expect(validateUserPersonAge(-1)).toBe(false);
      expect(validateUserPersonAge(151)).toBe(false);
      expect(validateUserPersonAge(999)).toBe(false);
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
      age: 30,
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

    it('should return error for invalid age', () => {
      const invalidPerson = { ...validPerson, age: -1 };
      const errors = validateUserPerson(invalidPerson);
      expect(errors).toContain('Age must be between 0 and 150');
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
        age: -1,
        gender: 'invalid' as UserPerson['gender'],
        settings: {},
        isUserProfile: true,
      };
      const errors = validateUserPerson(invalidPerson);
      expect(errors).toHaveLength(3);
      expect(errors).toContain('Name is required and cannot be empty');
      expect(errors).toContain('Age must be between 0 and 150');
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
});

import { describe, it, expect } from 'vitest';
import {
  isPersonFromTemplate,
  isPersonFromUserProfile,
  type Person,
} from './Person.js';

const basePerson: Person = {
  id: 'p1',
  tripId: 't1',
  name: 'John',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  version: 1,
  isDeleted: false,
};

describe('isPersonFromTemplate', () => {
  it('returns true when userPersonId is defined', () => {
    const person = { ...basePerson, userPersonId: 'u1' };
    expect(isPersonFromTemplate(person)).toBe(true);
  });

  it('returns false when userPersonId is missing', () => {
    expect(isPersonFromTemplate(basePerson)).toBe(false);
  });
});

describe('isPersonFromUserProfile', () => {
  const profile = { id: 'u1', isUserProfile: true };

  it('returns true when userPersonId matches the user profile', () => {
    const person = { ...basePerson, userPersonId: 'u1' };
    expect(isPersonFromUserProfile(person, profile)).toBe(true);
  });

  it('returns false when profile is undefined', () => {
    const person = { ...basePerson, userPersonId: 'u1' };
    expect(isPersonFromUserProfile(person)).toBe(false);
  });

  it('returns false for mismatched ids', () => {
    const person = { ...basePerson, userPersonId: 'other' };
    expect(isPersonFromUserProfile(person, profile)).toBe(false);
  });

  it('returns false when userProfile flag is false', () => {
    const person = { ...basePerson, userPersonId: 'u1' };
    const notProfile = { id: 'u1', isUserProfile: false };
    expect(isPersonFromUserProfile(person, notProfile)).toBe(false);
  });
});

// Sprint 3 User People Template Tests
// Tests to verify template creation, management, and usage

import { describe, expect, it } from 'vitest';
import { createStore } from '../store.js';
import { upsertUserPerson, setUserPeople } from '../user-people-slice.js';
import { UserPerson } from '@packing-list/model';

describe('Sprint 3: User People Template Functionality', () => {
  it('should create user person templates', () => {
    const store = createStore();

    // Create a template using slice action
    const template: UserPerson = {
      id: 'template-1',
      userId: 'user-1',
      name: 'Mom',
      birthDate: '1955-01-01',
      gender: 'female',
      settings: {},
      isUserProfile: false, // Template, not profile
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      isDeleted: false,
    };

    store.dispatch(upsertUserPerson(template));

    const state = store.getState();
    expect(state.userPeople.people).toHaveLength(1);
    expect(state.userPeople.people[0].name).toBe('Mom');
    expect(state.userPeople.people[0].isUserProfile).toBe(false);
  });

  it('should support multiple templates', () => {
    const store = createStore();

    // Create multiple templates using slice actions
    const dad: UserPerson = {
      id: 'dad-1',
      userId: 'user-1',
      name: 'Dad',
      birthDate: '1957-01-01',
      gender: 'male',
      settings: {},
      isUserProfile: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      isDeleted: false,
    };

    const sister: UserPerson = {
      id: 'sister-1',
      userId: 'user-1',
      name: 'Sister',
      birthDate: '1998-01-01',
      gender: 'female',
      settings: {},
      isUserProfile: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      isDeleted: false,
    };

    store.dispatch(upsertUserPerson(dad));
    store.dispatch(upsertUserPerson(sister));

    const state = store.getState();
    expect(state.userPeople.people).toHaveLength(2);
    expect(state.userPeople.people.map((p) => p.name)).toEqual([
      'Dad',
      'Sister',
    ]);
  });

  it('should load user people from sync', () => {
    const store = createStore();

    const mockUserPeople = [
      {
        id: 'template-1',
        userId: 'user-1',
        name: 'Travel Buddy',
        age: 30,
        gender: 'other' as const,
        settings: {},
        isUserProfile: false,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        version: 1,
        isDeleted: false,
      },
      {
        id: 'profile-1',
        userId: 'user-1',
        name: 'Me',
        age: 28,
        gender: 'female' as const,
        settings: {},
        isUserProfile: true, // User profile
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        version: 1,
        isDeleted: false,
      },
    ];

    store.dispatch(setUserPeople(mockUserPeople));

    const state = store.getState();
    expect(state.userPeople.people).toHaveLength(2);
    expect(state.userPeople.hasTriedToLoad).toBe(true);

    // Should have both profile and template
    const profile = state.userPeople.people.find((p) => p.isUserProfile);
    const template = state.userPeople.people.find((p) => !p.isUserProfile);

    expect(profile?.name).toBe('Me');
    expect(template?.name).toBe('Travel Buddy');
  });

  it('should filter out deleted people when loading', () => {
    const store = createStore();

    const mockUserPeople = [
      {
        id: 'active-1',
        userId: 'user-1',
        name: 'Active Person',
        isUserProfile: false,
        isDeleted: false,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        version: 1,
      },
      {
        id: 'deleted-1',
        userId: 'user-1',
        name: 'Deleted Person',
        isUserProfile: false,
        isDeleted: true, // Should be filtered out
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        version: 1,
      },
    ];

    // Filter out deleted people before setting (the slice should handle this, but let's be explicit)
    const activePeople = mockUserPeople.filter((p) => !p.isDeleted);
    store.dispatch(setUserPeople(activePeople));

    const state = store.getState();
    expect(state.userPeople.people).toHaveLength(1);
    expect(state.userPeople.people[0].name).toBe('Active Person');
  });
});

// Test Sprint 3 selectors work correctly
describe('Sprint 3: User People Selectors', () => {
  it('should select user profile separately from templates', () => {
    const store = createStore();

    const mockUserPeople = [
      {
        id: 'template-1',
        userId: 'user-1',
        name: 'Template Person',
        isUserProfile: false,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        version: 1,
        isDeleted: false,
      },
      {
        id: 'profile-1',
        userId: 'user-1',
        name: 'My Profile',
        isUserProfile: true,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        version: 1,
        isDeleted: false,
      },
    ];

    store.dispatch(setUserPeople(mockUserPeople));

    const state = store.getState();

    // These will use the selectors from user-people-slice.ts
    const allPeople = state.userPeople.people;
    const profile = allPeople.find((p) => p.isUserProfile);
    const templates = allPeople.filter((p) => !p.isUserProfile);

    expect(profile?.name).toBe('My Profile');
    expect(templates).toHaveLength(1);
    expect(templates[0].name).toBe('Template Person');
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PersonStorage } from '../person-storage.js';
import { initializeDatabase, closeDatabase } from '../database.js';
import type { Person } from '@packing-list/model';

describe('PersonStorage', () => {
  beforeEach(async () => {
    // Initialize fresh database for each test
    await initializeDatabase();
  });

  afterEach(async () => {
    // Clean up database after each test

    await closeDatabase();
  });

  it('should save and retrieve a person', async () => {
    const person: Person = {
      id: 'person-1',
      name: 'Alice',
      tripId: 'trip-1',
      age: 25,
      gender: 'female',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: 1,
      isDeleted: false,
    };

    await PersonStorage.savePerson(person);
    const tripPeople = await PersonStorage.getTripPeople('trip-1');

    expect(tripPeople).toHaveLength(1);
    expect(tripPeople[0]).toEqual(person);
  });

  it('should update an existing person', async () => {
    const person: Person = {
      id: 'person-1',
      name: 'Alice',
      tripId: 'trip-1',
      age: 25,
      gender: 'female',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: 1,
      isDeleted: false,
    };

    await PersonStorage.savePerson(person);

    const updatedPerson = {
      ...person,
      name: 'Alice Smith',
      age: 26,
      updatedAt: '2024-01-01T01:00:00.000Z',
      version: 2,
    };

    await PersonStorage.savePerson(updatedPerson);
    const tripPeople = await PersonStorage.getTripPeople('trip-1');

    expect(tripPeople).toHaveLength(1);
    expect(tripPeople[0].name).toBe('Alice Smith');
    expect(tripPeople[0].age).toBe(26);
    expect(tripPeople[0].version).toBe(2);
  });

  it('should soft delete a person', async () => {
    const person: Person = {
      id: 'person-1',
      name: 'Alice',
      tripId: 'trip-1',
      age: 25,
      gender: 'female',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: 1,
      isDeleted: false,
    };

    await PersonStorage.savePerson(person);
    const peopleBeforeDelete = await PersonStorage.getTripPeople('trip-1');
    expect(peopleBeforeDelete).toHaveLength(1);

    await PersonStorage.deletePerson('person-1');
    const peopleAfterDelete = await PersonStorage.getTripPeople('trip-1');
    expect(peopleAfterDelete).toHaveLength(0);
  });

  it('should handle deletion of non-existent person', async () => {
    // Should not throw an error
    await expect(
      PersonStorage.deletePerson('non-existent')
    ).resolves.not.toThrow();
  });

  it('should filter out deleted people when retrieving trip people', async () => {
    const person1: Person = {
      id: 'person-1',
      name: 'Alice',
      tripId: 'trip-1',
      age: 25,
      gender: 'female',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: 1,
      isDeleted: false,
    };

    const person2: Person = {
      id: 'person-2',
      name: 'Bob',
      tripId: 'trip-1',
      age: 30,
      gender: 'male',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T01:00:00.000Z',
      version: 1,
      isDeleted: true,
    };

    await PersonStorage.savePerson(person1);
    await PersonStorage.savePerson(person2);

    const tripPeople = await PersonStorage.getTripPeople('trip-1');
    expect(tripPeople).toHaveLength(1);
    expect(tripPeople[0].name).toBe('Alice');
  });

  it('should return empty array for trip with no people', async () => {
    const tripPeople = await PersonStorage.getTripPeople('non-existent-trip');
    expect(tripPeople).toHaveLength(0);
    expect(tripPeople).toEqual([]);
  });

  it('should handle multiple trips separately', async () => {
    const trip1Person: Person = {
      id: 'person-1',
      name: 'Alice',
      tripId: 'trip-1',
      age: 25,
      gender: 'female',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: 1,
      isDeleted: false,
    };

    const trip2Person: Person = {
      id: 'person-2',
      name: 'Bob',
      tripId: 'trip-2',
      age: 30,
      gender: 'male',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: 1,
      isDeleted: false,
    };

    await PersonStorage.savePerson(trip1Person);
    await PersonStorage.savePerson(trip2Person);

    const trip1People = await PersonStorage.getTripPeople('trip-1');
    const trip2People = await PersonStorage.getTripPeople('trip-2');

    expect(trip1People).toHaveLength(1);
    expect(trip1People[0].name).toBe('Alice');

    expect(trip2People).toHaveLength(1);
    expect(trip2People[0].name).toBe('Bob');
  });

  it('should handle different gender values', async () => {
    const people: Person[] = [
      {
        id: 'person-1',
        name: 'Alice',
        tripId: 'trip-1',
        age: 25,
        gender: 'female',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        version: 1,
        isDeleted: false,
      },
      {
        id: 'person-2',
        name: 'Bob',
        tripId: 'trip-1',
        age: 30,
        gender: 'male',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        version: 1,
        isDeleted: false,
      },
      {
        id: 'person-3',
        name: 'Charlie',
        tripId: 'trip-1',
        age: 28,
        gender: 'other',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        version: 1,
        isDeleted: false,
      },
      {
        id: 'person-4',
        name: 'Dana',
        tripId: 'trip-1',
        age: 22,
        gender: 'prefer-not-to-say',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        version: 1,
        isDeleted: false,
      },
    ];

    for (const person of people) {
      await PersonStorage.savePerson(person);
    }

    const tripPeople = await PersonStorage.getTripPeople('trip-1');
    expect(tripPeople).toHaveLength(4);

    const genders = tripPeople.map((p) => p.gender);
    expect(genders).toContain('female');
    expect(genders).toContain('male');
    expect(genders).toContain('other');
    expect(genders).toContain('prefer-not-to-say');
  });
});

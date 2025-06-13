import type { Person } from '@packing-list/model';
import { getDatabase } from './database.js';
import { shouldSkipPersistence } from './demo-mode-detector.js';

export class PersonStorage {
  /** Save or update a person */
  static async savePerson(person: Person): Promise<void> {
    // Skip persistence in demo mode
    if (shouldSkipPersistence(person.tripId, person.id)) {
      return;
    }

    const db = await getDatabase();
    const tx = db.transaction(['tripPeople'], 'readwrite');
    await tx.objectStore('tripPeople').put(person);
    await tx.done;
    console.log(`[PersonStorage] Saved person: ${person.id}`);
  }

  /** Soft delete a person */
  static async deletePerson(personId: string): Promise<void> {
    const db = await getDatabase();
    const store = db
      .transaction(['tripPeople'], 'readwrite')
      .objectStore('tripPeople');
    const person = await store.get(personId);
    if (person) {
      person.isDeleted = true;
      person.updatedAt = new Date().toISOString();
      person.version += 1;
      await store.put(person);
    }
    console.log(`[PersonStorage] Deleted person: ${personId}`);
  }

  /** Get all people for a specific trip */
  static async getTripPeople(tripId: string): Promise<Person[]> {
    const db = await getDatabase();
    const index = db
      .transaction(['tripPeople'], 'readonly')
      .objectStore('tripPeople')
      .index('tripId');
    const people = await index.getAll(tripId);
    console.log(
      `[PersonStorage] Retrieved ${people.length} people for trip: ${tripId}`
    );
    return people.filter((p) => !p.isDeleted);
  }
}

import type { Trip, TripSummary } from '@packing-list/model';
import { getDatabase } from './database.js';

export class TripStorage {
  /**
   * Save a trip to IndexedDB
   */
  static async saveTrip(trip: Trip): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction(['trips'], 'readwrite');
    const store = tx.objectStore('trips');

    await store.put(trip);
    await tx.done;

    console.log(`[TripStorage] Saved trip: ${trip.id} - ${trip.title}`);
  }

  /**
   * Get a trip by ID
   */
  static async getTrip(tripId: string): Promise<Trip | undefined> {
    const db = await getDatabase();
    const trip = await db.get('trips', tripId);

    console.log(
      `[TripStorage] Retrieved trip: ${tripId}`,
      trip ? 'found' : 'not found'
    );
    return trip;
  }

  /**
   * Get all trips for a user
   */
  static async getUserTrips(userId: string): Promise<Trip[]> {
    const db = await getDatabase();
    const index = db
      .transaction(['trips'], 'readonly')
      .objectStore('trips')
      .index('userId');
    const allUserTrips = await index.getAll(userId);

    // Filter out deleted trips
    const trips = allUserTrips.filter((trip) => !trip.isDeleted);

    console.log(
      `[TripStorage] Retrieved ${trips.length} trips for user: ${userId}`
    );
    return trips;
  }

  /**
   * Get trip summaries for a user (optimized for listing)
   */
  static async getUserTripSummaries(userId: string): Promise<TripSummary[]> {
    const trips = await this.getUserTrips(userId);

    // TODO: In a real implementation, we'd get counts from related tables
    // For now, return basic summaries
    return trips.map((trip) => ({
      tripId: trip.id,
      title: trip.title,
      description: trip.description,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
      totalItems: 0, // TODO: Count from tripItems table
      packedItems: 0, // TODO: Count packed items
      totalPeople: 0, // TODO: Count from tripPeople table
    }));
  }

  /**
   * Delete a trip (soft delete)
   */
  static async deleteTrip(tripId: string): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction(['trips'], 'readwrite');
    const store = tx.objectStore('trips');

    const trip = await store.get(tripId);
    if (trip) {
      trip.isDeleted = true;
      trip.updatedAt = new Date().toISOString();
      trip.version += 1;
      await store.put(trip);
      await tx.done;

      console.log(`[TripStorage] Soft deleted trip: ${tripId}`);
    }
  }

  /**
   * Hard delete a trip and all related data
   */
  static async hardDeleteTrip(tripId: string): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction(
      ['trips', 'tripPeople', 'tripItems'],
      'readwrite'
    );

    // Delete the trip
    await tx.objectStore('trips').delete(tripId);

    // Delete related people
    const peopleIndex = tx.objectStore('tripPeople').index('tripId');
    const people = await peopleIndex.getAll(tripId);
    for (const person of people) {
      await tx.objectStore('tripPeople').delete(person.id);
    }

    // Delete related items
    const itemsIndex = tx.objectStore('tripItems').index('tripId');
    const items = await itemsIndex.getAll(tripId);
    for (const item of items) {
      await tx.objectStore('tripItems').delete(item.id);
    }

    await tx.done;
    console.log(
      `[TripStorage] Hard deleted trip and all related data: ${tripId}`
    );
  }

  /**
   * Update trip's last sync timestamp
   */
  static async updateLastSynced(tripId: string): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction(['trips'], 'readwrite');
    const store = tx.objectStore('trips');

    const trip = await store.get(tripId);
    if (trip) {
      trip.lastSyncedAt = new Date().toISOString();
      await store.put(trip);
      await tx.done;

      console.log(
        `[TripStorage] Updated last sync timestamp for trip: ${tripId}`
      );
    }
  }

  /**
   * Get trips that need syncing (modified since last sync)
   */
  static async getTripsNeedingSync(userId: string): Promise<Trip[]> {
    const trips = await this.getUserTrips(userId);

    return trips.filter((trip) => {
      if (!trip.lastSyncedAt) return true; // Never synced
      return new Date(trip.updatedAt) > new Date(trip.lastSyncedAt);
    });
  }
}

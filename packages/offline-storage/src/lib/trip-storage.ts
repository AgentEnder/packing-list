import type { Trip, TripSummary } from '@packing-list/model';
import { getDatabase } from './database.js';
import { shouldSkipPersistence } from './demo-mode-detector.js';

export class TripStorage {
  /**
   * Save a trip to IndexedDB
   */
  static async saveTrip(trip: Trip): Promise<void> {
    console.log(`💾 [TripStorage] Attempting to save trip:`, {
      id: trip.id,
      userId: trip.userId,
      title: trip.title,
    });

    // Skip persistence in demo mode
    if (shouldSkipPersistence(trip.id, trip.id)) {
      console.log(
        `🎭 [TripStorage] Skipping persistence due to demo mode for trip:`,
        trip.id
      );
      return;
    }

    const db = await getDatabase();
    const tx = db.transaction(['trips'], 'readwrite');
    const store = tx.objectStore('trips');

    await store.put(trip);
    await tx.done;

    console.log(
      `✅ [TripStorage] Successfully saved trip: ${trip.id} - ${trip.title} for user: ${trip.userId}`
    );
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
    console.log(`🔍 [TripStorage] Getting trips for user: "${userId}"`);

    const db = await getDatabase();
    const tx = db.transaction(['trips'], 'readonly');
    const store = tx.objectStore('trips');

    try {
      // Try to use the userId index for efficient querying
      const index = store.index('userId');
      console.log(
        `🔍 [TripStorage] Using userId index to query for userId: "${userId}"`
      );
      const allUserTrips = await index.getAll(userId);

      console.log(
        `🔍 [TripStorage] Trips from userId index:`,
        allUserTrips.length,
        allUserTrips.map((t) => ({
          id: t.id,
          userId: t.userId,
          title: t.title,
          isDeleted: t.isDeleted,
        }))
      );

      // Filter out deleted trips
      const trips = allUserTrips.filter((trip) => !trip.isDeleted);
      console.log(
        `🔍 [TripStorage] Active trips after filtering:`,
        trips.length,
        trips.map((t) => ({ id: t.id, userId: t.userId, title: t.title }))
      );

      console.log(
        `[TripStorage] Retrieved ${trips.length} trips for user: ${userId}`
      );
      return trips;
    } catch (indexError) {
      // Fallback: get all trips and filter client-side
      console.warn(
        `⚠️ [TripStorage] Failed to use userId index, falling back to client-side filtering:`,
        indexError
      );

      const allTrips = await store.getAll();
      console.log(
        `🔍 [TripStorage] All trips from IndexedDB (fallback):`,
        allTrips.length,
        allTrips.map((t) => ({
          id: t.id,
          userId: t.userId,
          title: t.title,
          isDeleted: t.isDeleted,
        }))
      );

      // Filter by userId and exclude deleted trips
      const userTrips = allTrips.filter((trip) => {
        const matchesUser = trip.userId === userId;
        const isActive = !trip.isDeleted;

        if (!matchesUser) {
          console.log(
            `🔍 [TripStorage] Trip ${trip.id} userId mismatch: expected "${userId}", got "${trip.userId}"`
          );
        }

        return matchesUser && isActive;
      });

      console.log(
        `🔍 [TripStorage] Filtered trips for user "${userId}":`,
        userTrips.length,
        userTrips.map((t) => ({ id: t.id, userId: t.userId, title: t.title }))
      );

      console.log(
        `[TripStorage] Retrieved ${userTrips.length} trips for user: ${userId} (via fallback)`
      );
      return userTrips;
    }
  }

  /**
   * Get trip summaries for a user (optimized for listing)
   */
  static async getUserTripSummaries(userId: string): Promise<TripSummary[]> {
    console.log(
      `🔍 [TripStorage] Getting trip summaries for user: "${userId}"`
    );

    const trips = await this.getUserTrips(userId);
    console.log(
      `🔍 [TripStorage] Got ${trips.length} trips, converting to summaries`
    );

    // TODO: In a real implementation, we'd get counts from related tables
    // For now, return basic summaries
    const summaries = trips.map((trip) => ({
      tripId: trip.id,
      title: trip.title,
      description: trip.description,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
      totalItems: 0, // TODO: Count from tripItems table
      packedItems: 0, // TODO: Count packed items
      totalPeople: 0, // TODO: Count from tripPeople table
    }));

    console.log(
      `🔍 [TripStorage] Returning ${summaries.length} trip summaries:`,
      summaries.map((s) => ({ tripId: s.tripId, title: s.title }))
    );
    return summaries;
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

  /**
   * Debug utility: Get all trips in the database with their userIds for debugging
   */
  static async debugGetAllTrips(): Promise<
    { id: string; userId: string; title: string; isDeleted: boolean }[]
  > {
    console.log(`🔍 [TripStorage] DEBUG - Getting all trips in database`);

    const db = await getDatabase();
    const store = db.transaction(['trips'], 'readonly').objectStore('trips');
    const allTrips = await store.getAll();

    const tripInfo = allTrips.map((trip) => ({
      id: trip.id,
      userId: trip.userId,
      title: trip.title,
      isDeleted: trip.isDeleted,
    }));

    console.log(`🔍 [TripStorage] DEBUG - All trips in database:`, tripInfo);

    // Group by userId for easier analysis
    const byUserId = tripInfo.reduce((acc, trip) => {
      const userId = trip.userId || 'undefined';
      if (!acc[userId]) acc[userId] = [];
      acc[userId].push(trip);
      return acc;
    }, {} as Record<string, typeof tripInfo>);

    console.log(`🔍 [TripStorage] DEBUG - Trips grouped by userId:`, byUserId);

    return tripInfo;
  }
}

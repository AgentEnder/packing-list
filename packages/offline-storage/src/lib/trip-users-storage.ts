import type { TripUser } from '@packing-list/model';
import { getDatabase } from './database';

const STORE_NAME = 'trip_users';

export async function storeTripUser(tripUser: TripUser): Promise<void> {
  const db = await getDatabase();
  await db.put(STORE_NAME, tripUser);
}

export async function getTripUser(id: string): Promise<TripUser | undefined> {
  const db = await getDatabase();
  return db.get(STORE_NAME, id);
}

export async function getTripUsersByTripId(
  tripId: string
): Promise<TripUser[]> {
  const db = await getDatabase();
  const allTripUsers = await db.getAll(STORE_NAME);
  return allTripUsers.filter((tu) => tu.tripId === tripId && !tu.isDeleted);
}

export async function getTripUsersByUserId(
  userId: string
): Promise<TripUser[]> {
  const db = await getDatabase();
  const allTripUsers = await db.getAll(STORE_NAME);
  return allTripUsers.filter((tu) => tu.userId === userId && !tu.isDeleted);
}

export async function getTripUsersByEmail(email: string): Promise<TripUser[]> {
  const db = await getDatabase();
  const allTripUsers = await db.getAll(STORE_NAME);
  return allTripUsers.filter((tu) => tu.email === email && !tu.isDeleted);
}

export async function getPendingInvitationsByEmail(
  email: string
): Promise<TripUser[]> {
  const db = await getDatabase();
  const allTripUsers = await db.getAll(STORE_NAME);
  return allTripUsers.filter(
    (tu) => tu.email === email && tu.status === 'pending' && !tu.isDeleted
  );
}

export async function getAllTripUsers(): Promise<TripUser[]> {
  const db = await getDatabase();
  return db.getAll(STORE_NAME);
}

export async function deleteTripUser(id: string): Promise<void> {
  const db = await getDatabase();
  await db.delete(STORE_NAME, id);
}

export async function clearTripUsers(): Promise<void> {
  const db = await getDatabase();
  await db.clear(STORE_NAME);
}

export async function bulkStoreTripUsers(tripUsers: TripUser[]): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  await Promise.all(tripUsers.map((tripUser) => store.put(tripUser)));
  await tx.done;
}

export async function getUserRoleInTrip(
  tripId: string,
  userId: string
): Promise<'owner' | 'editor' | null> {
  const tripUsers = await getTripUsersByTripId(tripId);
  const userEntry = tripUsers.find(
    (tu) => tu.userId === userId && tu.status === 'accepted'
  );
  return userEntry?.role || null;
}

import type { SyncedEntity } from './SyncedEntity.js';

export type TripUserRole = 'owner' | 'editor';
export type TripUserStatus = 'pending' | 'accepted' | 'declined';

export interface TripUser extends SyncedEntity {
  tripId: string;
  userId?: string | null;
  email: string;
  role: TripUserRole;
  status: TripUserStatus;
}

export interface TripInvitation {
  id: string;
  tripId: string;
  tripName: string;
  tripOwnerName?: string;
  tripOwnerEmail: string;
  role: TripUserRole;
  createdAt: string;
}

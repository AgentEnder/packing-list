/**
 * TripUser represents the relationship between a user and a trip
 * This enables multi-user trip sharing with role-based access control
 */
export type TripUser = {
  id: string;
  tripId: string;
  userId?: string; // Optional for pending invitations (email-only)
  email?: string; // For pending invitations
  role: TripRole;
  invitedAt: string;
  acceptedAt?: string;
  invitedBy?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Role-based access control for trips
 * - owner: Full control, can delete trip, manage users
 * - editor: Can edit all trip content, add/remove items, people, rules
 * - viewer: Can view all content, can only update packed status
 */
export type TripRole = 'owner' | 'editor' | 'viewer';

/**
 * Helper type for pending invitations (email-based)
 */
export type PendingTripInvitation = {
  id: string;
  tripId: string;
  email: string;
  role: TripRole;
  invitedAt: string;
  invitedBy?: string;
};

/**
 * Helper type for accepted trip users
 */
export type AcceptedTripUser = {
  id: string;
  tripId: string;
  userId: string;
  role: TripRole;
  acceptedAt: string;
  invitedBy?: string;
};

/**
 * Extended trip user with user profile information
 */
export type TripUserWithProfile = TripUser & {
  userEmail?: string;
  userName?: string;
};

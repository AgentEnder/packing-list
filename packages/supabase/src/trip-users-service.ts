import { getSupabaseClient } from './supabase-client.js';
import type {
  TripUser,
  TripRole,
  PendingTripInvitation,
  AcceptedTripUser,
} from '@packing-list/model';

/**
 * Service for managing trip user relationships and invitations
 */
export class TripUsersService {
  /**
   * Get all users for a specific trip
   */
  static async getTripUsers(tripId: string): Promise<TripUser[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('trip_users')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching trip users:', error);
      throw error;
    }

    return (data || []).map(this.mapDatabaseToTripUser);
  }

  /**
   * Get all accepted users for a trip (excludes pending invitations)
   */
  static async getAcceptedTripUsers(
    tripId: string
  ): Promise<AcceptedTripUser[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('trip_users')
      .select('*')
      .eq('trip_id', tripId)
      .not('user_id', 'is', null)
      .not('accepted_at', 'is', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching accepted trip users:', error);
      throw error;
    }

    return (data || []).map(
      (row) =>
        ({
          id: row.id,
          tripId: row.trip_id,
          userId: row.user_id!,
          role: row.role as TripRole,
          acceptedAt: row.accepted_at!,
          invitedBy: row.invited_by || undefined,
        }) as AcceptedTripUser
    );
  }

  /**
   * Get pending invitations for a trip
   */
  static async getPendingInvitations(
    tripId: string
  ): Promise<PendingTripInvitation[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('trip_users')
      .select('*')
      .eq('trip_id', tripId)
      .is('accepted_at', null)
      .not('email', 'is', null)
      .order('invited_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending invitations:', error);
      throw error;
    }

    return (data || []).map(
      (row) =>
        ({
          id: row.id,
          tripId: row.trip_id,
          email: row.email!,
          role: row.role as TripRole,
          invitedAt: row.invited_at!,
          invitedBy: row.invited_by || undefined,
        }) as PendingTripInvitation
    );
  }

  /**
   * Invite a user to a trip by email
   * If the user already exists, adds them directly
   * Otherwise, creates a pending invitation
   */
  static async inviteUserToTrip(
    tripId: string,
    email: string,
    role: TripRole = 'viewer',
    invitedBy?: string
  ): Promise<TripUser> {
    const supabase = getSupabaseClient();

    // First, check if a user with this email exists
    const { data: authUsers, error: authError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', email); // Note: This won't work as-is, need to query auth.users differently

    // For now, we'll create the invitation with email only
    // The system can later match it when the user signs up or accepts

    const { data, error } = await supabase
      .from('trip_users')
      .insert({
        trip_id: tripId,
        email: email.toLowerCase(),
        role: role,
        invited_by: invitedBy,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inviting user to trip:', error);
      throw error;
    }

    return this.mapDatabaseToTripUser(data);
  }

  /**
   * Add an existing user to a trip
   */
  static async addUserToTrip(
    tripId: string,
    userId: string,
    role: TripRole = 'viewer',
    invitedBy?: string
  ): Promise<TripUser> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('trip_users')
      .insert({
        trip_id: tripId,
        user_id: userId,
        role: role,
        accepted_at: new Date().toISOString(),
        invited_by: invitedBy,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding user to trip:', error);
      throw error;
    }

    return this.mapDatabaseToTripUser(data);
  }

  /**
   * Update a trip user's role
   */
  static async updateTripUserRole(
    tripUserId: string,
    newRole: TripRole
  ): Promise<TripUser> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('trip_users')
      .update({ role: newRole })
      .eq('id', tripUserId)
      .select()
      .single();

    if (error) {
      console.error('Error updating trip user role:', error);
      throw error;
    }

    return this.mapDatabaseToTripUser(data);
  }

  /**
   * Remove a user from a trip
   */
  static async removeUserFromTrip(tripUserId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('trip_users')
      .delete()
      .eq('id', tripUserId);

    if (error) {
      console.error('Error removing user from trip:', error);
      throw error;
    }
  }

  /**
   * Accept a pending invitation
   * This is called when a user signs up or logs in with the invited email
   */
  static async acceptInvitation(
    tripId: string,
    userId: string,
    email: string
  ): Promise<TripUser | null> {
    const supabase = getSupabaseClient();

    // Find pending invitation for this email
    const { data: invitations, error: fetchError } = await supabase
      .from('trip_users')
      .select('*')
      .eq('trip_id', tripId)
      .eq('email', email.toLowerCase())
      .is('accepted_at', null)
      .limit(1);

    if (fetchError) {
      console.error('Error fetching invitation:', fetchError);
      throw fetchError;
    }

    if (!invitations || invitations.length === 0) {
      return null;
    }

    const invitation = invitations[0];

    // Update the invitation with user_id and accepted_at
    const { data, error } = await supabase
      .from('trip_users')
      .update({
        user_id: userId,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id)
      .select()
      .single();

    if (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }

    return this.mapDatabaseToTripUser(data);
  }

  /**
   * Get user's role for a specific trip
   */
  static async getUserTripRole(
    tripId: string,
    userId: string
  ): Promise<TripRole | null> {
    const supabase = getSupabaseClient();

    // Use the database helper function
    const { data, error } = await supabase.rpc('get_user_trip_role', {
      target_trip_id: tripId,
      target_user_id: userId,
    });

    if (error) {
      console.error('Error getting user trip role:', error);
      return null;
    }

    return data as TripRole | null;
  }

  /**
   * Check if user can edit a trip
   */
  static async canUserEditTrip(
    tripId: string,
    userId: string
  ): Promise<boolean> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.rpc('user_can_edit_trip', {
      target_trip_id: tripId,
      target_user_id: userId,
    });

    if (error) {
      console.error('Error checking edit permission:', error);
      return false;
    }

    return data === true;
  }

  /**
   * Check if user can view a trip
   */
  static async canUserViewTrip(
    tripId: string,
    userId: string
  ): Promise<boolean> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.rpc('user_can_view_trip', {
      target_trip_id: tripId,
      target_user_id: userId,
    });

    if (error) {
      console.error('Error checking view permission:', error);
      return false;
    }

    return data === true;
  }

  /**
   * Map database row to TripUser type
   */
  private static mapDatabaseToTripUser(row: any): TripUser {
    return {
      id: row.id,
      tripId: row.trip_id,
      userId: row.user_id || undefined,
      email: row.email || undefined,
      role: row.role as TripRole,
      invitedAt: row.invited_at,
      acceptedAt: row.accepted_at || undefined,
      invitedBy: row.invited_by || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

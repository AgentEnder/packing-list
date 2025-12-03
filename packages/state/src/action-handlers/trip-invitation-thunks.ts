import { createAsyncThunk } from '@reduxjs/toolkit';
import { getSupabaseClient } from '@packing-list/supabase';
import type { StoreType } from '../store.js';
import type { TripUser, TripInvitation, TripUserRole } from '@packing-list/model';
import {
  addTripUser,
  removeTripUser,
  setTripUsers,
  setPendingInvitations,
  setLoading,
  setError,
} from '../trip-users-slice.js';
import { storeTripUser, deleteTripUser } from '@packing-list/offline-storage';

export interface InviteUserParams {
  tripId: string;
  email: string;
  role: 'editor';
}

export interface AcceptInvitationParams {
  tripId: string;
}

export interface RemoveUserParams {
  tripId: string;
  userId: string;
}

export const inviteUserToTripThunk = createAsyncThunk(
  'tripUsers/inviteUser',
  async (params: InviteUserParams, { getState, dispatch }) => {
    const { tripId, email, role } = params;
    const state = getState() as StoreType;

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const supabase = getSupabaseClient();

      // Verify the user owns the trip
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('user_id')
        .eq('id', tripId)
        .eq('is_deleted', false)
        .single();

      if (tripError) throw new Error('Trip not found');
      
      const user = state.auth.user;
      if (!user || trip.user_id !== user.id) {
        throw new Error('Only trip owners can invite users');
      }

      // Check if invitation already exists
      const { data: existingInvitation } = await supabase
        .from('trip_users')
        .select('id')
        .eq('trip_id', tripId)
        .eq('email', email)
        .eq('is_deleted', false)
        .maybeSingle();

      if (existingInvitation) {
        throw new Error('User already invited to this trip');
      }

      // We can't directly query auth.users from client, so userId will be null initially
      // and will be populated when the user signs up and accepts the invitation
      const userId = null;

      // Create the invitation
      const { data: newTripUser, error: insertError } = await supabase
        .from('trip_users')
        .insert({
          trip_id: tripId,
          user_id: userId,
          email,
          role,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Create the trip user object for local state
      const tripUser: TripUser = {
        id: newTripUser.id,
        tripId: newTripUser.trip_id,
        userId: newTripUser.user_id,
        email: newTripUser.email,
        role: newTripUser.role as 'editor',
        status: newTripUser.status as 'pending',
        createdAt: newTripUser.created_at,
        updatedAt: newTripUser.updated_at,
        version: newTripUser.version,
        isDeleted: newTripUser.is_deleted,
      };

      // Store in offline storage
      await storeTripUser(tripUser);

      // Update Redux state
      dispatch(addTripUser(tripUser));

      return { success: true, message: 'Invitation sent successfully' };
    } catch (error) {
      console.error('Failed to invite user:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send invitation';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const acceptTripInvitationThunk = createAsyncThunk(
  'tripUsers/acceptInvitation',
  async (params: AcceptInvitationParams, { dispatch }) => {
    const { tripId } = params;

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User must be logged in to accept invitations');
      }

      // Find the invitation
      const { data: invitation, error: findError } = await supabase
        .from('trip_users')
        .select('id')
        .eq('trip_id', tripId)
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .eq('status', 'pending')
        .eq('is_deleted', false)
        .single();

      if (findError || !invitation) {
        throw new Error('No pending invitation found for this trip');
      }

      // Update the invitation status
      const { error: updateError } = await supabase
        .from('trip_users')
        .update({
          status: 'accepted',
          user_id: user.id, // Ensure user_id is set
          updated_at: new Date().toISOString(),
          // Version will be incremented by the database trigger
        })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      // Reload trip members to get updated status
      dispatch(loadTripMembersThunk(tripId));

      // Reload pending invitations to remove the accepted invitation
      dispatch(loadPendingInvitationsThunk());

      // Trigger a full sync to load the newly accessible trip
      dispatch({ type: 'SYNC_FROM_SERVER' });

      return { success: true, message: 'Invitation accepted', tripId };
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to accept invitation';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const declineTripInvitationThunk = createAsyncThunk(
  'tripUsers/declineInvitation',
  async (tripId: string, { dispatch }) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User must be logged in to decline invitations');
      }

      // Find the invitation
      const { data: invitation, error: findError } = await supabase
        .from('trip_users')
        .select('id')
        .eq('trip_id', tripId)
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .eq('status', 'pending')
        .eq('is_deleted', false)
        .single();

      if (findError || !invitation) {
        throw new Error('No pending invitation found for this trip');
      }

      // Update the invitation status
      const { error: updateError } = await supabase
        .from('trip_users')
        .update({
          status: 'declined',
          updated_at: new Date().toISOString(),
          // Version will be incremented by the database trigger
        })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      // Reload pending invitations to update the list
      dispatch(loadPendingInvitationsThunk());

      return { success: true, message: 'Invitation declined' };
    } catch (error) {
      console.error('Failed to decline invitation:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to decline invitation';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const removeUserFromTripThunk = createAsyncThunk(
  'tripUsers/removeUser',
  async (params: RemoveUserParams, { getState, dispatch }) => {
    const { tripId, userId } = params;
    const state = getState() as StoreType;

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const supabase = getSupabaseClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error('User must be logged in');
      }

      // Verify the caller owns the trip
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('user_id')
        .eq('id', tripId)
        .eq('is_deleted', false)
        .single();

      if (tripError) throw new Error('Trip not found');
      
      if (trip.user_id !== currentUser.id) {
        throw new Error('Only trip owners can remove users');
      }

      // Can't remove the owner
      if (userId === trip.user_id) {
        throw new Error('Cannot remove the trip owner');
      }

      // Soft delete the trip user record
      const { error: updateError } = await supabase
        .from('trip_users')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString(),
          // Version will be incremented by the database trigger
        })
        .eq('trip_id', tripId)
        .eq('user_id', userId)
        .eq('is_deleted', false);

      if (updateError) throw updateError;

      // Find the trip user record
      const tripUser = Object.values(state.tripUsers.tripUsers).find(
        (tu) => tu.tripId === tripId && tu.userId === userId
      );

      if (tripUser) {
        // Remove from offline storage
        await deleteTripUser(tripUser.id);

        // Update Redux state
        dispatch(removeTripUser(tripUser.id));
      }

      return { success: true, message: 'User removed from trip' };
    } catch (error) {
      console.error('Failed to remove user:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to remove user';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const loadTripMembersThunk = createAsyncThunk(
  'tripUsers/loadMembers',
  async (tripId: string, { dispatch }) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const supabase = getSupabaseClient();

      // Load trip members
      const { data, error } = await supabase
        .from('trip_users')
        .select('*')
        .eq('trip_id', tripId)
        .eq('is_deleted', false);

      if (error) throw error;

      const tripUsers: TripUser[] = (data || []).map((tu) => ({
        id: tu.id,
        tripId: tu.trip_id,
        userId: tu.user_id,
        email: tu.email,
        role: tu.role as TripUserRole,
        status: tu.status as 'pending' | 'accepted' | 'declined',
        createdAt: tu.created_at,
        updatedAt: tu.updated_at,
        version: tu.version,
        isDeleted: tu.is_deleted,
      }));

      // Store in offline storage
      for (const tripUser of tripUsers) {
        await storeTripUser(tripUser);
      }

      // Update Redux state
      dispatch(setTripUsers(tripUsers));

      return tripUsers;
    } catch (error) {
      console.error('Failed to load trip members:', error);
      dispatch(
        setError(
          error instanceof Error ? error.message : 'Failed to load trip members'
        )
      );
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const populatePendingInvitationsThunk = createAsyncThunk(
  'tripUsers/populateInvitations',
  async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !user.email) {
        return 0;
      }

      // Update any pending invitations with this email to include the user_id
      const { error } = await supabase
        .from('trip_users')
        .update({
          user_id: user.id,
          updated_at: new Date().toISOString(),
          // Version will be incremented by the database trigger
        })
        .eq('email', user.email)
        .is('user_id', null)
        .eq('status', 'pending')
        .eq('is_deleted', false);

      if (error) {
        console.error('Failed to populate pending invitations:', error);
        return 0;
      }

      console.log(`📬 [INVITATIONS] Populated pending invitations for ${user.email}`);
      return 1; // We can't get the actual count easily, so return 1 if successful
    } catch (error) {
      console.error('Failed to populate pending invitations:', error);
      return 0;
    }
  }
);

export const loadPendingInvitationsThunk = createAsyncThunk(
  'tripUsers/loadInvitations',
  async (_, { dispatch }) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // No user logged in, no pending invitations
        dispatch(setPendingInvitations([]));
        return [];
      }

      // Get pending invitations with trip details (RLS now allows this)
      const { data: tripUsersData, error } = await supabase
        .from('trip_users')
        .select(`
          id,
          trip_id,
          role,
          created_at,
          trips!inner(
            id,
            title,
            user_id
          )
        `)
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .eq('status', 'pending')
        .eq('is_deleted', false)
        .eq('trips.is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading pending invitations:', error);
        throw error;
      }

      console.log(`📬 [INVITATIONS] Found ${(tripUsersData || []).length} pending invitations for user ${user.email}`);

      // Get owner profile info for all unique owner user_ids
      const ownerUserIds = [...new Set((tripUsersData || []).map((tu: { trips: { user_id: string } }) => tu.trips.user_id))];
      const { data: ownerProfiles } = await supabase
        .from('user_people')
        .select('user_id, name')
        .in('user_id', ownerUserIds)
        .eq('is_user_profile', true)
        .eq('is_deleted', false);

      // Create a map for quick lookup
      const ownerProfileMap = new Map(
        (ownerProfiles || []).map((profile: { user_id: string; name: string }) => [profile.user_id, profile.name])
      );

      const invitations: TripInvitation[] = (tripUsersData || []).map((tripUser: {
        id: string;
        trip_id: string;
        role: string;
        created_at: string;
        trips: { title: string; user_id: string };
      }) => ({
        id: tripUser.id,
        tripId: tripUser.trip_id,
        tripName: tripUser.trips.title,
        tripOwnerName: ownerProfileMap.get(tripUser.trips.user_id) || 'Unknown',
        tripOwnerEmail: '', // We can't access auth.users email from client
        role: tripUser.role as TripUserRole,
        createdAt: tripUser.created_at,
      }));

      // Update Redux state
      dispatch(setPendingInvitations(invitations));

      return invitations;
    } catch (error) {
      console.error('Failed to load pending invitations:', error);
      dispatch(
        setError(
          error instanceof Error ? error.message : 'Failed to load invitations'
        )
      );
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);
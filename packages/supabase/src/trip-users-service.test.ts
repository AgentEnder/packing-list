import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TripUsersService } from './trip-users-service.js';
import { getSupabaseClient } from './supabase-client.js';
import type { TripRole } from '@packing-list/model';

vi.mock('./supabase-client.js', () => ({
  getSupabaseClient: vi.fn(),
}));

describe('TripUsersService', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
      rpc: vi.fn(),
    };

    vi.mocked(getSupabaseClient).mockReturnValue(mockSupabaseClient);
  });

  describe('getTripUsers', () => {
    it('should fetch all users for a trip', async () => {
      const mockData = [
        {
          id: '1',
          trip_id: 'trip-1',
          user_id: 'user-1',
          email: null,
          role: 'owner',
          invited_at: '2025-01-01T00:00:00Z',
          accepted_at: '2025-01-01T00:00:00Z',
          invited_by: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      mockSupabaseClient.order.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await TripUsersService.getTripUsers('trip-1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('trip_users');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('trip_id', 'trip-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        tripId: 'trip-1',
        userId: 'user-1',
        role: 'owner',
      });
    });

    it('should handle errors when fetching trip users', async () => {
      const mockError = new Error('Database error');
      mockSupabaseClient.order.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(
        TripUsersService.getTripUsers('trip-1')
      ).rejects.toThrow('Database error');
    });
  });

  describe('getAcceptedTripUsers', () => {
    it('should fetch only accepted users', async () => {
      const mockData = [
        {
          id: '1',
          trip_id: 'trip-1',
          user_id: 'user-1',
          email: null,
          role: 'owner',
          invited_at: '2025-01-01T00:00:00Z',
          accepted_at: '2025-01-01T00:00:00Z',
          invited_by: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      mockSupabaseClient.order.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await TripUsersService.getAcceptedTripUsers('trip-1');

      expect(mockSupabaseClient.not).toHaveBeenCalledWith('user_id', 'is', null);
      expect(mockSupabaseClient.not).toHaveBeenCalledWith('accepted_at', 'is', null);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        tripId: 'trip-1',
        userId: 'user-1',
        role: 'owner',
        acceptedAt: '2025-01-01T00:00:00Z',
      });
    });
  });

  describe('getPendingInvitations', () => {
    it('should fetch pending invitations', async () => {
      const mockData = [
        {
          id: '1',
          trip_id: 'trip-1',
          user_id: null,
          email: 'invited@example.com',
          role: 'viewer',
          invited_at: '2025-01-01T00:00:00Z',
          accepted_at: null,
          invited_by: 'owner-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      mockSupabaseClient.order.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await TripUsersService.getPendingInvitations('trip-1');

      expect(mockSupabaseClient.is).toHaveBeenCalledWith('accepted_at', null);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        tripId: 'trip-1',
        email: 'invited@example.com',
        role: 'viewer',
      });
    });
  });

  describe('inviteUserToTrip', () => {
    it('should create a pending invitation', async () => {
      const mockData = {
        id: '1',
        trip_id: 'trip-1',
        user_id: null,
        email: 'invited@example.com',
        role: 'viewer',
        invited_at: '2025-01-01T00:00:00Z',
        accepted_at: null,
        invited_by: 'owner-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      // Mock the user_profiles query
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Mock the insert
      mockSupabaseClient.single.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await TripUsersService.inviteUserToTrip(
        'trip-1',
        'invited@example.com',
        'viewer',
        'owner-1'
      );

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        trip_id: 'trip-1',
        email: 'invited@example.com',
        role: 'viewer',
        invited_by: 'owner-1',
      });
      expect(result).toMatchObject({
        tripId: 'trip-1',
        email: 'invited@example.com',
        role: 'viewer',
      });
    });
  });

  describe('addUserToTrip', () => {
    it('should add an existing user to a trip', async () => {
      const mockData = {
        id: '1',
        trip_id: 'trip-1',
        user_id: 'user-1',
        email: null,
        role: 'editor',
        invited_at: '2025-01-01T00:00:00Z',
        accepted_at: '2025-01-01T00:00:00Z',
        invited_by: 'owner-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await TripUsersService.addUserToTrip(
        'trip-1',
        'user-1',
        'editor',
        'owner-1'
      );

      expect(mockSupabaseClient.insert).toHaveBeenCalled();
      const insertCall = mockSupabaseClient.insert.mock.calls[0][0];
      expect(insertCall).toMatchObject({
        trip_id: 'trip-1',
        user_id: 'user-1',
        role: 'editor',
        invited_by: 'owner-1',
      });
      expect(insertCall.accepted_at).toBeDefined();
      expect(result).toMatchObject({
        tripId: 'trip-1',
        userId: 'user-1',
        role: 'editor',
      });
    });
  });

  describe('updateTripUserRole', () => {
    it('should update a user role', async () => {
      const mockData = {
        id: '1',
        trip_id: 'trip-1',
        user_id: 'user-1',
        email: null,
        role: 'editor',
        invited_at: '2025-01-01T00:00:00Z',
        accepted_at: '2025-01-01T00:00:00Z',
        invited_by: 'owner-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await TripUsersService.updateTripUserRole('1', 'editor');

      expect(mockSupabaseClient.update).toHaveBeenCalledWith({ role: 'editor' });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', '1');
      expect(result.role).toBe('editor');
    });
  });

  describe('removeUserFromTrip', () => {
    it('should remove a user from a trip', async () => {
      mockSupabaseClient.delete.mockResolvedValue({
        error: null,
      });

      await TripUsersService.removeUserFromTrip('1');

      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', '1');
    });

    it('should throw error when removal fails', async () => {
      const mockError = new Error('Delete failed');
      mockSupabaseClient.delete.mockResolvedValue({
        error: mockError,
      });

      await expect(
        TripUsersService.removeUserFromTrip('1')
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('acceptInvitation', () => {
    it('should accept a pending invitation', async () => {
      const pendingInvitation = {
        id: '1',
        trip_id: 'trip-1',
        user_id: null,
        email: 'user@example.com',
        role: 'viewer',
        invited_at: '2025-01-01T00:00:00Z',
        accepted_at: null,
        invited_by: 'owner-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const acceptedInvitation = {
        ...pendingInvitation,
        user_id: 'user-1',
        accepted_at: '2025-01-02T00:00:00Z',
      };

      // Mock fetching the pending invitation
      mockSupabaseClient.limit.mockResolvedValue({
        data: [pendingInvitation],
        error: null,
      });

      // Mock updating the invitation
      mockSupabaseClient.single.mockResolvedValue({
        data: acceptedInvitation,
        error: null,
      });

      const result = await TripUsersService.acceptInvitation(
        'trip-1',
        'user-1',
        'user@example.com'
      );

      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          accepted_at: expect.any(String),
        })
      );
      expect(result).toMatchObject({
        tripId: 'trip-1',
        userId: 'user-1',
        role: 'viewer',
      });
    });

    it('should return null when no invitation exists', async () => {
      mockSupabaseClient.limit.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await TripUsersService.acceptInvitation(
        'trip-1',
        'user-1',
        'user@example.com'
      );

      expect(result).toBeNull();
    });
  });

  describe('getUserTripRole', () => {
    it('should get user role for a trip', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: 'owner',
        error: null,
      });

      const role = await TripUsersService.getUserTripRole('trip-1', 'user-1');

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_user_trip_role', {
        target_trip_id: 'trip-1',
        target_user_id: 'user-1',
      });
      expect(role).toBe('owner');
    });

    it('should return null on error', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: new Error('RPC error'),
      });

      const role = await TripUsersService.getUserTripRole('trip-1', 'user-1');

      expect(role).toBeNull();
    });
  });

  describe('canUserEditTrip', () => {
    it('should return true if user can edit', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: true,
        error: null,
      });

      const canEdit = await TripUsersService.canUserEditTrip('trip-1', 'user-1');

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('user_can_edit_trip', {
        target_trip_id: 'trip-1',
        target_user_id: 'user-1',
      });
      expect(canEdit).toBe(true);
    });

    it('should return false on error', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: new Error('RPC error'),
      });

      const canEdit = await TripUsersService.canUserEditTrip('trip-1', 'user-1');

      expect(canEdit).toBe(false);
    });
  });

  describe('canUserViewTrip', () => {
    it('should return true if user can view', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: true,
        error: null,
      });

      const canView = await TripUsersService.canUserViewTrip('trip-1', 'user-1');

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('user_can_view_trip', {
        target_trip_id: 'trip-1',
        target_user_id: 'user-1',
      });
      expect(canView).toBe(true);
    });

    it('should return false on error', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: new Error('RPC error'),
      });

      const canView = await TripUsersService.canUserViewTrip('trip-1', 'user-1');

      expect(canView).toBe(false);
    });
  });
});

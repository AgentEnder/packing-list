import { Avatar, useAuth } from '@packing-list/shared-components';
import { UserX, Clock, Crown, Edit2, Mail, LogOut } from 'lucide-react';
import {
  selectAllTripUsers,
  useAppDispatch,
  actions,
  useAppSelector,
  selectUserPeople,
} from '@packing-list/state';
import type { TripUser } from '@packing-list/model';
import { showToast } from './Toast';

interface TripMembersListProps {
  tripId: string;
  canManageMembers: boolean;
}

export function TripMembersList({
  tripId,
  canManageMembers,
}: TripMembersListProps) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const members = useAppSelector((state) => selectAllTripUsers(state, tripId));
  const userPeople = useAppSelector(selectUserPeople);

  const handleRemoveMember = async (userId: string) => {
    if (confirm('Are you sure you want to remove this member from the trip?')) {
      try {
        await dispatch(actions.removeUserFromTrip({ tripId, userId })).unwrap();
        showToast('Member removed successfully');
      } catch (error) {
        console.error('Failed to remove member:', error);
        showToast('Failed to remove member', 'error');
      }
    }
  };

  const handleLeaveTrip = async (userId: string) => {
    if (
      confirm(
        'Are you sure you want to leave this trip? You will no longer have access to it.'
      )
    ) {
      try {
        await dispatch(actions.removeUserFromTrip({ tripId, userId })).unwrap();
        showToast('You have left the trip');
      } catch (error) {
        console.error('Failed to leave trip:', error);
        showToast('Failed to leave trip', 'error');
      }
    }
  };

  const handleResendInvitation = async () => {
    // For now, just show a message since resending is not implemented yet
    showToast('Invitation reminder sent');
  };

  const isCurrentUser = (member: TripUser) => {
    return member.userId === user?.id || member.email === user?.email;
  };

  const getUserDisplayName = (member: TripUser) => {
    // For the current user, we can get their name from auth
    if (isCurrentUser(member) && user?.name) {
      return user.name;
    }
    
    // Try to find the user profile by user_id in user_people (where is_user_profile = true)
    if (member.userId) {
      const userProfile = userPeople.find(
        (up) => up.userId === member.userId && up.isUserProfile && !up.isDeleted
      );
      if (userProfile?.name) {
        return userProfile.name;
      }
    }
    
    // Fall back to email
    // Note: We can only get the current user's name from auth metadata.
    // For other users, we would need their profile data from user_people table
    // or a separate API call to get auth.users metadata (which isn't exposed client-side)
    return member.email;
  };

  const getRoleBadge = (member: TripUser) => {
    const isYou = isCurrentUser(member);

    if (member.role === 'owner') {
      return (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded-full">
            <Crown className="h-3 w-3" />
            Owner
          </span>
          {isYou && (
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-full">
              You
            </span>
          )}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
          <Edit2 className="h-3 w-3" />
          Editor
        </span>
        {isYou && (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-full">
            You
          </span>
        )}
      </div>
    );
  };

  const getStatusBadge = (status: TripUser['status']) => {
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full">
          <Clock className="h-3 w-3" />
          Pending
        </span>
      );
    }
    return null;
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No members yet. Invite someone to collaborate!</p>
      </div>
    );
  }

  const acceptedMembers = members.filter((m) => m.status === 'accepted');
  const pendingMembers = members.filter((m) => m.status === 'pending');

  return (
    <div className="space-y-6">
      {acceptedMembers.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Active Members ({acceptedMembers.length})
          </h3>
          <div className="space-y-2">
            {acceptedMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <Avatar alt={getUserDisplayName(member)} size={32} />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {getUserDisplayName(member)}
                    </p>
                    {getUserDisplayName(member) !== member.email && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {member.email}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      {getRoleBadge(member)}
                    </div>
                  </div>
                </div>
                {(() => {
                  const isYou = isCurrentUser(member);
                  const isOwner = member.role === 'owner';

                  // Don't show any action button for the trip owner (they can't leave or be removed)
                  if (isOwner) {
                    return null;
                  }

                  // Show "Leave" button for current user (non-owner)
                  if (isYou) {
                    return (
                      <button
                        className="btn btn-ghost btn-sm text-orange-600 hover:text-orange-700 dark:text-orange-400"
                        onClick={() =>
                          member.userId && handleLeaveTrip(member.userId)
                        }
                        title="Leave trip"
                      >
                        <LogOut className="h-4 w-4" />
                        Leave
                      </button>
                    );
                  }

                  // Show "Remove" button for other members (only if user can manage members)
                  if (canManageMembers) {
                    return (
                      <button
                        className="btn btn-ghost btn-sm text-red-600 hover:text-red-700 dark:text-red-400"
                        onClick={() =>
                          member.userId && handleRemoveMember(member.userId)
                        }
                        title="Remove member"
                      >
                        <UserX className="h-4 w-4" />
                        Remove
                      </button>
                    );
                  }

                  return null;
                })()}
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingMembers.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Pending Invitations ({pendingMembers.length})
          </h3>
          <div className="space-y-2">
            {pendingMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {getUserDisplayName(member)}
                    </p>
                    {getUserDisplayName(member) !== member.email && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {member.email}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      {getRoleBadge(member)}
                      {getStatusBadge(member.status)}
                    </div>
                  </div>
                </div>
                {(() => {
                  const isYou = isCurrentUser(member);

                  // For pending invitations, current user shouldn't see manage buttons here
                  // (they would accept/decline via the PendingInvitationsCard)
                  if (isYou) {
                    return null;
                  }

                  // Show management buttons for other pending invitations (only if user can manage members)
                  if (canManageMembers) {
                    return (
                      <div className="flex items-center gap-2">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleResendInvitation()}
                        >
                          Resend
                        </button>
                        <button
                          className="btn btn-ghost btn-sm text-red-600 hover:text-red-700 dark:text-red-400"
                          onClick={() =>
                            member.userId && handleRemoveMember(member.userId)
                          }
                          title="Cancel invitation"
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  }

                  return null;
                })()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

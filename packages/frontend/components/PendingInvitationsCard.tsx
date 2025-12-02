import { useState } from 'react';
import { useAppSelector, useAppDispatch, selectPendingInvitations, actions } from '@packing-list/state';
import { Mail, Check, X, Users } from 'lucide-react';
import { showToast } from './Toast';

export function PendingInvitationsCard() {
  const dispatch = useAppDispatch();
  const invitations = useAppSelector(selectPendingInvitations);
  const [processingInvites, setProcessingInvites] = useState<Set<string>>(new Set());

  const handleAccept = async (tripId: string) => {
    setProcessingInvites(prev => new Set(prev).add(tripId));
    
    try {
      await dispatch(actions.acceptTripInvitation({ tripId })).unwrap();
      showToast('Invitation accepted successfully!');
      // Reload pending invitations to update the list
      dispatch(actions.loadPendingInvitations());
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      showToast('Failed to accept invitation', 'error');
    } finally {
      setProcessingInvites(prev => {
        const newSet = new Set(prev);
        newSet.delete(tripId);
        return newSet;
      });
    }
  };

  const handleDecline = async (tripId: string) => {
    if (confirm('Are you sure you want to decline this invitation?')) {
      setProcessingInvites(prev => new Set(prev).add(tripId));
      
      try {
        await dispatch(actions.declineTripInvitation(tripId)).unwrap();
        showToast('Invitation declined');
        // Thunk already reloads pending invitations
      } catch (error) {
        console.error('Failed to decline invitation:', error);
        showToast('Failed to decline invitation', 'error');
      } finally {
        setProcessingInvites(prev => {
          const newSet = new Set(prev);
          newSet.delete(tripId);
          return newSet;
        });
      }
    }
  };

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="card bg-base-100 shadow-lg mb-6">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold">Pending Invitations</h2>
          <span className="ml-auto bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium px-2 py-0.5 rounded-full">
            {invitations.length}
          </span>
        </div>

        <div className="space-y-3">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
            >
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {invitation.tripName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  Invited by{' '}
                  {invitation.tripOwnerName || invitation.tripOwnerEmail}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Role: {invitation.role === 'editor' ? 'Editor' : 'Viewer'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  className="btn btn-sm btn-outline text-red-600 hover:text-red-700 dark:text-red-400"
                  onClick={() => handleDecline(invitation.tripId)}
                  disabled={processingInvites.has(invitation.tripId)}
                >
                  {processingInvites.has(invitation.tripId) ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </button>
                <button
                  className="btn btn-sm btn-primary flex items-center gap-1"
                  onClick={() => handleAccept(invitation.tripId)}
                  disabled={processingInvites.has(invitation.tripId)}
                >
                  {processingInvites.has(invitation.tripId) ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Accept
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

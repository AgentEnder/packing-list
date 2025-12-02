import React, { useState } from 'react';
import { useAppDispatch, actions } from '@packing-list/state';
import { Modal } from '@packing-list/shared-components';
import { Mail, UserPlus, Info } from 'lucide-react';
import type { TripUserRole } from '@packing-list/model';
import { showToast } from './Toast';

interface TripInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripName: string;
}

export function TripInviteModal({
  isOpen,
  onClose,
  tripId,
  tripName,
}: TripInviteModalProps) {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TripUserRole>('editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await dispatch(actions.inviteUserToTrip({ tripId, email, role })).unwrap();

      showToast(result.message);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        // Reset form
        setEmail('');
        setRole('editor');
        setSuccess(false);
      }, 1500);

      // Reload trip members
      dispatch(actions.loadTripMembers(tripId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to send invitation'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      // Reset form
      setEmail('');
      setRole('editor');
      setError(null);
      setSuccess(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite User to Trip">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Invite someone to collaborate on &quot;{tripName}&quot;
          </p>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              disabled={isSubmitting || success}
              className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium mb-1">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as TripUserRole)}
            disabled={isSubmitting || success}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="editor">Editor - Can view and edit items</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Editors can pack/unpack items and manage trip contents
          </p>
        </div>


        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md text-sm">
            <Info className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md text-sm">
            <UserPlus className="h-4 w-4 flex-shrink-0" />
            <span>Invitation sent successfully!</span>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || success || !email}
            className="btn btn-primary flex items-center gap-2"
          >
            {isSubmitting ? (
              <>Sending...</>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Send Invitation
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

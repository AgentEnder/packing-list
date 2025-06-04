import { useEffect, useState } from 'react';
import { useAuth } from './useAuth.js';
import { useLoginModal } from './useLoginModal.js';
import {
  User,
  Mail,
  Shield,
  LogOut,
  Trash2,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { intervalToDuration } from 'date-fns';

interface UserManagementProps {
  onSignOut?: () => void;
  onAccountDeleted?: () => void;
  showToast?: (message: string) => void;
}

export function UserManagement({
  onSignOut,
  onAccountDeleted,
  showToast,
}: UserManagementProps) {
  const { user, signOut, deleteAccount, loading } = useAuth();
  const { openLoginModal } = useLoginModal();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [accountAge, setAccountAge] = useState<string | null>(null);

  const getAccountAge = () => {
    if (user?.created_at) {
      const created = new Date(user.created_at);
      const now = new Date();

      const duration = intervalToDuration({
        start: created,
        end: now,
      });

      const parts = [];
      if (duration.years && duration.years > 0) {
        parts.push(`${duration.years} year${duration.years === 1 ? '' : 's'}`);
      }
      if (duration.months && duration.months > 0) {
        parts.push(
          `${duration.months} month${duration.months === 1 ? '' : 's'}`
        );
      }
      if (duration.days && duration.days > 0) {
        parts.push(`${duration.days} day${duration.days === 1 ? '' : 's'}`);
      }
      if (duration.hours && duration.hours > 0) {
        parts.push(`${duration.hours} hour${duration.hours === 1 ? '' : 's'}`);
      }
      if (duration.minutes && duration.minutes > 0) {
        parts.push(
          `${duration.minutes} minute${duration.minutes === 1 ? '' : 's'}`
        );
      }
      if (duration.seconds && duration.seconds > 0) {
        parts.push(
          `${duration.seconds} second${duration.seconds === 1 ? '' : 's'}`
        );
      }

      return parts.join(', ');
    }
    return 'Unknown';
  };

  useEffect(() => {
    if (user?.created_at) {
      const fn = () => {
        const age = getAccountAge();
        setAccountAge(age);
      };
      fn(); // Initial call
      const interval = setInterval(fn, 1000);
      return () => clearInterval(interval);
    } else {
      setAccountAge(null);
      return () => {
        // no cleanup needed
      };
    }
  }, [user?.created_at]);

  if (!user) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">
            <User className="w-5 h-5" />
            Account
          </h2>
          <div className="alert alert-info">
            <Shield className="w-4 h-4" />
            <div>
              <h3 className="font-bold">Sign in to access more features</h3>
              <div className="text-sm">
                Create an account to sync your packing lists across devices and
                access additional features.
              </div>
            </div>
          </div>
          <div className="card-actions justify-end">
            <button className="btn btn-primary" onClick={openLoginModal}>
              Sign In / Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      showToast?.('Successfully signed out');
      onSignOut?.();
    } catch (error) {
      showToast?.('Error signing out. See console for details.');
      console.error(error);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      showToast?.('Please type "DELETE" to confirm account deletion');
      return;
    }

    setIsDeletingAccount(true);
    try {
      const { error } = await deleteAccount();
      if (error) {
        showToast?.(
          `Error deleting account: ${
            typeof error === 'object' && 'message' in error
              ? error.message
              : 'Unknown error'
          }`
        );
      } else {
        showToast?.('Account successfully deleted');
        onAccountDeleted?.();
      }
    } catch (error) {
      showToast?.('Error deleting account. See console for details.');
      console.error(error);
    }
    setIsDeletingAccount(false);
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">
          <User className="w-5 h-5" />
          Account Management
        </h2>
        <p className="text-base-content/70">
          Manage your account settings, security, and data.
        </p>

        {/* Account Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Account Information</h3>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-base-content/70" />
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm">{user.email}</span>
              </div>

              {user.name && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-base-content/70" />
                  <span className="text-sm font-medium">Name:</span>
                  <span className="text-sm">{user.name}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-base-content/70" />
                <span className="text-sm font-medium">Member for:</span>
                <span className="text-sm">{accountAge}</span>
              </div>

              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-base-content/70" />
                <span className="text-sm font-medium">User ID:</span>
                <span className="text-sm font-mono text-xs">{user.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="divider mt-8"></div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <button
            className={`btn btn-error btn-outline ${loading ? 'loading' : ''}`}
            onClick={handleSignOut}
            disabled={loading}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>

          <button
            className="btn btn-error"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-error">
              <AlertTriangle className="w-5 h-5 inline mr-2" />
              Delete Account
            </h3>

            <div className="py-4">
              <div className="alert alert-error mb-4">
                <AlertTriangle className="w-4 h-4" />
                <div>
                  <h4 className="font-bold">This action cannot be undone!</h4>
                  <div className="text-sm">
                    This will permanently delete your account and all associated
                    data including:
                  </div>
                </div>
              </div>

              <ul className="list-disc list-inside text-sm space-y-1 mb-4">
                <li>Your profile and account information</li>
                <li>All trip data and packing lists</li>
                <li>Saved preferences and settings</li>
                <li>Profile pictures and attachments</li>
              </ul>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">
                    Type <strong>DELETE</strong> to confirm:
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                />
              </div>
            </div>

            <div className="modal-action">
              <button
                className="btn"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
              >
                Cancel
              </button>
              <button
                className={`btn btn-error ${
                  isDeletingAccount ? 'loading' : ''
                }`}
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount || deleteConfirmText !== 'DELETE'}
              >
                {!isDeletingAccount && <Trash2 className="w-4 h-4" />}
                Delete Account
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowDeleteConfirm(false)}>close</button>
          </form>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useAuth } from '@packing-list/auth-state';
import type { LocalAuthUser } from '@packing-list/auth';

interface OfflinePasscodeFormProps {
  userId?: string;
  userEmail?: string;
}

export function OfflinePasscodeForm({
  userId,
  userEmail,
}: OfflinePasscodeFormProps) {
  const {
    user,
    hasOfflinePasscode,
    offlineAccounts,
    setOfflinePasscode,
    removeOfflinePasscode,
    isOfflineMode,
  } = useAuth();

  const [isChangingPasscode, setIsChangingPasscode] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [currentPasscodeForRemoval, setCurrentPasscodeForRemoval] =
    useState('');
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Use provided userId or current user's id
  const targetUserId = userId || user?.id;
  const targetUserEmail = userEmail || user?.email;

  // Find the offline account for this user
  const offlineAccount = (offlineAccounts as LocalAuthUser[]).find(
    (account: LocalAuthUser) =>
      account.id === targetUserId || account.email === targetUserEmail
  );

  const handleSetPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPasscode !== confirmPasscode) {
      setError('Passcodes do not match');
      return;
    }

    if (newPasscode.length < 4) {
      setError('Passcode must be at least 4 characters');
      return;
    }

    try {
      await setOfflinePasscode(
        currentPassword || undefined,
        newPasscode,
        targetUserId
      );
      setSuccess('Offline passcode set successfully');
      setIsChangingPasscode(false);
      setCurrentPassword('');
      setNewPasscode('');
      setConfirmPasscode('');
    } catch (error: any) {
      setError(error?.message || 'Failed to set passcode');
    }
  };

  const handleRemovePasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await removeOfflinePasscode(currentPasscodeForRemoval, targetUserId);
      setSuccess('Offline passcode removed successfully');
      setIsRemoving(false);
      setCurrentPasscodeForRemoval('');
    } catch (error: any) {
      setError(error?.message || 'Failed to remove passcode');
    }
  };

  if (!offlineAccount) {
    return (
      <div className="alert alert-info">
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current flex-shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>
            No offline account found. Sign in online first to create an offline
            account.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Offline Account Security</h2>
        <p className="text-sm text-base-content/70 mb-4">
          Manage passcode protection for your offline account ({targetUserEmail}
          )
        </p>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success mb-4">
            <span>{success}</span>
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Passcode Protection</h3>
              <p className="text-sm text-base-content/70">
                {hasOfflinePasscode
                  ? 'Passcode is enabled for this offline account'
                  : 'No passcode set - passwordless access enabled'}
              </p>
            </div>
            <div className="badge badge-lg">
              {hasOfflinePasscode ? 'Protected' : 'Unprotected'}
            </div>
          </div>
        </div>

        {!isChangingPasscode && !isRemoving && (
          <div className="flex gap-2">
            <button
              className="btn btn-primary"
              onClick={() => setIsChangingPasscode(true)}
            >
              {hasOfflinePasscode ? 'Change Passcode' : 'Set Passcode'}
            </button>

            {hasOfflinePasscode && (
              <button
                className="btn btn-outline btn-error"
                onClick={() => setIsRemoving(true)}
              >
                Remove Passcode
              </button>
            )}
          </div>
        )}

        {isChangingPasscode && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">
              {hasOfflinePasscode ? 'Change Passcode' : 'Set New Passcode'}
            </h4>
            <form onSubmit={handleSetPasscode} className="space-y-4">
              {!isOfflineMode && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">
                      Current Password (for verification)
                    </span>
                  </label>
                  <input
                    type="password"
                    className="input input-bordered"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Your current online password"
                  />
                </div>
              )}

              <div className="form-control">
                <label className="label">
                  <span className="label-text">New Passcode</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered"
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value)}
                  placeholder="Enter 4+ digit passcode"
                  required
                  minLength={4}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Confirm Passcode</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered"
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value)}
                  placeholder="Confirm your passcode"
                  required
                  minLength={4}
                />
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary">
                  {hasOfflinePasscode ? 'Update Passcode' : 'Set Passcode'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setIsChangingPasscode(false);
                    setCurrentPassword('');
                    setNewPasscode('');
                    setConfirmPasscode('');
                    setError(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {isRemoving && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Remove Passcode Protection</h4>
            <p className="text-sm text-warning mb-4">
              Warning: Removing passcode protection will allow passwordless
              access to this offline account.
            </p>
            <form onSubmit={handleRemovePasscode} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Current Passcode</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered"
                  value={currentPasscodeForRemoval}
                  onChange={(e) => setCurrentPasscodeForRemoval(e.target.value)}
                  placeholder="Enter current passcode"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn btn-error">
                  Remove Passcode
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setIsRemoving(false);
                    setCurrentPasscodeForRemoval('');
                    setError(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

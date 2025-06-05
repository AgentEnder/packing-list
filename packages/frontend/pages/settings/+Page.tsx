import { useAppDispatch } from '@packing-list/state';
import {
  UserManagement,
  OfflinePasscodeForm,
  useAuth,
} from '@packing-list/shared-components';
import { PageContainer } from '../../components/PageContainer';
import { PageHeader } from '../../components/PageHeader';
import {
  Settings,
  AlertTriangle,
  EyeOff,
  Calendar,
  Wifi,
  WifiOff,
  Shield,
  Users,
} from 'lucide-react';
import { showToast } from '../../components/Toast';
import { HELP_ALL_KEY } from '../../components/HelpBlurb';

// Simple interface to type offline accounts
interface OfflineAccount {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  passcode_hash?: string;
}

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, offlineAccounts, isOfflineMode, isOnline } =
    useAuth();

  // Cast offlineAccounts to proper type since useAuth returns unknown[]
  const typedOfflineAccounts = (offlineAccounts || []) as OfflineAccount[];

  const handleResetHelpBlurbs = () => {
    localStorage.removeItem(HELP_ALL_KEY);
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('help-')) localStorage.removeItem(key);
    }
    showToast('Help messages have been reset');
  };

  const handleHideAllHelp = () => {
    localStorage.setItem(HELP_ALL_KEY, 'hidden');
    showToast('All help messages have been hidden');
  };

  const handleLoadDemo = () => {
    sessionStorage.setItem('session-demo-choice', 'demo');
    dispatch({ type: 'LOAD_DEMO_DATA' });
    showToast('Demo data has been loaded');
  };

  return (
    <PageContainer>
      <PageHeader title="Settings" />

      <div className="space-y-4">
        {/* Connection Status */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="card-title flex items-center gap-2">
                  {isOnline ? (
                    <Wifi className="w-5 h-5 text-success" />
                  ) : (
                    <WifiOff className="w-5 h-5 text-error" />
                  )}
                  Connection Status
                </h2>
                <p className="text-base-content/70">
                  {isOnline
                    ? 'Connected to the internet'
                    : 'Offline mode active'}
                  {isOfflineMode && ' - Using offline authentication'}
                </p>
              </div>
              <div
                className={`badge badge-lg ${
                  isOnline ? 'badge-success' : 'badge-error'
                }`}
              >
                {isOnline ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
        </div>

        {/* Offline Account Management */}
        {isAuthenticated && (
          <div className="space-y-4">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Offline Accounts
                </h2>
                <p className="text-base-content/70 mb-4">
                  Manage your offline accounts and their security settings.
                  Offline accounts allow you to use the app without an internet
                  connection.
                </p>

                {typedOfflineAccounts.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="font-semibold">
                      Available Offline Accounts:
                    </h3>
                    <div className="grid gap-2">
                      {typedOfflineAccounts.map((account) => (
                        <div
                          key={account.id}
                          className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="avatar placeholder">
                              <div className="bg-neutral text-neutral-content w-8 h-8 rounded-full">
                                <span className="text-xs">
                                  {account.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">
                                {account.name || account.email}
                              </div>
                              <div className="text-sm text-base-content/70">
                                {account.email}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {account.passcode_hash ? (
                              <div className="badge badge-success gap-1">
                                <Shield className="w-3 h-3" />
                                Protected
                              </div>
                            ) : (
                              <div className="badge badge-warning gap-1">
                                <Shield className="w-3 h-3" />
                                Unprotected
                              </div>
                            )}
                            {account.id === user?.id && (
                              <div className="badge badge-primary">Current</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-info">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      <span>
                        No offline accounts found. Sign in online to create an
                        offline account automatically.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Offline Passcode Management */}
            {user && <OfflinePasscodeForm />}
          </div>
        )}

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Help & Tutorials</h2>
            <p className="text-base-content/70">
              Manage help messages and tutorials that appear throughout the app.
            </p>
            <div className="card-actions justify-end gap-2">
              <button
                className="btn btn-primary"
                onClick={handleResetHelpBlurbs}
              >
                <Settings className="w-4 h-4" />
                Reset Help Messages
              </button>
              <button className="btn" onClick={handleHideAllHelp}>
                <EyeOff className="w-4 h-4" />
                Hide All Help
              </button>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl space-y-4">
          <div className="card-body">
            <h2 className="card-title">Demo Data</h2>
            <p className="text-base-content/70">
              Load the demo trip data to see how the app works with a sample
              trip.
            </p>
            <div className="alert alert-warning mb-4">
              <AlertTriangle className="w-4 h-4" />
              <span>
                Loading demo data will replace your current trip data.
              </span>
            </div>
            <div className="card-actions justify-end">
              <button className="btn btn-primary" onClick={handleLoadDemo}>
                <Calendar className="w-4 h-4" />
                Load Demo Data
              </button>
            </div>
          </div>
        </div>

        {/* User Management Component */}
        {isAuthenticated && (
          <UserManagement
            showToast={showToast}
            onAccountDeleted={() => {
              // Redirect to home after account deletion
              window.location.href = '/';
            }}
          />
        )}
      </div>
    </PageContainer>
  );
}

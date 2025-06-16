import { useAppDispatch } from '@packing-list/state';
import {
  UserManagement,
  OfflinePasscodeForm,
  Avatar,
  useAuth,
} from '@packing-list/shared-components';
import { PageContainer } from '../../components/PageContainer';
import { PageHeader } from '../../components/PageHeader';
import { ServiceWorkerStatus } from '../../components/ServiceWorkerStatus';
import {
  Settings,
  AlertTriangle,
  EyeOff,
  Calendar,
  Wifi,
  WifiOff,
  Shield,
  Users,
  Bug,
  Activity,
  User,
} from 'lucide-react';
import { showToast } from '../../components/Toast';
import { HELP_ALL_KEY } from '../../components/HelpBlurb';
import { useEffect, useState } from 'react';
import { SyncDashboard } from '../../components/SyncDashboard.js';
import { DatabaseResetUtility } from '../../components/DatabaseResetUtility';
import { navigate } from 'vike/client/router';
import { useUrlHash } from '../../hooks/useUrlHash';

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
  const {
    user,
    isAuthenticated,
    offlineAccounts,
    isOfflineMode,
    isOnline,
    forceOfflineMode,
    isConnected,
    authStatus,
    connectivityStatus,
    loading: authLoading,
    isInitialized: authIsInitialized,
  } = useAuth();

  // Use URL hash for tab state management
  const { hash, setHash } = useUrlHash('settings');
  const [activeTab, setActiveTab] = useState<
    'settings' | 'account' | 'debug' | 'sync'
  >('settings');

  useEffect(() => {
    if (hash) {
      setActiveTab(hash as 'settings' | 'account' | 'debug' | 'sync');
    }
  }, [hash]);

  // Debug auth state on settings page
  useEffect(() => {
    console.log('🔍 [SETTINGS DEBUG] Auth state on settings page:', {
      authLoading,
      authIsInitialized,
      isAuthenticated,
      user: user ? { id: user.id, email: user.email } : null,
      authStatus,
      connectivityStatus,
    });
  }, [
    authLoading,
    authIsInitialized,
    isAuthenticated,
    user,
    authStatus,
    connectivityStatus,
  ]);

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

      {/* Tab Navigation */}
      <div className="tabs tabs-boxed mb-6">
        <button
          className={`tab ${activeTab === 'settings' ? 'tab-active' : ''}`}
          onClick={() => setHash('settings')}
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </button>
        <button
          className={`tab ${activeTab === 'account' ? 'tab-active' : ''}`}
          onClick={() => setHash('account')}
        >
          <User className="w-4 h-4 mr-2" />
          Account
        </button>
        <button
          className={`tab ${activeTab === 'sync' ? 'tab-active' : ''}`}
          onClick={() => setHash('sync')}
        >
          <Activity className="w-4 h-4 mr-2" />
          Sync Dashboard
        </button>
        <button
          className={`tab ${activeTab === 'debug' ? 'tab-active' : ''}`}
          onClick={() => setHash('debug')}
        >
          <Bug className="w-4 h-4 mr-2" />
          Debug & Status
        </button>
      </div>

      {/* Settings Tab Content */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          {/* Help & Tutorials */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Help & Tutorials</h2>
              <p className="text-base-content/70">
                Manage help messages and tutorials that appear throughout the
                app.
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

          {/* Demo Data */}
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
        </div>
      )}

      {/* Account Tab Content */}
      {activeTab === 'account' && (
        <div className="space-y-4">
          {isAuthenticated ? (
            <>
              {/* User Management Component */}
              <UserManagement
                showToast={showToast}
                onAccountDeleted={() => {
                  // Redirect to home after account deletion
                  navigate('/');
                }}
              />

              {/* Offline Account Management */}
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Offline Accounts
                  </h2>
                  <p className="text-base-content/70 mb-4">
                    Manage your offline accounts and their security settings.
                    Offline accounts allow you to use the app without an
                    internet connection.
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
                              <div className="avatar">
                                <Avatar
                                  src={account.avatar_url}
                                  alt={account.name || account.email}
                                  size={32}
                                  isOnline={isOnline}
                                  showOfflineIndicator={false}
                                />
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
                                <div className="badge badge-primary">
                                  Current
                                </div>
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
            </>
          ) : (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body text-center">
                <User className="w-16 h-16 mx-auto text-base-content/50 mb-4" />
                <h2 className="card-title justify-center">Not Signed In</h2>
                <p className="text-base-content/70 mb-4">
                  You need to be signed in to manage your account settings.
                </p>
                <div className="card-actions justify-center">
                  <a href="/login" className="btn btn-primary">
                    Sign In
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sync Dashboard Tab Content */}
      {activeTab === 'sync' && (
        <div className="space-y-4">
          <SyncDashboard />
        </div>
      )}

      {/* Debug & Status Tab Content */}
      {activeTab === 'debug' && (
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

              {/* Detailed Auth State Debug */}
              <div className="mt-4 p-4 bg-base-200 rounded-lg">
                <h3 className="font-medium mb-2">Auth State Debug</h3>
                <div className="text-sm space-y-1">
                  <div>
                    <strong>isOnline:</strong> {String(isOnline)}
                  </div>
                  <div>
                    <strong>isOfflineMode:</strong> {String(isOfflineMode)}
                  </div>
                  <div>
                    <strong>forceOfflineMode:</strong>{' '}
                    {String(forceOfflineMode)}
                  </div>
                  <div>
                    <strong>isConnected:</strong> {String(isConnected)}
                  </div>
                  <div>
                    <strong>Navigator Online:</strong>{' '}
                    {String(
                      typeof navigator !== 'undefined'
                        ? navigator.onLine
                        : 'N/A'
                    )}
                  </div>
                  <div>
                    <strong>User Type:</strong> {user?.type || 'None'}
                  </div>
                  <div>
                    <strong>User Email:</strong> {user?.email || 'None'}
                  </div>
                  <div>
                    <strong>Is Shared:</strong> {String(user?.isShared)}
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => {
                      console.log('🔍 Full Auth State:', {
                        isOnline,
                        isOfflineMode,
                        forceOfflineMode,
                        isConnected,
                        navigatorOnline: navigator.onLine,
                        user,
                        authStatus,
                        connectivityStatus,
                      });
                    }}
                  >
                    Log Full State to Console
                  </button>

                  {forceOfflineMode && (
                    <button
                      className="btn btn-sm btn-warning"
                      onClick={() => {
                        console.log('🔧 Clearing force offline mode...');
                        dispatch({
                          type: 'auth/setForceOfflineMode',
                          payload: false,
                        });
                        dispatch({ type: 'auth/switchToOnlineMode' });
                        showToast('Force offline mode disabled');
                      }}
                    >
                      Clear Force Offline
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Service Worker Status */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <ServiceWorkerStatus />
            </div>
          </div>

          {/* Database Reset Utility */}
          <DatabaseResetUtility />

          {/* System Information */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title flex items-center gap-2">
                <Activity className="w-5 h-5" />
                System Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-base-200 p-3 rounded">
                  <h4 className="font-medium mb-2">Browser</h4>
                  <div className="space-y-1 text-sm">
                    <div>
                      <strong>User Agent:</strong>{' '}
                      {navigator.userAgent.split(' ')[0]}
                    </div>
                    <div>
                      <strong>Language:</strong> {navigator.language}
                    </div>
                    <div>
                      <strong>Platform:</strong> {navigator.platform}
                    </div>
                    <div>
                      <strong>Cookies Enabled:</strong>{' '}
                      {navigator.cookieEnabled ? '✅' : '❌'}
                    </div>
                  </div>
                </div>

                <div className="bg-base-200 p-3 rounded">
                  <h4 className="font-medium mb-2">Storage</h4>
                  <div className="space-y-1 text-sm">
                    <div>
                      <strong>Local Storage:</strong>{' '}
                      {typeof localStorage !== 'undefined' ? '✅' : '❌'}
                    </div>
                    <div>
                      <strong>Session Storage:</strong>{' '}
                      {typeof sessionStorage !== 'undefined' ? '✅' : '❌'}
                    </div>
                    <div>
                      <strong>IndexedDB:</strong>{' '}
                      {typeof indexedDB !== 'undefined' ? '✅' : '❌'}
                    </div>
                    <div>
                      <strong>Service Workers:</strong>{' '}
                      {'serviceWorker' in navigator ? '✅' : '❌'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    const info = {
                      userAgent: navigator.userAgent,
                      language: navigator.language,
                      platform: navigator.platform,
                      online: navigator.onLine,
                      cookiesEnabled: navigator.cookieEnabled,
                      localStorage: typeof localStorage !== 'undefined',
                      sessionStorage: typeof sessionStorage !== 'undefined',
                      indexedDB: typeof indexedDB !== 'undefined',
                      serviceWorker: 'serviceWorker' in navigator,
                      timestamp: new Date().toISOString(),
                    };
                    navigator.clipboard?.writeText(
                      JSON.stringify(info, null, 2)
                    );
                    showToast('System info copied to clipboard');
                  }}
                >
                  Copy System Info
                </button>

                <a
                  href="/version"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline"
                >
                  View Build Info
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

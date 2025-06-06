import { useState } from 'react';
import { useAuth } from './useAuth.js';
import { LocalAccountSelector } from './LocalAccountSelector.js';
import { EmailPasswordForm } from './EmailPasswordForm.js';

interface LocalAccount {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  passcode_hash?: string;
}

export function LoginForm() {
  const {
    signInWithGooglePopup,
    signInOfflineWithoutPassword,
    loading,
    error,
    isOfflineMode,
    isConnected,
    shouldShowSignInOptions,
    user,
    offlineAccounts,
  } = useAuth();
  const [showLocalForm, setShowLocalForm] = useState(false);
  const [showEmailPasswordForm, setShowEmailPasswordForm] = useState(false);
  const [emailPasswordMode, setEmailPasswordMode] = useState<
    'signin' | 'signup'
  >('signin');
  const [localMode, setLocalMode] = useState<'signin' | 'signup'>('signin');

  // Cast offlineAccounts to proper type since useAuth returns unknown[]
  const typedOfflineAccounts = (offlineAccounts || []) as LocalAccount[];

  // If user is signed in and not using shared account, don't show this form
  if (user && !shouldShowSignInOptions) {
    return (
      <div className="text-center">
        <p className="text-base-content/70">
          You're already signed in as {user.name || user.email}
        </p>
      </div>
    );
  }

  const handleGoogleSignIn = async () => {
    console.log('🚀 [MAIN WINDOW] Starting Google popup sign-in');
    console.log('🚀 [MAIN WINDOW] isConnected:', isConnected);
    console.log('🚀 [MAIN WINDOW] isOfflineMode:', isOfflineMode);

    try {
      const result = await signInWithGooglePopup();

      // Check if the thunk was rejected
      if (result.type.endsWith('/rejected')) {
        const errorMessage =
          (result.payload as string) || 'Google sign-in failed';
        console.error('🚀 [MAIN WINDOW] Google sign-in error:', errorMessage);
      } else {
        console.log('🚀 [MAIN WINDOW] Google sign-in successful');
      }
    } catch (error) {
      console.error('🚀 [MAIN WINDOW] Exception during Google sign-in:', error);
    }
  };

  const handleLocalAccountSelect = async (account: LocalAccount) => {
    console.log(
      '🚀 [MAIN WINDOW] Signing in with local account:',
      account.email
    );

    try {
      const result = await signInOfflineWithoutPassword(account.email);

      // Check if the thunk was rejected
      if (result.type.endsWith('/rejected')) {
        const errorMessage =
          (result.payload as string) || 'Local sign-in failed';
        console.error('🚀 [MAIN WINDOW] Local sign-in error:', errorMessage);
      } else {
        console.log('🚀 [MAIN WINDOW] Local sign-in successful');
      }
    } catch (error) {
      console.error('🚀 [MAIN WINDOW] Exception during local sign-in:', error);
    }
  };

  const handleCreateNewAccount = () => {
    setShowLocalForm(true);
    setLocalMode('signup');
  };

  const handleEmailPasswordSuccess = () => {
    setShowEmailPasswordForm(false);
  };

  const handleEmailPasswordModeToggle = () => {
    setEmailPasswordMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
  };

  // Show email/password form
  if (showEmailPasswordForm) {
    return (
      <EmailPasswordForm
        mode={emailPasswordMode}
        onModeToggle={handleEmailPasswordModeToggle}
        onBack={() => setShowEmailPasswordForm(false)}
        onSuccess={handleEmailPasswordSuccess}
      />
    );
  }

  // If offline, show local account selector
  if (isOfflineMode) {
    if (showLocalForm) {
      return (
        <div className="text-center">
          <h3 className="text-lg font-medium text-base-content">
            {localMode === 'signup'
              ? 'Create Local Account'
              : 'Sign In Locally'}
          </h3>
          <p className="text-sm text-base-content/70 mt-2">
            Create a local account that works offline
          </p>
          {/* LocalAccountForm component would go here when it's available */}
          <div className="alert alert-info mt-4">
            <span>Local account creation form coming soon...</span>
          </div>
          <button
            className="btn btn-outline mt-4"
            onClick={() => setShowLocalForm(false)}
          >
            Back to Account Selection
          </button>
        </div>
      );
    }

    return (
      <LocalAccountSelector
        accounts={typedOfflineAccounts}
        onAccountSelect={handleLocalAccountSelect}
        onCreateNew={handleCreateNewAccount}
        loading={loading}
        error={error}
      />
    );
  }

  // If user explicitly wants local account (but online)
  if (showLocalForm) {
    return (
      <div className="text-center">
        <h3 className="text-lg font-medium text-base-content">
          {localMode === 'signup' ? 'Create Local Account' : 'Sign In Locally'}
        </h3>
        <p className="text-sm text-base-content/70 mt-2">
          Create or sign in with a local account that works offline
        </p>
        {/* LocalAccountForm component would go here when it's available */}
        <div className="alert alert-info mt-4">
          <span>Local account form coming soon...</span>
        </div>
        <button
          className="btn btn-outline mt-4"
          onClick={() => setShowLocalForm(false)}
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 relative">
      <div className="text-center">
        <h3 className="text-lg font-medium text-base-content">
          Sign in to your account
        </h3>
        <p className="text-sm text-base-content/70 mt-2">
          Continue with your Google account to access all features
        </p>
      </div>

      {error && (
        <div className="alert alert-error w-full">
          <span>{error}</span>
        </div>
      )}

      {/* Connection status indicator */}
      {!isConnected && (
        <div className="alert alert-warning w-full">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-sm">
              Limited connectivity - some features may not work
            </span>
          </div>
        </div>
      )}

      <div className="relative w-full">
        <button
          type="button"
          className={`btn btn-primary btn-lg w-full ${
            loading ? 'loading' : ''
          }`}
          onClick={handleGoogleSignIn}
          disabled={loading || !isConnected}
        >
          {!loading && (
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        {/* Custom loading overlay for better visibility in modals */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-base-100/80 rounded-lg z-50">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        )}
      </div>

      <div className="divider">OR</div>

      {/* Local account option */}
      <button
        type="button"
        className="btn btn-outline btn-sm w-full"
        onClick={() => setShowLocalForm(true)}
      >
        Use Local Account (Works Offline)
      </button>

      <div className="text-center space-y-2">
        <p className="text-xs text-base-content/60">
          By signing in, you agree to our terms of service and privacy policy
        </p>
        <button
          type="button"
          className="link link-primary text-xs opacity-70 hover:opacity-100"
          onClick={() => {
            setEmailPasswordMode('signin');
            setShowEmailPasswordForm(true);
          }}
          disabled={loading || !isConnected}
        >
          Or sign in with email instead
        </button>
      </div>
    </div>
  );
}

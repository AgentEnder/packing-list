import { useEffect, useState } from 'react';
import { useAuth } from '@packing-list/shared-components';
import { Link } from '../../../components/Link';

export default function AuthCallback() {
  const { user, error } = useAuth();
  const [countdown, setCountdown] = useState(3);
  const [isPopup, setIsPopup] = useState(false);

  useEffect(() => {
    // Check if we're in a popup window
    const isInPopup = window.opener && window.opener !== window;
    setIsPopup(isInPopup);

    if (isInPopup) {
      // We're in a popup - close it when auth completes
      if (user || error) {
        // Give a brief moment for state to settle, then close
        setTimeout(() => {
          window.close();
        }, 1000);
      }
    } else {
      // Regular page behavior - redirect after successful auth
      if (user) {
        // Start countdown before redirect
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              window.location.href = '/';
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      }
    }
  }, [user, error]);

  // If we're in a popup, show minimal UI
  if (isPopup) {
    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-base-200">
          <div className="card w-full max-w-md shadow-2xl bg-base-100">
            <div className="card-body text-center">
              <div className="text-error text-4xl mb-4">⚠️</div>
              <h2 className="card-title justify-center text-error text-lg">
                Authentication Failed
              </h2>
              <p className="text-sm text-base-content/70 mb-4">{error}</p>
              <p className="text-xs text-base-content/50">
                This window will close automatically...
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (user) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-base-200">
          <div className="card w-full max-w-md shadow-2xl bg-base-100">
            <div className="card-body text-center">
              <div className="text-success text-4xl mb-4">✅</div>
              <h2 className="card-title justify-center text-success text-lg">
                Success!
              </h2>
              <p className="text-sm text-base-content/70 mb-4">
                Welcome, {user.name || user.email}!
              </p>
              <p className="text-xs text-base-content/50">Closing window...</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="card w-full max-w-md shadow-2xl bg-base-100">
          <div className="card-body text-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <h2 className="card-title justify-center text-lg">
              Completing Authentication
            </h2>
            <p className="text-sm text-base-content/70">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  // Regular page behavior (not in popup)
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="card w-full max-w-md shadow-2xl bg-base-100">
          <div className="card-body text-center">
            <div className="text-error text-6xl mb-4">⚠️</div>
            <h2 className="card-title justify-center text-error">
              Authentication Failed
            </h2>
            <p className="text-base-content/70 mb-4">{error}</p>
            <div className="card-actions justify-center">
              <Link href="/login" className="btn btn-primary">
                Try Again
              </Link>
              <Link href="/" className="btn btn-outline">
                Continue as Guest
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="card w-full max-w-md shadow-2xl bg-base-100">
          <div className="card-body text-center">
            <div className="text-success text-6xl mb-4">✅</div>
            <h2 className="card-title justify-center text-success">
              Authentication Successful!
            </h2>
            <p className="text-base-content/70 mb-4">
              Welcome back, {user.name || user.email}!
            </p>
            <p className="text-sm text-base-content/50">
              Redirecting to the app in {countdown} second
              {countdown !== 1 ? 's' : ''}...
            </p>
            <div className="card-actions justify-center mt-4">
              <Link href="/" className="btn btn-primary">
                Go to App Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-md shadow-2xl bg-base-100">
        <div className="card-body text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <h2 className="card-title justify-center">
            Completing Authentication
          </h2>
          <p className="text-base-content/70">
            Please wait while we complete your sign-in...
          </p>
        </div>
      </div>
    </div>
  );
}

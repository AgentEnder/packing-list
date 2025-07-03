import './tailwind.css';
import './style.css';
import React, { useState, useEffect, useRef } from 'react';
// import logoUrl from '../assets/logo.svg';
import { DemoBanner } from '../components/DemoBanner';
import { DevModeBannerContainer } from '../components/DevModeBannerContainer';
import { ToastContainer } from '../components/Toast';
import { ConfettiBurst } from '../components/ConfettiBurst';
import { TripSelector } from '../components/TripSelector';
import { useTheme } from '../hooks/useTheme';

import { useConflictBanner } from '../hooks/useConflictBanner';
import {
  useAuth,
  useAuthInitializer,
  useLoginModal,
  UserProfile,
  LoginModal,
  ConflictBanner,
  BannerProvider,
  OfflineBanner,
  useBannerHeight,
  Link,
  SyncStatusIndicator,
} from '@packing-list/shared-components';
import {
  Menu,
  Home,
  Users,
  Calendar,
  ClipboardList,
  CheckSquare,
  Settings,
  LogIn,
} from 'lucide-react';
import { RulePackModal } from '../components/RulePackModal';
import { useAppDispatch, useAppSelector, actions } from '@packing-list/state';
import { navigate } from 'vike/client/router';
import { applyBaseUrl } from '@packing-list/shared-utils';

// Component that needs to be inside SyncProvider to access sync state
const ConflictBannerContainer: React.FC = () => {
  const { conflicts, shouldShowBanner, handleViewConflicts, handleDismiss } =
    useConflictBanner();

  if (!shouldShowBanner) {
    return null;
  }

  return (
    <ConflictBanner
      conflicts={conflicts}
      onViewConflicts={handleViewConflicts}
      onDismiss={handleDismiss}
    />
  );
};

// Component to handle offline detection and banner display
const OfflineBannerContainer: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Initial check
    if (typeof window !== 'undefined') {
      const initialOfflineState = !navigator.onLine;
      console.log(
        '🔍 [OFFLINE BANNER] Initial state - navigator.onLine:',
        navigator.onLine,
        'isOffline:',
        initialOfflineState
      );
      setIsOffline(initialOfflineState);

      // Listen for online/offline events
      const handleOnline = () => {
        console.log('🌐 [OFFLINE BANNER] Network came online');
        setIsOffline(false);
      };

      const handleOffline = () => {
        console.log('📡 [OFFLINE BANNER] Network went offline');
        setIsOffline(true);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return <OfflineBanner isOffline={isOffline} />;
};

// Component to apply banner height as bottom padding to main content
interface MainContentProps {
  children: React.ReactNode;
}

const MainContentWithBannerOffset = ({ children }: MainContentProps) => {
  const bannerHeight = useBannerHeight();

  return (
    <main
      className="flex-1 p-4"
      style={{ paddingBottom: `${Math.max(24, bannerHeight + 24)}px` }}
    >
      {children}
    </main>
  );
};

// Component to apply banner height as bottom padding to sidenav
interface SidenavProps {
  children: React.ReactNode;
}

const SidenavWithBannerOffset = ({ children }: SidenavProps) => {
  const bannerHeight = useBannerHeight();

  return (
    <div
      className="menu p-4 w-80 min-h-full bg-base-200 text-base-content flex flex-col"
      style={{ paddingBottom: `${Math.max(16, bannerHeight + 16)}px` }}
    >
      {children}
    </div>
  );
};

export default function LayoutDefault({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const dispatch = useAppDispatch();
  const previousPathRef = useRef<string | null>(null);

  // Initialize auth at app level - this should only happen once
  useAuthInitializer();

  // Auth and login modal
  const {
    user,
    loading: authLoading,
    isRemotelyAuthenticated,
    shouldShowSignInOptions,
    isInitialized: authIsInitialized,
    authStatus,
  } = useAuth();
  const { openLoginModal, closeLoginModal } = useLoginModal();

  // Get current flow state
  const flowStepHref = useAppSelector((state) =>
    state.ui.flow.current !== null
      ? state.ui.flow.steps[state.ui.flow.current]?.path
      : null
  );

  // Flow reset logic - reset flow when path changes or doesn't match current flow
  const path = typeof window !== 'undefined' ? window.location.pathname : null;
  useEffect(() => {
    if (path === previousPathRef.current) {
      return;
    }

    if (typeof window !== 'undefined') {
      if (flowStepHref && path !== flowStepHref) {
        dispatch(actions.resetFlow(`${path} -> ${flowStepHref}`));
      }
    }
    previousPathRef.current = path;
  }, [path, flowStepHref, dispatch]);

  // Debug auth loading state
  useEffect(() => {
    console.log('🔍 [LAYOUT DEBUG] Auth state:', {
      authLoading,
      authIsInitialized,
      user: user ? { id: user.id, email: user.email } : null,
      authStatus,
      pathname: window.location.pathname,
    });
  }, [authLoading, authIsInitialized, user, authStatus]);

  // Close login modal when user becomes remotely authenticated
  useEffect(() => {
    if (isRemotelyAuthenticated) {
      closeLoginModal();
    }
  }, [isRemotelyAuthenticated, closeLoginModal]);

  const syncState = useAppSelector((state) => state.sync.syncState);

  const handleLinkClick = () => {
    setIsDrawerOpen(false);
  };

  const handleLoginClick = () => {
    openLoginModal();
  };

  // Initialize theme management
  useTheme();

  return (
    <BannerProvider>
      <div className="drawer lg:drawer-open">
        <input
          id="drawer"
          type="checkbox"
          className="drawer-toggle"
          checked={isDrawerOpen}
          onChange={(e) => setIsDrawerOpen(e.target.checked)}
        />
        <div className="drawer-content flex flex-col min-h-screen z-1">
          {/* Navbar */}
          <div className="navbar bg-base-100 lg:hidden">
            <div className="flex-none">
              <label
                htmlFor="drawer"
                className="btn btn-square btn-ghost drawer-button"
              >
                <Menu className="w-5 h-5 stroke-current" />
              </label>
            </div>
            <div className="flex-1 flex items-center gap-2">
              {/* <Link
                href="/"
                className="btn btn-ghost normal-case text-xl"
                onClick={handleLinkClick}
              >
                Packing List
              </Link> */}
              <TripSelector />
            </div>
            <div className="flex-none flex items-center gap-2">
              <SyncStatusIndicator
                syncState={syncState}
                onClick={() =>
                  navigate(
                    applyBaseUrl(
                      import.meta.env.PUBLIC_ENV__BASE_URL,
                      '/settings#sync'
                    )
                  )
                }
              />
              {shouldShowSignInOptions ? (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleLoginClick}
                  data-testid="sign-in-button"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              ) : (
                <UserProfile />
              )}
            </div>
          </div>

          {/* Main content with banner offset */}
          <MainContentWithBannerOffset>{children}</MainContentWithBannerOffset>

          {/* Toast Container */}
          <ToastContainer />
          <ConfettiBurst />
        </div>

        {/* Sidebar */}
        <div className="drawer-side">
          <label htmlFor="drawer" className="drawer-overlay"></label>
          <SidenavWithBannerOffset>
            {/* Top Header - Only Title and User Profile */}
            <div className="hidden lg:flex mb-8 justify-between items-center">
              <Link
                href="./"
                className="btn btn-ghost normal-case text-xl"
                onClick={handleLinkClick}
              >
                Packing List
              </Link>
              <div className="flex items-center">
                {shouldShowSignInOptions ? (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleLoginClick}
                    data-testid="sign-in-button"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                ) : (
                  <UserProfile />
                )}
              </div>
            </div>

            {/* Trip Selector for Desktop */}
            <div className="hidden lg:block mb-4">
              <TripSelector />
            </div>

            {/* Navigation Menu - Flex grow to fill space */}
            <ul className="menu menu-lg gap-2 flex-1">
              <li>
                <Link
                  href="/"
                  className="flex items-center gap-2"
                  onClick={handleLinkClick}
                >
                  <Home className="w-5 h-5" />
                  Overview
                </Link>
              </li>
              <li>
                <Link
                  href="/people"
                  className="flex items-center gap-2"
                  onClick={handleLinkClick}
                >
                  <Users className="w-5 h-5" />
                  People
                </Link>
              </li>
              <li>
                <Link
                  href="/days"
                  className="flex items-center gap-2"
                  onClick={handleLinkClick}
                >
                  <Calendar className="w-5 h-5" />
                  Days
                </Link>
              </li>
              <li>
                <Link
                  href="/defaults"
                  className="flex items-center gap-2"
                  onClick={handleLinkClick}
                >
                  <ClipboardList className="w-5 h-5" />
                  Default Items
                </Link>
              </li>
              <li>
                <Link
                  href="/packing-list"
                  className="flex items-center gap-2"
                  onClick={handleLinkClick}
                >
                  <CheckSquare className="w-5 h-5" />
                  Packing List
                </Link>
              </li>
              <div className="divider"></div>
              <li>
                <Link
                  href="/settings"
                  className="flex items-center gap-2"
                  onClick={handleLinkClick}
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </Link>
              </li>
            </ul>

            {/* Sync Status at Bottom */}
            <div className="mt-4 p-2 bg-base-300 rounded-lg">
              <SyncStatusIndicator
                syncState={syncState}
                onClick={() =>
                  navigate(
                    applyBaseUrl(
                      import.meta.env.PUBLIC_ENV__BASE_URL,
                      '/settings#sync'
                    )
                  )
                }
              />
            </div>
          </SidenavWithBannerOffset>
        </div>

        {/* Redux Based Modals */}
        <LoginModal />
        <RulePackModal />
      </div>

      {/* Banner Components - Order matters for priority */}
      <DevModeBannerContainer />
      <OfflineBannerContainer />
      <DemoBanner />
      <ConflictBannerContainer />
    </BannerProvider>
  );
}

// function Logo({ className = '' }: { className?: string }) {
//   return (
//     <div className={`mb-2 ${className}`}>
//       <a href="/">
//         <img src={logoUrl} height={64} width={64} alt="logo" />
//       </a>
//     </div>
//   );
// }

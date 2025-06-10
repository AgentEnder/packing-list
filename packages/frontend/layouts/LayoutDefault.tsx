import './tailwind.css';
import './style.css';
import { useState, useEffect, useRef } from 'react';
// import logoUrl from '../assets/logo.svg';
import { Link } from '../components/Link';
import { DemoBanner } from '../components/DemoBanner';
import { ToastContainer } from '../components/Toast';
import { TripSelector } from '../components/TripSelector';
import { SyncProvider } from '../components/SyncProvider';
import { SyncStatus } from '../components/SyncStatus';
import { useConflictBanner } from '../hooks/useConflictBanner';
import {
  actions,
  useAppDispatch,
  useAppSelector,
  loadOfflineState,
  type StoreType,
} from '@packing-list/state';
import {
  useAuth,
  useLoginModal,
  UserProfile,
  LoginModal,
  ConflictBanner,
  BannerProvider,
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
  Zap,
} from 'lucide-react';
import { RulePackModal } from '../components/RulePackModal';

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

export default function LayoutDefault({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const {
    user,
    shouldShowSignInOptions,
    loading,
    isRemotelyAuthenticated,
    isInitialized,
  } = useAuth();
  const dispatch = useAppDispatch();
  const flowStepHref = useAppSelector((state) =>
    state.ui.flow.current !== null
      ? state.ui.flow.steps[state.ui.flow.current]?.path
      : null
  );

  const { openLoginModal, closeLoginModal } = useLoginModal();
  const dataHydratedRef = useRef(false);

  // Hydrate offline data when user is available and auth is initialized
  useEffect(() => {
    const hydrateData = async () => {
      if (
        typeof window !== 'undefined' &&
        user &&
        isInitialized &&
        !dataHydratedRef.current &&
        !loading
      ) {
        try {
          console.log('🔄 [LAYOUT] Hydrating offline data for user:', user.id);
          const offlineState = await loadOfflineState(user.id);
          dispatch({ type: 'HYDRATE_OFFLINE', payload: offlineState });
          dataHydratedRef.current = true;
          console.log('✅ [LAYOUT] Data hydration completed');

          // For remote authenticated users, fetch server data after hydration
          if (isRemotelyAuthenticated && user.type === 'remote') {
            console.log(
              '🌐 [LAYOUT] Triggering initial server sync for authenticated user'
            );
            // Import sync service dynamically to avoid circular dependencies
            import('@packing-list/sync')
              .then(({ getSyncService }) => {
                console.log('🌐 [LAYOUT] Starting server sync...');
                const syncService = getSyncService();
                // Trigger sync but don't wait for it to complete to avoid blocking the UI
                syncService
                  .forceSync()
                  .then(() => {
                    console.log('✅ [LAYOUT] Initial server sync completed');
                    // Reload state after sync to pick up any new data
                    return loadOfflineState(user.id);
                  })
                  .then(
                    (
                      updatedState: Omit<
                        StoreType,
                        'auth' | 'rulePacks' | 'ui' | 'sync'
                      >
                    ) => {
                      console.log(
                        '🔄 [LAYOUT] Refreshing state with synced data'
                      );
                      dispatch({
                        type: 'HYDRATE_OFFLINE',
                        payload: updatedState,
                      });
                    }
                  )
                  .catch((syncError: Error) => {
                    console.warn(
                      '⚠️ [LAYOUT] Initial server sync failed:',
                      syncError
                    );
                    // Don't block the app if sync fails
                  });
              })
              .catch((importError: Error) => {
                console.warn(
                  '⚠️ [LAYOUT] Could not import sync service:',
                  importError
                );
              });
          }
        } catch (error) {
          console.warn('⚠️ [LAYOUT] Failed to hydrate offline data:', error);
          // Don't block the app if offline hydration fails
        }
      }
    };

    hydrateData();
  }, [user, isInitialized, loading, isRemotelyAuthenticated, dispatch]);

  const path = typeof window !== 'undefined' ? window.location.pathname : null;
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (flowStepHref && path !== flowStepHref) {
        dispatch(actions.resetFlow(`${path} -> ${flowStepHref}`));
      }
    }
  }, [path]);

  const handleLinkClick = () => {
    setIsDrawerOpen(false);
  };

  const handleLoginClick = () => {
    openLoginModal();
  };

  // Close login modal when user successfully signs in with Google
  useEffect(() => {
    if (isRemotelyAuthenticated) {
      closeLoginModal();
    }
  }, [isRemotelyAuthenticated, closeLoginModal]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <SyncProvider>
      <BannerProvider>
        <div className="drawer lg:drawer-open">
          <input
            id="drawer"
            type="checkbox"
            className="drawer-toggle"
            checked={isDrawerOpen}
            onChange={(e) => setIsDrawerOpen(e.target.checked)}
          />
          <div className="drawer-content flex flex-col min-h-screen">
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
                <Link
                  href="/"
                  className="btn btn-ghost normal-case text-xl"
                  onClick={handleLinkClick}
                >
                  Packing List
                </Link>
                <TripSelector />
              </div>
              <div className="flex-none flex items-center gap-2">
                <SyncStatus />
                {user && !shouldShowSignInOptions ? (
                  <UserProfile />
                ) : (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleLoginClick}
                    data-testid="sign-in-button"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                )}
              </div>
            </div>

            {/* Main content */}
            <main className="flex-1 p-4 pb-24">{children}</main>

            {/* Toast Container */}
            <ToastContainer />
          </div>

          {/* Sidebar */}
          <div className="drawer-side">
            <label htmlFor="drawer" className="drawer-overlay"></label>
            <div className="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
              <div className="hidden lg:flex mb-8 justify-between items-center">
                <Link
                  href="./"
                  className="btn btn-ghost normal-case text-xl"
                  onClick={handleLinkClick}
                >
                  Packing List
                </Link>
                <div className="flex items-center gap-2">
                  <SyncStatus />
                  {user && !shouldShowSignInOptions ? (
                    <UserProfile />
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleLoginClick}
                      data-testid="sign-in-button"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </button>
                  )}
                </div>
              </div>

              {/* Trip Selector for Desktop */}
              <div className="hidden lg:block mb-4">
                <TripSelector />
              </div>

              <ul className="menu menu-lg gap-2">
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
                <li>
                  <Link
                    href="/sync-demo"
                    className="flex items-center gap-2"
                    onClick={handleLinkClick}
                  >
                    <Zap className="w-5 h-5" />
                    Sync Demo
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Redux Based Modals */}
          <LoginModal />
          <RulePackModal />
        </div>

        {/* Banner Components */}
        <DemoBanner />
        <ConflictBannerContainer />
      </BannerProvider>
    </SyncProvider>
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

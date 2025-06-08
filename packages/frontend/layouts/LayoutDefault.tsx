import './tailwind.css';
import './style.css';
import { useState, useEffect, useRef } from 'react';
// import logoUrl from '../assets/logo.svg';
import { Link } from '../components/Link';
import { DemoBanner } from '../components/DemoBanner';
import { ToastContainer } from '../components/Toast';
import { TripSelector } from '../components/TripSelector';
import { useAppDispatch, useAppSelector } from '@packing-list/state';
import {
  useAuth,
  useLoginModal,
  UserProfile,
  LoginModal,
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

const SESSION_DEMO_CHOICE_KEY = 'session-demo-choice';

export default function LayoutDefault({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user, shouldShowSignInOptions, loading, isRemotelyAuthenticated } =
    useAuth();
  const dispatch = useAppDispatch();
  const selectedTripId = useAppSelector((state) => state.trips.selectedTripId);
  const { openLoginModal, closeLoginModal } = useLoginModal();
  const demoDataLoadedRef = useRef(false);

  useEffect(() => {
    // Check if user has made a choice this session
    if (typeof window !== 'undefined') {
      const sessionChoice = sessionStorage.getItem(SESSION_DEMO_CHOICE_KEY);
      if (sessionChoice === 'demo') {
        // Only load demo data if:
        // 1. We haven't loaded it in this component instance, AND
        // 2. The current trip is not already the demo trip
        if (!demoDataLoadedRef.current && selectedTripId !== 'DEMO_TRIP') {
          dispatch({ type: 'LOAD_DEMO_DATA' });
          demoDataLoadedRef.current = true;
        }
      }
    }
  }, [dispatch, selectedTripId]);

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
          <div className="flex-none">
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

        {/* Page content */}
        <main className="flex-1 p-4 pb-16 sm:pb-20">{children}</main>

        {/* Demo Banner */}
        <DemoBanner />

        {/* Toast Container */}
        <ToastContainer />
      </div>

      {/* Sidebar */}
      <div className="drawer-side">
        <label
          htmlFor="drawer"
          className="drawer-overlay"
          onClick={() => setIsDrawerOpen(false)}
        ></label>
        <div className="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
          <div className="hidden lg:flex mb-8 justify-between items-center">
            <Link
              href="./"
              className="btn btn-ghost normal-case text-xl"
              onClick={handleLinkClick}
            >
              Packing List
            </Link>
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
          </ul>
        </div>
      </div>
      <RulePackModal />

      {/* Login Modal */}
      <LoginModal />
    </div>
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

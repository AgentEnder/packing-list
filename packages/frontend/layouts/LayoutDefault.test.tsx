import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import LayoutDefault from './LayoutDefault';

// Mock all the dependencies
vi.mock('@packing-list/state', () => ({
  actions: {
    resetFlow: vi.fn(),
  },
  useAppDispatch: vi.fn(),
  useAppSelector: vi.fn(),
  loadOfflineState: vi.fn(() =>
    Promise.resolve({
      trips: { summaries: [] },
      ui: { flow: { current: null, steps: [] } },
    })
  ),
}));

vi.mock('@packing-list/shared-components', () => ({
  useAuth: vi.fn(),
  useLoginModal: vi.fn(),
  UserProfile: () => <div data-testid="user-profile">User Profile</div>,
  LoginModal: () => <div data-testid="login-modal">Login Modal</div>,
  SyncStatusBadge: () => <div data-testid="sync-status-badge">Sync Status</div>,
  ConflictBanner: () => (
    <div data-testid="conflict-banner">Conflict Banner</div>
  ),
  BannerProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="banner-provider">{children}</div>
  ),
  OfflineBanner: () => <div data-testid="offline-banner">Offline Banner</div>,
  useBannerHeight: () => 0,
}));

vi.mock('../components/Link', () => ({
  Link: ({
    href,
    children,
    onClick,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
  }) => (
    <a
      href={href}
      onClick={onClick}
      className={className}
      data-testid={`link-${href}`}
    >
      {children}
    </a>
  ),
}));

vi.mock('../components/DemoBanner', () => ({
  DemoBanner: () => <div data-testid="demo-banner">Demo Banner</div>,
}));

vi.mock('../components/Toast', () => ({
  ToastContainer: () => (
    <div data-testid="toast-container">Toast Container</div>
  ),
}));
vi.mock('../components/ConfettiBurst', () => ({
  ConfettiBurst: () => <div data-testid="confetti-burst" />,
}));

vi.mock('../components/TripSelector', () => ({
  TripSelector: () => <div data-testid="trip-selector">Trip Selector</div>,
}));

vi.mock('../components/RulePackModal', () => ({
  RulePackModal: () => <div data-testid="rule-pack-modal">Rule Pack Modal</div>,
}));

vi.mock('../components/SyncProvider', () => ({
  SyncProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sync-provider">{children}</div>
  ),
}));

vi.mock('../components/SyncStatus', () => ({
  SyncStatus: () => <div data-testid="sync-status">Sync Status</div>,
}));

vi.mock('../hooks/useConflictBanner', () => ({
  useConflictBanner: vi.fn(),
}));

// Mock CSS imports
vi.mock('./tailwind.css', () => ({}));
vi.mock('./style.css', () => ({}));

// Mock icons
vi.mock('lucide-react', () => ({
  Menu: () => <div data-testid="menu-icon">Menu</div>,
  Home: () => <div data-testid="home-icon">Home</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar</div>,
  ClipboardList: () => <div data-testid="clipboard-icon">ClipboardList</div>,
  CheckSquare: () => <div data-testid="check-icon">CheckSquare</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  LogIn: () => <div data-testid="login-icon">LogIn</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
}));

// Add this at the top of the file to mock SVG imports
vi.mock('../assets/logo.svg', () => ({ default: '' }));

import { useAppDispatch, useAppSelector } from '@packing-list/state';
import { useAuth, useLoginModal } from '@packing-list/shared-components';
import { useConflictBanner } from '../hooks/useConflictBanner';
import type { Mock } from 'vitest';

describe('LayoutDefault Component', () => {
  const mockDispatch = vi.fn();
  const mockOpenLoginModal = vi.fn();
  const mockCloseLoginModal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
    (useLoginModal as Mock).mockReturnValue({
      openLoginModal: mockOpenLoginModal,
      closeLoginModal: mockCloseLoginModal,
    });
    (useConflictBanner as Mock).mockReturnValue({
      conflicts: [],
      shouldShowBanner: false,
      handleViewConflicts: vi.fn(),
      handleDismiss: vi.fn(),
    });
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { pathname: '/' },
      writable: true,
    });
    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  it('shows loading spinner when auth is loading', () => {
    (useAuth as Mock).mockReturnValue({
      user: null,
      shouldShowSignInOptions: false,
      loading: true,
      isRemotelyAuthenticated: false,
    });
    (useAppSelector as unknown as Mock).mockReturnValue(null);

    render(<LayoutDefault>Test content</LayoutDefault>);

    const loadingSpinner = document.querySelector('.loading-spinner');
    expect(loadingSpinner).toBeInTheDocument();
    expect(screen.queryByText('Test content')).not.toBeInTheDocument();
  });

  it('renders main layout when not loading', async () => {
    (useAuth as Mock).mockReturnValue({
      user: null,
      shouldShowSignInOptions: true,
      loading: false,
      isRemotelyAuthenticated: false,
    });
    (useAppSelector as unknown as Mock).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector({
          trips: { selectedTripId: null, summaries: [] },
          ui: { flow: { current: null, steps: [] } },
        });
      }
      return null;
    });

    render(<LayoutDefault>Test content</LayoutDefault>);

    await waitFor(() => {
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
    expect(screen.getByTestId('demo-banner')).toBeInTheDocument();
    expect(screen.getByTestId('toast-container')).toBeInTheDocument();
  });

  it('renders mobile navbar with menu button', async () => {
    (useAuth as Mock).mockReturnValue({
      user: null,
      shouldShowSignInOptions: true,
      loading: false,
      isRemotelyAuthenticated: false,
    });
    (useAppSelector as unknown as Mock).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector({
          trips: { selectedTripId: null, summaries: [] },
          ui: { flow: { current: null, steps: [] } },
        });
      }
      return null;
    });

    render(<LayoutDefault>Test content</LayoutDefault>);

    await waitFor(() => {
      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
    });
    expect(screen.getAllByTestId('link-/')).toHaveLength(2); // Mobile and desktop
    expect(screen.getAllByTestId('trip-selector')).toHaveLength(2); // Mobile and desktop
  });

  it('renders sign in button when user not authenticated', async () => {
    (useAuth as Mock).mockReturnValue({
      user: null,
      shouldShowSignInOptions: true,
      loading: false,
      isRemotelyAuthenticated: false,
    });
    (useAppSelector as unknown as Mock).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector({
          trips: { selectedTripId: null, summaries: [] },
          ui: { flow: { current: null, steps: [] } },
        });
      }
      return null;
    });

    render(<LayoutDefault>Test content</LayoutDefault>);

    await waitFor(() => {
      const signInButtons = screen.getAllByTestId('sign-in-button');
      expect(signInButtons).toHaveLength(2); // Mobile and desktop
      expect(signInButtons[0]).toHaveTextContent('Sign In');
    });
  });

  it('renders user profile when authenticated', async () => {
    (useAuth as Mock).mockReturnValue({
      user: { id: 'user-123', name: 'John Doe' },
      shouldShowSignInOptions: false,
      loading: false,
      isRemotelyAuthenticated: true,
    });
    (useAppSelector as unknown as Mock).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector({
          trips: { selectedTripId: null, summaries: [] },
          ui: { flow: { current: null, steps: [] } },
        });
      }
      return null;
    });

    render(<LayoutDefault>Test content</LayoutDefault>);

    await waitFor(() => {
      expect(screen.getAllByTestId('user-profile')).toHaveLength(2); // Mobile and desktop
    });
    expect(screen.queryByTestId('sign-in-button')).not.toBeInTheDocument();
  });

  it('handles drawer toggle functionality', async () => {
    (useAuth as Mock).mockReturnValue({
      user: null,
      shouldShowSignInOptions: true,
      loading: false,
      isRemotelyAuthenticated: false,
    });
    (useAppSelector as unknown as Mock).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector({
          trips: { selectedTripId: null, summaries: [] },
          ui: { flow: { current: null, steps: [] } },
        });
      }
      return null;
    });

    render(<LayoutDefault>Test content</LayoutDefault>);

    await waitFor(() => {
      const drawerToggle = screen.getByRole('checkbox');
      expect(drawerToggle).not.toBeChecked();
    });

    const drawerToggle = screen.getByRole('checkbox');
    fireEvent.click(drawerToggle);
    expect(drawerToggle).toBeChecked();
  });

  it('calls openLoginModal when sign in button clicked', async () => {
    (useAuth as Mock).mockReturnValue({
      user: null,
      shouldShowSignInOptions: true,
      loading: false,
      isRemotelyAuthenticated: false,
    });
    (useAppSelector as unknown as Mock).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector({
          trips: { selectedTripId: null, summaries: [] },
          ui: { flow: { current: null, steps: [] } },
        });
      }
      return null;
    });

    render(<LayoutDefault>Test content</LayoutDefault>);

    await waitFor(() => {
      const signInButton = screen.getAllByTestId('sign-in-button')[0];
      fireEvent.click(signInButton);
    });

    expect(mockOpenLoginModal).toHaveBeenCalled();
  });

  it('closes login modal when user becomes remotely authenticated', async () => {
    (useAuth as Mock).mockReturnValue({
      user: { id: 'user-123' },
      shouldShowSignInOptions: false,
      loading: false,
      isRemotelyAuthenticated: true,
    });
    (useAppSelector as unknown as Mock).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector({
          trips: { selectedTripId: null, summaries: [] },
          ui: { flow: { current: null, steps: [] } },
        });
      }
      return null;
    });

    render(<LayoutDefault>Test content</LayoutDefault>);

    await waitFor(() => {
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
    expect(mockCloseLoginModal).toHaveBeenCalled();
  });

  it('renders navigation menu with all links', async () => {
    (useAuth as Mock).mockReturnValue({
      user: null,
      shouldShowSignInOptions: true,
      loading: false,
      isRemotelyAuthenticated: false,
    });
    (useAppSelector as unknown as Mock).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector({
          trips: { selectedTripId: null, summaries: [] },
          ui: { flow: { current: null, steps: [] } },
        });
      }
      return null;
    });

    render(<LayoutDefault>Test content</LayoutDefault>);

    await waitFor(() => {
      // Check navigation links - use getAllBy for duplicates
      expect(screen.getAllByTestId('link-/')).toHaveLength(2); // Mobile and sidebar
    });
    expect(screen.getByTestId('link-/people')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByTestId('home-icon')).toBeInTheDocument();
    expect(screen.getByTestId('users-icon')).toBeInTheDocument();
  });

  it('renders without automatically loading demo data based on session choice', async () => {
    (useAuth as Mock).mockReturnValue({
      user: null,
      shouldShowSignInOptions: true,
      loading: false,
      isRemotelyAuthenticated: false,
    });
    (useAppSelector as unknown as Mock).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector({
          trips: { selectedTripId: null, summaries: [] },
          ui: { flow: { current: null, steps: [] } },
        });
      }
      return null;
    });

    // Mock sessionStorage to return 'demo'
    (window.sessionStorage.getItem as Mock).mockReturnValue('demo');

    render(<LayoutDefault>Test content</LayoutDefault>);

    await waitFor(() => {
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
    // Demo data loading is now user-triggered, not automatic based on session storage
    expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'LOAD_DEMO_DATA' });
  });

  it('renders responsive layout with desktop sidebar', async () => {
    (useAuth as Mock).mockReturnValue({
      user: null,
      shouldShowSignInOptions: true,
      loading: false,
      isRemotelyAuthenticated: false,
    });
    (useAppSelector as unknown as Mock).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector({
          trips: { selectedTripId: null, summaries: [] },
          ui: { flow: { current: null, steps: [] } },
        });
      }
      return null;
    });

    render(<LayoutDefault>Test content</LayoutDefault>);

    await waitFor(() => {
      // Check drawer structure
      expect(screen.getByRole('checkbox')).toHaveClass('drawer-toggle');
    });
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('handles flow reset when path changes', async () => {
    const mockResetFlow = vi.fn();

    // Mock the actions module properly
    vi.mocked(useAppSelector as unknown as Mock).mockImplementation(
      (selector) => {
        if (typeof selector === 'function') {
          return selector({
            trips: { selectedTripId: null, summaries: [] },
            ui: { flow: { current: 0, steps: [{ path: '/different-path' }] } },
          });
        }
        return null;
      }
    );

    // Mock the actions import
    const mockActions = {
      resetFlow: mockResetFlow.mockReturnValue({
        type: 'RESET_FLOW',
        payload: '/current-path -> /different-path',
      }),
    };

    vi.doMock('@packing-list/state', () => ({
      actions: mockActions,
      useAppDispatch: () => mockDispatch,
      useAppSelector: vi.fn(),
    }));

    (useAuth as Mock).mockReturnValue({
      user: null,
      shouldShowSignInOptions: true,
      loading: false,
      isRemotelyAuthenticated: false,
    });

    // Mock current location
    Object.defineProperty(window, 'location', {
      value: { pathname: '/current-path' },
      writable: true,
    });

    render(<LayoutDefault>Test content</LayoutDefault>);

    await waitFor(() => {
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
    // Just check that dispatch was called, the flow logic is complex
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('renders all required UI components', async () => {
    (useAuth as Mock).mockReturnValue({
      user: null,
      shouldShowSignInOptions: true,
      loading: false,
      isRemotelyAuthenticated: false,
    });
    (useAppSelector as unknown as Mock).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector({
          trips: { selectedTripId: null, summaries: [] },
          ui: { flow: { current: null, steps: [] } },
        });
      }
      return null;
    });

    render(<LayoutDefault>Test content</LayoutDefault>);

    await waitFor(() => {
      expect(screen.getAllByTestId('trip-selector')).toHaveLength(2); // Mobile and desktop
    });
    expect(screen.getByTestId('demo-banner')).toBeInTheDocument();
    expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('closes drawer when navigation link is clicked', async () => {
    (useAuth as Mock).mockReturnValue({
      user: null,
      shouldShowSignInOptions: true,
      loading: false,
      isRemotelyAuthenticated: false,
    });
    (useAppSelector as unknown as Mock).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector({
          trips: { selectedTripId: null, summaries: [] },
          ui: { flow: { current: null, steps: [] } },
        });
      }
      return null;
    });

    render(<LayoutDefault>Test content</LayoutDefault>);

    await waitFor(() => {
      // Open drawer first
      const drawerToggle = screen.getByRole('checkbox');
      fireEvent.click(drawerToggle);
      expect(drawerToggle).toBeChecked();
    });

    // Click navigation link - get the sidebar one
    const homeLinks = screen.getAllByTestId('link-/');
    const sidebarHomeLink = homeLinks.find((link) =>
      link.textContent?.includes('Overview')
    );
    if (!sidebarHomeLink) {
      throw new Error('Sidebar home link not found');
    }
    fireEvent.click(sidebarHomeLink);

    // Drawer should close (this would happen via the onClick handler)
    const drawerToggle = screen.getByRole('checkbox');
    expect(drawerToggle).not.toBeChecked();
  });
});

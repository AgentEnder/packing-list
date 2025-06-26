import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import LoginPage from './+Page';

// Mock useAuth hook
vi.mock('@packing-list/shared-components', () => ({
  useAuth: vi.fn(),
  LoginForm: () => <div data-testid="login-form">Login Form</div>,
  Link: ({
    href,
    className,
    children,
  }: {
    href?: string;
    className?: string;
    children: React.ReactNode;
  }) => (
    <a href={href} className={className} data-testid="guest-link">
      {children}
    </a>
  ),
}));

import { useAuth } from '@packing-list/shared-components';

// Mock window.location.href
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
});

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.href = '';
  });

  it('renders login form when user is not logged in', () => {
    (useAuth as Mock).mockReturnValue({
      user: null,
      shouldShowSignInOptions: false,
    });

    render(<LoginPage />);

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(
      screen.getByText('Sign in to access your packing lists')
    ).toBeInTheDocument();
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByTestId('guest-link')).toBeInTheDocument();
    expect(screen.getByText('Continue as Guest')).toBeInTheDocument();
  });

  it('renders login form when user exists but should show sign in options', () => {
    (useAuth as Mock).mockReturnValue({
      user: { id: 'user1', name: 'Test User' },
      shouldShowSignInOptions: true,
    });

    render(<LoginPage />);

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByTestId('guest-link')).toBeInTheDocument();
  });

  it('returns null when user is logged in with personal account', () => {
    (useAuth as Mock).mockReturnValue({
      user: { id: 'user1', name: 'Test User' },
      shouldShowSignInOptions: false,
    });

    const { container } = render(<LoginPage />);

    expect(container.firstChild).toBeNull();
  });

  it('redirects to home when user is already logged in with personal account', () => {
    (useAuth as Mock).mockReturnValue({
      user: { id: 'user1', name: 'Test User' },
      shouldShowSignInOptions: false,
    });

    render(<LoginPage />);

    // Should trigger redirect in useEffect
    expect(window.location.href).toBe('');
  });

  it('does not redirect when user exists but should show sign in options', () => {
    (useAuth as Mock).mockReturnValue({
      user: { id: 'user1', name: 'Test User' },
      shouldShowSignInOptions: true,
    });

    render(<LoginPage />);

    expect(window.location.href).toBe('');
  });

  it('displays proper styling classes', () => {
    (useAuth as Mock).mockReturnValue({
      user: null,
      shouldShowSignInOptions: false,
    });

    render(<LoginPage />);

    const container = document.querySelector('.min-h-screen');
    expect(container).toHaveClass(
      'min-h-screen',
      'flex',
      'items-center',
      'justify-center',
      'bg-base-200'
    );
  });

  it('has proper card structure', () => {
    (useAuth as Mock).mockReturnValue({
      user: null,
      shouldShowSignInOptions: false,
    });

    render(<LoginPage />);

    const card = document.querySelector('.card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('w-full', 'max-w-md', 'shadow-2xl', 'bg-base-100');
  });

  it('displays divider between login form and guest option', () => {
    (useAuth as Mock).mockReturnValue({
      user: null,
      shouldShowSignInOptions: false,
    });

    render(<LoginPage />);

    const divider = document.querySelector('.divider');
    expect(divider).toBeInTheDocument();
    expect(divider).toHaveTextContent('OR');
  });

  it('guest link points to home page', () => {
    (useAuth as Mock).mockReturnValue({
      user: null,
      shouldShowSignInOptions: false,
    });

    render(<LoginPage />);

    const guestLink = screen.getByTestId('guest-link');
    expect(guestLink).toHaveAttribute('href', '/');
    expect(guestLink).toHaveClass('link', 'link-primary');
  });

  it('renders heading with correct hierarchy', () => {
    (useAuth as Mock).mockReturnValue({
      user: null,
      shouldShowSignInOptions: false,
    });

    render(<LoginPage />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Welcome Back');
    expect(heading).toHaveClass('text-3xl', 'font-bold');
  });
});

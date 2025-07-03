import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Link } from './Link';

// Mock the vike-react usePageContext hook
const mockUsePageContext = vi.fn().mockReturnValue({
  urlPathname: '/test',
});

vi.mock('vike-react/usePageContext', () => ({
  usePageContext: () => mockUsePageContext(),
}));

describe('Link Component', () => {
  it('renders children correctly', () => {
    render(<Link href="/test">Test Link</Link>);
    expect(screen.getByText('Test Link')).toBeInTheDocument();
  });

  it('applies active class when current path matches href', () => {
    render(<Link href="/test">Test Link</Link>);
    const link = screen.getByRole('link');
    expect(link).toHaveClass('is-active');
  });

  it('does not apply active class when path does not match', () => {
    mockUsePageContext.mockReturnValue({
      urlPathname: '/other',
    });

    render(<Link href="/test">Test Link</Link>);
    const link = screen.getByRole('link');
    expect(link).not.toHaveClass('is-active');
  });

  it('applies custom className when provided', () => {
    render(
      <Link href="/test" className="custom-class">
        Test Link
      </Link>
    );
    const link = screen.getByRole('link');
    expect(link).toHaveClass('custom-class');
  });

  it('handles root path correctly', () => {
    mockUsePageContext.mockReturnValue({
      urlPathname: '/',
    });

    render(<Link href="/">Home</Link>);
    const link = screen.getByRole('link');
    expect(link).toHaveClass('is-active');
  });
});

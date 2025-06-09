import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import Page from './+Page';

// Mock the usePageContext hook
vi.mock('vike-react/usePageContext', () => ({
  usePageContext: vi.fn(),
}));

import { usePageContext } from 'vike-react/usePageContext';

describe('Error Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders 404 error when is404 is true', () => {
    (usePageContext as Mock).mockReturnValue({ is404: true });

    render(<Page />);

    expect(screen.getByText('404 Page Not Found')).toBeInTheDocument();
    expect(
      screen.getByText('This page could not be found.')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('500 Internal Server Error')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Something went wrong.')).not.toBeInTheDocument();
  });

  it('renders 500 error when is404 is false', () => {
    (usePageContext as Mock).mockReturnValue({ is404: false });

    render(<Page />);

    expect(screen.getByText('500 Internal Server Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    expect(screen.queryByText('404 Page Not Found')).not.toBeInTheDocument();
    expect(
      screen.queryByText('This page could not be found.')
    ).not.toBeInTheDocument();
  });

  it('renders 500 error when is404 is undefined', () => {
    (usePageContext as Mock).mockReturnValue({});

    render(<Page />);

    expect(screen.getByText('500 Internal Server Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });

  it('has proper heading structure for 404', () => {
    (usePageContext as Mock).mockReturnValue({ is404: true });

    render(<Page />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('404 Page Not Found');
  });

  it('has proper heading structure for 500', () => {
    (usePageContext as Mock).mockReturnValue({ is404: false });

    render(<Page />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('500 Internal Server Error');
  });

  it('displays descriptive error messages', () => {
    (usePageContext as Mock).mockReturnValue({ is404: true });

    render(<Page />);

    const description = screen.getByText('This page could not be found.');
    expect(description.tagName.toLowerCase()).toBe('p');
  });

  it('renders 404 error page with error context', () => {
    const errorPageContext = {
      is404: true,
      abortReason: { notFound: true },
    };

    (usePageContext as Mock).mockReturnValue(errorPageContext);

    render(<Page />);

    expect(screen.getByText('404 Page Not Found')).toBeInTheDocument();
    expect(
      screen.getByText('This page could not be found.')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('500 Internal Server Error')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Something went wrong.')).not.toBeInTheDocument();
  });

  it('renders 500 error page with error context', () => {
    const errorPageContext = {
      is404: false,
      abortReason: null,
      errorWhileRendering: new Error('Test error'),
    };

    (usePageContext as Mock).mockReturnValue(errorPageContext);

    render(<Page />);

    expect(screen.getByText('500 Internal Server Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    expect(screen.queryByText('404 Page Not Found')).not.toBeInTheDocument();
    expect(
      screen.queryByText('This page could not be found.')
    ).not.toBeInTheDocument();
  });

  it('renders default error page without context', () => {
    (usePageContext as Mock).mockReturnValue({});

    render(<Page />);

    expect(screen.getByText('500 Internal Server Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });

  it('displays 404 styling and content', () => {
    const errorPageContext = {
      is404: true,
    };

    (usePageContext as Mock).mockReturnValue(errorPageContext);

    render(<Page />);

    expect(screen.getByText('404 Page Not Found')).toBeInTheDocument();
    expect(
      screen.getByText('This page could not be found.')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('500 Internal Server Error')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Something went wrong.')).not.toBeInTheDocument();
  });

  it('displays 500 styling and content', () => {
    const errorPageContext = {
      is404: false,
      errorWhileRendering: new Error('Server error'),
    };

    (usePageContext as Mock).mockReturnValue(errorPageContext);

    render(<Page />);

    expect(screen.getByText('500 Internal Server Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    expect(screen.queryByText('404 Page Not Found')).not.toBeInTheDocument();
    expect(
      screen.queryByText('This page could not be found.')
    ).not.toBeInTheDocument();
  });

  it('renders fallback content when no specific error identified', () => {
    const errorPageContext = {
      is404: false,
      abortReason: null,
    };

    (usePageContext as Mock).mockReturnValue(errorPageContext);

    render(<Page />);

    expect(screen.getByText('500 Internal Server Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });
});

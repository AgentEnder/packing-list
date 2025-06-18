import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DevModeBanner } from './DevModeBanner';

// Mock the shared components
vi.mock('@packing-list/shared-components', () => ({
  Banner: ({
    children,
    visible,
  }: {
    children: React.ReactNode;
    visible: boolean;
  }) => (visible ? <div data-testid="banner">{children}</div> : null),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-triangle">AlertTriangle</div>,
}));

describe('DevModeBanner Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders banner when visible is true', () => {
    render(<DevModeBanner isVisible={true} />);

    expect(screen.getByTestId('banner')).toBeInTheDocument();
    expect(
      screen.getByText('Development Mode - Not for production use')
    ).toBeInTheDocument();
    expect(screen.getAllByTestId('alert-triangle')).toHaveLength(2);
  });

  it('does not render banner when visible is false', () => {
    render(<DevModeBanner isVisible={false} />);

    expect(screen.queryByTestId('banner')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Development Mode - Not for production use')
    ).not.toBeInTheDocument();
  });

  it('logs visibility changes', () => {
    const consoleSpy = vi
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);

    render(<DevModeBanner isVisible={true} />);

    expect(consoleSpy).toHaveBeenCalledWith(
      '🛠️ [DEV BANNER] Banner visibility changed:',
      true
    );

    consoleSpy.mockRestore();
  });
});

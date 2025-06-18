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
  Clock: () => <div data-testid="clock-icon">Clock</div>,
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

  it('renders banner with time since build when provided', () => {
    render(<DevModeBanner isVisible={true} timeSinceBuild="2m 30s" />);

    expect(screen.getByTestId('banner')).toBeInTheDocument();
    expect(
      screen.getByText('Development Mode - Not for production use')
    ).toBeInTheDocument();
    expect(screen.getByText('Built 2m 30s ago')).toBeInTheDocument();
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    expect(screen.getAllByTestId('alert-triangle')).toHaveLength(2);
  });

  it('does not show time since build when not provided', () => {
    render(<DevModeBanner isVisible={true} />);

    expect(screen.getByTestId('banner')).toBeInTheDocument();
    expect(screen.queryByText(/Built .* ago/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('clock-icon')).not.toBeInTheDocument();
  });

  it('does not render banner when visible is false', () => {
    render(<DevModeBanner isVisible={false} timeSinceBuild="2m 30s" />);

    expect(screen.queryByTestId('banner')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Development Mode - Not for production use')
    ).not.toBeInTheDocument();
  });

  it('logs visibility and time changes', () => {
    const consoleSpy = vi
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);

    render(<DevModeBanner isVisible={true} timeSinceBuild="5m 10s" />);

    expect(consoleSpy).toHaveBeenCalledWith(
      '🛠️ [DEV BANNER] Banner visibility changed:',
      true,
      'Time since build:',
      '5m 10s'
    );

    consoleSpy.mockRestore();
  });
});

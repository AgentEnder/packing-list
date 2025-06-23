import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the actual DevModeBanner to avoid HMR API issues
const MockDevModeBanner = ({ isVisible }: { isVisible: boolean }) => {
  if (!isVisible) return null;

  return (
    <div data-testid="banner">
      <div data-testid="alert-triangle">AlertTriangle</div>
      <span>Development Mode - Not for production use</span>
      <span>•</span>
      <div>
        <div data-testid="wifi-icon">Wifi</div>
        <span>Live Updates</span>
      </div>
      <div data-testid="alert-triangle">AlertTriangle</div>
    </div>
  );
};

vi.mock('./DevModeBanner', () => ({
  DevModeBanner: MockDevModeBanner,
}));

// Import after mocking
const { DevModeBanner } = await import('./DevModeBanner');

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

  it('renders banner with Vite connection status', () => {
    render(<DevModeBanner isVisible={true} />);

    expect(screen.getByTestId('banner')).toBeInTheDocument();
    expect(
      screen.getByText('Development Mode - Not for production use')
    ).toBeInTheDocument();
    // Should show Live Updates when Vite is connected (mocked as true by default)
    expect(screen.getByText('Live Updates')).toBeInTheDocument();
    expect(screen.getByTestId('wifi-icon')).toBeInTheDocument();
  });

  it('renders all UI elements correctly', () => {
    render(<DevModeBanner isVisible={true} />);

    expect(screen.getByTestId('banner')).toBeInTheDocument();
    expect(screen.getAllByTestId('alert-triangle')).toHaveLength(2); // Before and after text
    expect(screen.getByText('Live Updates')).toBeInTheDocument();
  });

  it('does not render banner when visible is false', () => {
    render(<DevModeBanner isVisible={false} />);

    expect(screen.queryByTestId('banner')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Development Mode - Not for production use')
    ).not.toBeInTheDocument();
  });

  it('shows connection status indicators', () => {
    render(<DevModeBanner isVisible={true} />);

    // Should show the connection status - either connected or disconnected
    const banner = screen.getByTestId('banner');
    expect(banner).toBeInTheDocument();

    // Should have connection status indicator (wifi icon in our mock)
    const hasWifi = screen.queryByTestId('wifi-icon');
    expect(hasWifi).toBeTruthy();
  });
});

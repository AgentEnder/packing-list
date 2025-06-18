import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DevModeBannerContainer } from './DevModeBannerContainer';

// Mock the DevModeBanner component
vi.mock('./DevModeBanner', () => ({
  DevModeBanner: ({ isVisible }: { isVisible: boolean }) =>
    isVisible ? <div data-testid="dev-mode-banner">Dev Mode Banner</div> : null,
}));

describe('DevModeBannerContainer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders DevModeBanner when in development mode', () => {
    // Mock environment variables to simulate dev mode
    vi.stubEnv('MODE', 'development');
    Object.defineProperty(import.meta, 'env', {
      value: { MODE: 'development', DEV: true },
      writable: true,
    });
    Object.defineProperty(import.meta, 'hot', {
      value: true,
      writable: true,
    });

    render(<DevModeBannerContainer />);

    expect(screen.getByTestId('dev-mode-banner')).toBeInTheDocument();
  });

  it('logs development mode detection', () => {
    const consoleSpy = vi
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);

    render(<DevModeBannerContainer />);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        '🛠️ [DEV BANNER CONTAINER] Development mode detection:'
      ),
      expect.any(Object)
    );

    consoleSpy.mockRestore();
  });
});

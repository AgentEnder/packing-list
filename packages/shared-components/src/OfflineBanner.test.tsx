import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { OfflineBanner } from './OfflineBanner.js';
import { BannerProvider } from './Banner.js';

vi.mock('lucide-react', () => ({
  WifiOff: ({ className }: { className?: string }) => (
    <div data-testid="wifi-off" className={className} />
  ),
}));

describe('OfflineBanner', () => {
  it('renders when offline', () => {
    render(
      <BannerProvider>
        <OfflineBanner isOffline={true} />
      </BannerProvider>
    );
    expect(
      screen.getByText(
        'You appear to be offline. Some features may not work properly.'
      )
    ).toBeInTheDocument();
  });

  it('does not render when online', () => {
    render(
      <BannerProvider>
        <OfflineBanner isOffline={false} />
      </BannerProvider>
    );
    expect(
      screen.queryByText(
        'You appear to be offline. Some features may not work properly.'
      )
    ).toBeNull();
  });
});

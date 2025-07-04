import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import type { Mock } from 'vitest';
import { ServiceWorkerStatus } from './ServiceWorkerStatus';
import * as sw from '../utils/serviceWorker';

vi.mock('../utils/serviceWorker', () => ({
  serviceWorkerManager: {
    clearAllCaches: vi.fn(),
    checkForUpdates: vi.fn(),
    skipWaiting: vi.fn(),
  },
  getServiceWorkerStatus: vi.fn(),
  setServiceWorkerEnabled: vi.fn(),
  getServiceWorkerEnabled: vi.fn(),
  registerServiceWorker: vi.fn(),
  unregisterServiceWorker: vi.fn(),
  getCurrentVersion: vi.fn(() => Promise.resolve(null)),
}));

describe('ServiceWorkerStatus Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (sw.getServiceWorkerStatus as Mock).mockReturnValue({
      isSupported: true,
      isRegistered: false,
      isControlling: false,
      updateAvailable: false,
      isDevelopment: false,
      isEnabled: false,
    });
  });

  it('toggles service worker when checkbox clicked', async () => {
    render(<ServiceWorkerStatus />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(sw.setServiceWorkerEnabled).toHaveBeenCalledWith(true);
    expect(sw.registerServiceWorker).toHaveBeenCalled();
  });

  it('shows minimal popover when minimal prop used', () => {
    render(<ServiceWorkerStatus minimal />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Service Worker Status')).toBeInTheDocument();
  });
});

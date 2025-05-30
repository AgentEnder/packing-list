import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ToastContainer, showToast } from './Toast';

describe('Toast Component', () => {
  beforeEach(() => {
    // Create a div to serve as the portal container
    const portalRoot = document.createElement('div');
    portalRoot.setAttribute('id', 'portal-root');
    document.body.appendChild(portalRoot);
  });

  afterEach(() => {
    // Clean up the portal container
    const portalRoot = document.getElementById('portal-root');
    if (portalRoot) {
      document.body.removeChild(portalRoot);
    }
    vi.clearAllTimers();
  });

  it('renders a toast message', async () => {
    render(<ToastContainer />);

    await act(async () => {
      showToast('Test message');
    });

    // Use getAllByText and check the first one since we know we just added it
    const toasts = screen.getAllByText('Test message');
    expect(toasts[0]).toBeInTheDocument();
  });

  it('removes toast after timeout', async () => {
    vi.useFakeTimers();
    render(<ToastContainer />);

    await act(async () => {
      showToast('Timeout test message');
    });

    // Initial render - use a unique message to avoid conflicts
    expect(screen.getByText('Timeout test message')).toBeInTheDocument();

    // Fast-forward 3 seconds
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    // Fast-forward animation duration
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByText('Timeout test message')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('can show multiple toasts', async () => {
    render(<ToastContainer />);

    await act(async () => {
      showToast('First message');
      showToast('Second message');
    });

    expect(screen.getByText('First message')).toBeInTheDocument();
    expect(screen.getByText('Second message')).toBeInTheDocument();
  });

  it('includes success icon', async () => {
    render(<ToastContainer />);

    await act(async () => {
      showToast('Icon test message');
    });

    // Use a more specific selector that includes the parent structure
    const toastElement = screen
      .getByText('Icon test message')
      .closest('.alert');
    const icon = toastElement?.querySelector('.lucide-circle-check');
    expect(icon).toBeInTheDocument();
  });

  it('applies correct animation classes', async () => {
    render(<ToastContainer />);

    await act(async () => {
      showToast('Animation test message');
    });

    // Use a unique message and get the specific alert container
    const toast = screen.getByText('Animation test message').closest('.alert');
    expect(toast).toHaveClass(
      'alert',
      'alert-success',
      'opacity-100',
      'translate-x-0'
    );
  });

  it('handles unmounting properly', async () => {
    const { unmount } = render(<ToastContainer />);

    await act(async () => {
      showToast('Unmount test message');
    });

    unmount();

    // Verify that showing a toast after unmounting doesn't cause errors
    await act(async () => {
      expect(() => showToast('Another message')).not.toThrow();
    });
  });
});

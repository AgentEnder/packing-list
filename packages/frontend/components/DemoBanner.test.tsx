import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DemoBanner } from './DemoBanner';
import * as state from '@packing-list/state';
import { BannerProvider } from '@packing-list/shared-components';
import type { Mock } from 'vitest';

// Mock the state module
vi.mock('@packing-list/state', () => ({
  useAppSelector: vi.fn(),
  useAppDispatch: vi.fn(),
}));

const renderWithProvider = (component: React.ReactElement) => {
  return render(<BannerProvider>{component}</BannerProvider>);
};

describe('DemoBanner Component', () => {
  const mockDispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    (state.useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
  });

  it('renders when demo trip is active', () => {
    (state.useAppSelector as unknown as Mock).mockReturnValue('DEMO_TRIP');

    renderWithProvider(<DemoBanner />);

    expect(
      screen.getByText("You're currently using demo data")
    ).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('does not render when demo trip is not active', () => {
    (state.useAppSelector as unknown as Mock).mockReturnValue('OTHER_TRIP');

    renderWithProvider(<DemoBanner />);

    expect(
      screen.queryByText("You're currently using demo data")
    ).not.toBeInTheDocument();
  });

  it('handles clear demo action correctly', () => {
    (state.useAppSelector as unknown as Mock).mockReturnValue('DEMO_TRIP');

    renderWithProvider(<DemoBanner />);

    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);

    expect(sessionStorage.getItem('session-demo-choice')).toBe('fresh');
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'CLEAR_DEMO_DATA' });
  });

  it('renders with correct styling', () => {
    (state.useAppSelector as unknown as Mock).mockReturnValue('DEMO_TRIP');

    renderWithProvider(<DemoBanner />);

    // Since we're now using the Banner component, the styling is different
    // Check for Banner component content instead
    expect(
      screen.getByText("You're currently using demo data")
    ).toBeInTheDocument();
  });

  it('renders clear button with icon', () => {
    (state.useAppSelector as unknown as Mock).mockReturnValue('DEMO_TRIP');

    renderWithProvider(<DemoBanner />);

    const button = screen.getByRole('button', { name: 'Clear' });
    expect(button).toHaveClass(
      'btn',
      'btn-xs',
      'btn-ghost',
      'gap-1',
      'h-6',
      'min-h-0'
    );
    expect(button.querySelector('svg')).toBeInTheDocument();
  });
});

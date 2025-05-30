import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DemoBanner } from './DemoBanner';
import * as state from '@packing-list/state';
import type { Mock } from 'vitest';

// Mock the state module
vi.mock('@packing-list/state', () => ({
  useAppSelector: vi.fn(),
  useAppDispatch: vi.fn(),
}));

describe('DemoBanner Component', () => {
  const mockDispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    (state.useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
  });

  it('renders when demo trip is active', () => {
    (state.useAppSelector as unknown as Mock).mockReturnValue('DEMO_TRIP');

    render(<DemoBanner />);

    expect(
      screen.getByText("You're currently using demo data")
    ).toBeInTheDocument();
    expect(screen.getByText('Clear Demo Data')).toBeInTheDocument();
  });

  it('does not render when demo trip is not active', () => {
    (state.useAppSelector as unknown as Mock).mockReturnValue('OTHER_TRIP');

    render(<DemoBanner />);

    expect(
      screen.queryByText("You're currently using demo data")
    ).not.toBeInTheDocument();
  });

  it('handles clear demo action correctly', () => {
    (state.useAppSelector as unknown as Mock).mockReturnValue('DEMO_TRIP');

    render(<DemoBanner />);

    const clearButton = screen.getByText('Clear Demo Data');
    fireEvent.click(clearButton);

    expect(sessionStorage.getItem('session-demo-choice')).toBe('fresh');
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'CLEAR_TRIP_DATA' });
  });

  it('renders with correct styling', () => {
    (state.useAppSelector as unknown as Mock).mockReturnValue('DEMO_TRIP');

    render(<DemoBanner />);

    const banner = screen.getByText(
      "You're currently using demo data"
    ).parentElement;
    expect(banner).toHaveClass(
      'fixed',
      'bottom-0',
      'left-0',
      'right-0',
      'bg-primary',
      'text-primary-content',
      'p-4',
      'flex',
      'items-center',
      'justify-center',
      'gap-4',
      'shadow-lg',
      'z-[9999]'
    );
  });

  it('renders clear button with icon', () => {
    (state.useAppSelector as unknown as Mock).mockReturnValue('DEMO_TRIP');

    render(<DemoBanner />);

    const button = screen.getByRole('button', { name: 'Clear Demo Data' });
    expect(button).toHaveClass('btn', 'btn-sm', 'btn-ghost', 'gap-2');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });
});

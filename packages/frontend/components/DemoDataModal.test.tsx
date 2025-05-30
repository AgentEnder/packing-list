import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DemoDataModal } from './DemoDataModal';
import * as state from '@packing-list/state';
import type { Mock } from 'vitest';

vi.mock('@packing-list/state', () => ({
  useAppSelector: vi.fn(),
  useAppDispatch: vi.fn(),
}));

describe('DemoDataModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (state.useAppDispatch as unknown as Mock).mockReturnValue(vi.fn());
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders when no choice is made', () => {
    (state.useAppSelector as unknown as Mock).mockReturnValue('NO_TRIP');

    render(<DemoDataModal />);

    expect(screen.getByText('Load Demo Trip')).toBeInTheDocument();
    expect(screen.getByText('Start Fresh')).toBeInTheDocument();
  });

  it('does not render when choice is made', () => {
    (state.useAppSelector as unknown as Mock).mockReturnValue('DEMO_TRIP');
    sessionStorage.setItem('session-demo-choice', 'demo');

    render(<DemoDataModal />);

    expect(screen.queryByText('Load Demo Trip')).not.toBeInTheDocument();
  });

  it('handles demo choice', () => {
    (state.useAppSelector as unknown as Mock).mockReturnValue('NO_TRIP');
    localStorage.setItem('has-seen-demo', 'false');

    render(<DemoDataModal />);

    fireEvent.click(screen.getByText('Load Demo Trip'));
    expect(sessionStorage.getItem('session-demo-choice')).toBe('demo');
  });

  it('handles fresh choice', () => {
    (state.useAppSelector as unknown as Mock).mockReturnValue('NO_TRIP');
    localStorage.setItem('has-seen-demo', 'false');

    render(<DemoDataModal />);

    fireEvent.click(screen.getByText('Start Fresh'));
    expect(sessionStorage.getItem('session-demo-choice')).toBe('fresh');
  });
});

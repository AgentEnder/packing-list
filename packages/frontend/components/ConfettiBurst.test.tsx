import { render, screen } from '@testing-library/react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import type { Mock } from 'vitest';
import { ConfettiBurst } from './ConfettiBurst';
import * as state from '@packing-list/state';

vi.useFakeTimers();

vi.mock('react-confetti-boom', () => ({
  default: () => <div data-testid="confetti" />,
}));

vi.mock('@packing-list/state', () => ({
  useAppSelector: vi.fn(),
}));

describe('ConfettiBurst Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders and clears bursts', () => {
    (state.useAppSelector as Mock).mockReturnValue({
      ui: { confetti: { burstId: 1, source: { x: 0, y: 0, w: 0, h: 0 } } },
    });
    render(<ConfettiBurst />);
    expect(screen.getByTestId('confetti')).toBeInTheDocument();
    vi.runAllTimers();
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import type { Mock } from 'vitest';
import { FlowBackButton } from './FlowBackButton';
import * as state from '@packing-list/state';
import { navigate } from 'vike/client/router';

vi.mock('@packing-list/state', () => ({
  useAppSelector: vi.fn(),
  useAppDispatch: vi.fn(),
  actions: { advanceFlow: vi.fn((n: number) => ({ type: 'ADV', payload: n })) },
}));

describe('FlowBackButton Component', () => {
  const mockDispatch = vi.fn();
  const flow = {
    current: 1,
    steps: [
      { path: '/one', label: 'One' },
      { path: '/two', label: 'Two' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (state.useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
    (state.useAppSelector as Mock).mockImplementation((sel) =>
      sel({ ui: { flow } })
    );
  });

  it('navigates to previous step on click', () => {
    render(<FlowBackButton />);
    fireEvent.click(screen.getByTestId('flow-back-button'));
    expect(state.actions.advanceFlow).toHaveBeenCalledWith(-1);
    expect(mockDispatch).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/one');
  });
});

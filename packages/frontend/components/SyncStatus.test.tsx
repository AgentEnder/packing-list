import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { SyncStatus } from './SyncStatus';
import * as state from '@packing-list/state';

vi.mock('@packing-list/shared-components', () => ({
  SyncStatusIndicator: ({ onClick }: { onClick?: () => void }) => (
    <button data-testid="status-indicator" onClick={onClick}>
      Status
    </button>
  ),
  ConflictList: ({
    onResolveConflict,
  }: {
    onResolveConflict: (c: any) => void;
  }) => (
    <div data-testid="conflict-list">
      <button onClick={() => onResolveConflict({ id: 'c1' })}>Select</button>
    </div>
  ),
  ConflictResolutionModal: ({ isOpen, onClose, onResolve, conflict }: any) =>
    isOpen ? (
      <div data-testid="resolution-modal">
        <span>{conflict.id}</span>
        <button
          data-testid="resolve"
          onClick={() => onResolve('local')}
        ></button>
        <button data-testid="close" onClick={onClose}></button>
      </div>
    ) : null,
}));

vi.mock('@packing-list/state', () => ({
  useAppSelector: vi.fn(),
  useAppDispatch: vi.fn(),
  resolveConflict: vi.fn(() => ({ type: 'RESOLVE' })),
}));

describe('SyncStatus Component', () => {
  const mockDispatch = vi.fn();
  const mockState = {
    sync: {
      syncState: {
        conflicts: [{ id: 'c1' }],
        isOnline: true,
        isSyncing: false,
        pendingChanges: [],
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (state.useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
    (state.useAppSelector as Mock).mockImplementation((sel) => sel(mockState));
  });

  it('opens conflicts modal when status clicked', () => {
    render(<SyncStatus />);
    fireEvent.click(screen.getByTestId('status-indicator'));
    expect(screen.getByTestId('conflict-list')).toBeInTheDocument();
  });

  it('opens resolution modal when conflict selected and resolves', () => {
    render(<SyncStatus />);
    fireEvent.click(screen.getByTestId('status-indicator'));
    fireEvent.click(screen.getByText('Select'));
    expect(screen.getByTestId('resolution-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('resolve'));
    expect(state.resolveConflict).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('close'));
    expect(screen.queryByTestId('resolution-modal')).not.toBeInTheDocument();
  });
});

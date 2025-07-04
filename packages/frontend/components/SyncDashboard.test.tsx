import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import type { Mock } from 'vitest';
import { SyncDashboard } from './SyncDashboard';
import * as state from '@packing-list/state';

vi.mock('@packing-list/shared-components', () => ({
  SyncStatusIndicator: () => <div data-testid="status" />,
  ConflictList: () => <div data-testid="conflict-list" />,
  ConflictResolutionModal: () => <div data-testid="resolution-modal" />,
}));

vi.mock('@packing-list/state', () => ({
  useAppSelector: vi.fn(),
  useAppDispatch: vi.fn(),
  resolveConflict: vi.fn(),
}));

describe('SyncDashboard Component', () => {
  const mockDispatch = vi.fn();
  const baseState = {
    sync: {
      syncState: {
        conflicts: [],
        isOnline: true,
        isSyncing: false,
        pendingChanges: [],
        lastSyncTimestamp: null,
      },
      isInitialized: true,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (state.useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
    (state.useAppSelector as Mock).mockImplementation((sel) => sel(baseState));
  });

  it('dispatches action when adding a mock conflict', () => {
    render(<SyncDashboard />);
    fireEvent.click(screen.getByText('Add Single Conflict'));
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('shows conflict list when conflicts exist', () => {
    const conflictState = {
      sync: {
        ...baseState.sync,
        syncState: {
          ...baseState.sync.syncState,
          conflicts: [{ id: 'c1' }],
        },
      },
    };
    (state.useAppSelector as Mock).mockImplementation((sel) =>
      sel(conflictState)
    );
    render(<SyncDashboard />);
    expect(screen.getByTestId('conflict-list')).toBeInTheDocument();
  });
});

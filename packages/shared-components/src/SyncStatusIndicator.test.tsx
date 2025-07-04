import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SyncStatusBadge } from './SyncStatusIndicator.js';
import type { SyncState } from '@packing-list/model';

vi.mock('lucide-react', () => ({
  Wifi: ({ className }: { className?: string }) => (
    <div data-testid="wifi" className={className} />
  ),
  WifiOff: ({ className }: { className?: string }) => (
    <div data-testid="wifi-off" className={className} />
  ),
  RotateCw: ({ className }: { className?: string }) => (
    <div data-testid="rotate" className={className} />
  ),
  AlertTriangle: ({ className }: { className?: string }) => (
    <div data-testid="alert" className={className} />
  ),
  CheckCircle: ({ className }: { className?: string }) => (
    <div data-testid="check" className={className} />
  ),
  Clock: ({ className }: { className?: string }) => (
    <div data-testid="clock" className={className} />
  ),
}));

const baseState: SyncState = {
  lastSyncTimestamp: null,
  isOnline: true,
  isSyncing: false,
  pendingChanges: [],
  conflicts: [],
};

describe('SyncStatusBadge', () => {
  it('shows offline status', () => {
    const state = { ...baseState, isOnline: false };
    render(<SyncStatusBadge syncState={state} />);
    expect(screen.getByTestId('sync-offline-badge')).toBeInTheDocument();
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('shows syncing status', () => {
    const state = { ...baseState, isSyncing: true };
    render(<SyncStatusBadge syncState={state} />);
    expect(screen.getByTestId('sync-syncing-badge')).toBeInTheDocument();
    expect(screen.getByText('Syncing...')).toBeInTheDocument();
  });

  it('shows pending changes', () => {
    const state = {
      ...baseState,
      pendingChanges: [
        {
          id: '1',
          operation: 'update',
          timestamp: 0,
          userId: 'u',
          version: 1,
          synced: false,
          entityType: 'trip',
          entityId: 't',
          data: { id: 't' },
        },
      ],
    } as unknown as SyncState;
    render(<SyncStatusBadge syncState={state} />);
    expect(screen.getByTestId('sync-pending-badge')).toBeInTheDocument();
    expect(screen.getByText('1 pending')).toBeInTheDocument();
  });

  it('shows conflict status', () => {
    const state = {
      ...baseState,
      conflicts: [
        {
          id: 'c',
          entityType: 'trip',
          entityId: 't',
          localVersion: {},
          serverVersion: {},
          conflictType: 'update_conflict' as const,
          timestamp: 0,
        },
      ],
    };
    render(<SyncStatusBadge syncState={state} />);
    expect(screen.getByTestId('sync-conflict-badge')).toBeInTheDocument();
    expect(screen.getByText('1 conflict')).toBeInTheDocument();
  });

  it('shows synced status when no issues', () => {
    render(<SyncStatusBadge syncState={baseState} />);
    expect(screen.getByTestId('sync-synced-badge')).toBeInTheDocument();
    expect(screen.getByText('Synced')).toBeInTheDocument();
  });
});
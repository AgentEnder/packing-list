import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConflictList } from './ConflictList.js';
import type { SyncConflict } from '@packing-list/model';

vi.mock('lucide-react', () => ({
  AlertTriangle: ({ className }: { className?: string }) => (
    <div data-testid="alert" className={className} />
  ),
  Clock: ({ className }: { className?: string }) => (
    <div data-testid="clock" className={className} />
  ),
  ChevronRight: ({ className }: { className?: string }) => (
    <div data-testid="chevron" className={className} />
  ),
}));

const makeConflict = (id: string): SyncConflict => ({
  id,
  entityType: 'trip',
  entityId: 't',
  localVersion: { name: 'Local' },
  serverVersion: { name: 'Server' },
  conflictType: 'update_conflict',
  timestamp: Date.now(),
});

describe('ConflictList', () => {
  it('shows empty state', () => {
    render(<ConflictList conflicts={[]} onResolveConflict={() => undefined} />);
    expect(screen.getByText('No sync conflicts')).toBeInTheDocument();
  });

  it('calls onResolveConflict when item clicked', () => {
    const conflict = makeConflict('1');
    const onResolve = vi.fn();
    render(
      <ConflictList conflicts={[conflict]} onResolveConflict={onResolve} />
    );
    const element = screen.getByText('Trip Conflict').parentElement?.parentElement;
    if (element) {
      fireEvent.click(element);
    }
    expect(onResolve).toHaveBeenCalledWith(conflict);
  });

  it('handles bulk resolve actions', () => {
    const conflicts = [makeConflict('1'), makeConflict('2')];
    const onResolveAll = vi.fn();
    render(
      <ConflictList
        conflicts={conflicts}
        onResolveConflict={() => undefined}
        onResolveAll={onResolveAll}
      />
    );

    fireEvent.click(screen.getByText('Use Server (All)'));
    expect(onResolveAll).toHaveBeenCalledWith('server');
    fireEvent.click(screen.getByText('Keep Local (All)'));
    expect(onResolveAll).toHaveBeenCalledWith('local');
  });
});
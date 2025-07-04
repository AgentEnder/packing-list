import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConflictBanner } from './ConflictBanner.js';
import { BannerProvider } from './Banner.js';
import type { SyncConflict } from '@packing-list/model';

vi.mock('lucide-react', () => ({
  AlertTriangle: ({ className }: { className?: string }) => (
    <div data-testid="alert" className={className} />
  ),
  Eye: ({ className }: { className?: string }) => (
    <div data-testid="eye" className={className} />
  ),
  X: ({ className }: { className?: string }) => (
    <div data-testid="x" className={className} />
  ),
}));

const conflict: SyncConflict = {
  id: 'c',
  entityType: 'trip',
  entityId: 't',
  localVersion: {},
  serverVersion: {},
  conflictType: 'update_conflict',
  timestamp: 0,
};

describe('ConflictBanner', () => {
  it('renders and handles actions', () => {
    const onView = vi.fn();
    const onDismiss = vi.fn();

    render(
      <BannerProvider>
        <ConflictBanner
          conflicts={[conflict]}
          onViewConflicts={onView}
          onDismiss={onDismiss}
        />
      </BannerProvider>
    );

    expect(
      screen.getByText('1 sync conflict needs attention')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText('Resolve'));
    expect(onView).toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText('Dismiss'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('does not render when no conflicts', () => {
    render(
      <BannerProvider>
        <ConflictBanner conflicts={[]} onViewConflicts={() => undefined} />
      </BannerProvider>
    );
    expect(screen.queryByText(/sync conflict/)).toBeNull();
  });
});
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { ConflictDiffView } from './ConflictDiffView.js';

vi.mock('lucide-react', () => ({
  ChevronDown: ({ className }: { className?: string }) => (
    <div data-testid="chevron-down" className={className} />
  ),
  ChevronRight: ({ className }: { className?: string }) => (
    <div data-testid="chevron-right" className={className} />
  ),
  Plus: ({ className }: { className?: string }) => (
    <div data-testid="plus" className={className} />
  ),
  Minus: ({ className }: { className?: string }) => (
    <div data-testid="minus" className={className} />
  ),
  Edit3: ({ className }: { className?: string }) => (
    <div data-testid="edit3" className={className} />
  ),
}));

describe('ConflictDiffView', () => {
  it('renders diff information', () => {
    render(
      <ConflictDiffView
        localData={{ title: 'A', count: 1 }}
        serverData={{ title: 'B', count: 1, extra: true }}
      />
    );

    expect(screen.getByText('2 fields changed')).toBeInTheDocument();
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('extra')).toBeInTheDocument();
    expect(screen.getByText('Show 1 unchanged fields')).toBeInTheDocument();
  });
});

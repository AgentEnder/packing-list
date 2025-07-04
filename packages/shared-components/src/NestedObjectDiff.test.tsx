import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { NestedObjectDiff } from './NestedObjectDiff.js';

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

describe('NestedObjectDiff', () => {
  it('shows primitive differences', () => {
    render(<NestedObjectDiff localValue="a" serverValue="b" />);
    expect(screen.getByText('Local')).toBeInTheDocument();
    expect(screen.getByText('"a"')).toBeInTheDocument();
    expect(screen.getByText('"b"')).toBeInTheDocument();
  });

  it('handles nested object expansion', () => {
    render(
      <NestedObjectDiff
        localValue={{ a: { b: 1 } }}
        serverValue={{ a: { b: 2 } }}
        expanded={false}
      />
    );
    fireEvent.click(screen.getByText('Expand details'));
    expect(screen.getByText('Object Differences')).toBeInTheDocument();
    expect(screen.getByText('b:')).toBeInTheDocument();
  });
});

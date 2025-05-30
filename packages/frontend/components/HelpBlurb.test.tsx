import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { HelpBlurb, HELP_ALL_KEY } from './HelpBlurb';

describe('HelpBlurb Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders with title and content', () => {
    render(
      <HelpBlurb title="Test Title" storageKey="test">
        <p>Test content</p>
      </HelpBlurb>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('hides when dismissed', () => {
    render(
      <HelpBlurb title="Test Title" storageKey="test">
        <p>Test content</p>
      </HelpBlurb>
    );

    const dismissButton = screen.getByLabelText('Dismiss help');
    fireEvent.click(dismissButton);

    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
    expect(localStorage.getItem('help-test')).toBe('hidden');
  });

  it('stays hidden on subsequent renders when previously dismissed', () => {
    localStorage.setItem('help-test', 'hidden');

    render(
      <HelpBlurb title="Test Title" storageKey="test">
        <p>Test content</p>
      </HelpBlurb>
    );

    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
  });

  it('stays hidden when help is globally disabled', () => {
    localStorage.setItem(HELP_ALL_KEY, 'hidden');

    render(
      <HelpBlurb title="Test Title" storageKey="test">
        <p>Test content</p>
      </HelpBlurb>
    );

    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
  });

  it('renders dismiss button with icon', () => {
    render(
      <HelpBlurb title="Test Title" storageKey="test">
        <p>Test content</p>
      </HelpBlurb>
    );

    const dismissButton = screen.getByLabelText('Dismiss help');
    expect(dismissButton).toHaveClass(
      'btn',
      'btn-sm',
      'btn-ghost',
      'btn-circle'
    );
    expect(dismissButton.querySelector('.lucide-x')).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    render(
      <HelpBlurb title="Test Title" storageKey="test">
        <p>Test content</p>
      </HelpBlurb>
    );

    expect(screen.getByRole('heading')).toHaveClass('card-title');
    expect(screen.getByText('Test content').closest('.card')).toHaveClass(
      'bg-base-100',
      'shadow-xl',
      'mb-6'
    );
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Modal, ConfirmDialog } from './Dialog.js';

// Mock icons used in the modal
vi.mock('lucide-react', () => ({
  X: ({ className }: { className?: string }) => (
    <div data-testid="icon-x" className={className} />
  ),
}));

describe('Modal component', () => {
  it('renders children when open', () => {
    render(
      <Modal isOpen onClose={() => undefined} title="Test Modal">
        <span>Content</span>
      </Modal>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<Modal isOpen onClose={onClose} title="Close Test"><div>Test content</div></Modal>);
    fireEvent.click(screen.getByLabelText('Close modal'));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on escape key', () => {
    const onClose = vi.fn();
    render(<Modal isOpen onClose={onClose}><div>Test content</div></Modal>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on backdrop click', () => {
    const onClose = vi.fn();
    render(<Modal isOpen onClose={onClose}><div>Test content</div></Modal>);
    const backdrop = screen.getByRole('button', { name: 'close' });
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('ConfirmDialog component', () => {
  it('handles confirm and cancel actions', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        isOpen
        onClose={onClose}
        message="Are you sure?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByTestId('confirm-dialog-cancel-button'));
    expect(onCancel).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('confirm-continue-button'));
    expect(onConfirm).toHaveBeenCalled();
  });
});
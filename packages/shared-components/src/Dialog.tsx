import { X } from 'lucide-react';
import { useEffect, ReactNode } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  modalBoxClassName?: string;
  zIndex?: string;
  'data-testid'?: string;
  ariaLabelledBy?: string;
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
  modalBoxClassName = '',
  zIndex = 'z-50',
  'data-testid': testId,
  ariaLabelledBy,
}: ModalProps) {
  useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'w-11/12 max-w-5xl',
  };

  const handleBackdropClick = () => {
    if (closeOnBackdropClick) {
      onClose();
    }
  };

  return (
    <div
      className={`modal modal-open ${zIndex} ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy || (title ? 'modal-title' : undefined)}
      data-testid={testId}
    >
      <div className={`modal-box ${sizeClasses[size]} ${modalBoxClassName}`}>
        {/* Header with title and close button */}
        {(title || showCloseButton) && (
          <div className="flex justify-between items-center mb-4">
            {title && (
              <h3
                id={ariaLabelledBy || 'modal-title'}
                className="font-bold text-lg"
              >
                {title}
              </h3>
            )}
            {showCloseButton && (
              <button
                className="btn btn-sm btn-circle btn-ghost"
                onClick={onClose}
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {children}
      </div>

      {/* Backdrop */}
      <form
        method="dialog"
        className="modal-backdrop"
        onClick={handleBackdropClick}
      >
        <button type="button">close</button>
      </form>
    </div>
  );
}

// Convenience components for common modal patterns
export interface ConfirmDialogProps extends Omit<ModalProps, 'children'> {
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'error' | 'warning';
  onConfirm: () => void;
  onCancel?: () => void;
}

export function ConfirmDialog({
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  onClose,
  ...modalProps
}: ConfirmDialogProps) {
  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const confirmButtonClass = {
    primary: 'btn btn-primary',
    error: 'btn btn-error',
    warning: 'btn btn-warning',
  }[confirmVariant];

  return (
    <Modal {...modalProps} onClose={onClose}>
      <p className="py-4">{message}</p>
      <div className="modal-action">
        <button className="btn" onClick={handleCancel}>
          {cancelText}
        </button>
        <button className={confirmButtonClass} onClick={handleConfirm}>
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

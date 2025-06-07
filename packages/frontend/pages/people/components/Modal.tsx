import { ReactNode } from 'react';
import { Modal as SharedModal } from '@packing-list/shared-components';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
};

export const Modal = ({ open, onClose, children, title }: ModalProps) => {
  return (
    <SharedModal
      isOpen={open}
      onClose={onClose}
      title={title}
      size="md"
      showCloseButton={!title} // Only show close button if no title (for backward compatibility)
    >
      {children}
    </SharedModal>
  );
};

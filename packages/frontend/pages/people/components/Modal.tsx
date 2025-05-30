import { ReactNode } from 'react';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export const Modal = ({ open, onClose, children }: ModalProps) => {
  if (!open) return null;

  return (
    <dialog className={`modal ${open ? 'modal-open' : ''}`}>
      <div className="modal-box relative">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>
        {children}
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
};

import React from 'react';
import { useAppDispatch } from '@packing-list/state';
import { PackingListItem } from '@packing-list/model';

interface RuleOverrideDialogProps {
  item: PackingListItem;
  isOpen: boolean;
  onClose: () => void;
}

export const RuleOverrideDialog: React.FC<RuleOverrideDialogProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  const dispatch = useAppDispatch();

  const handleOverride = (quantity: number) => {
    dispatch({
      type: 'OVERRIDE_ITEM_QUANTITY',
      itemId: item.id,
      quantity,
    });
    onClose();
  };

  const handleResetOverride = () => {
    dispatch({
      type: 'RESET_ITEM_OVERRIDE',
      itemId: item.id,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`modal ${isOpen ? 'modal-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="override-dialog-title"
    >
      <div className="modal-box">
        <h3 id="override-dialog-title" className="font-bold text-lg">
          Override {item.name} Quantity
        </h3>
        <p className="py-4">
          {item.isOverridden
            ? `Current quantity is overridden to ${item.quantity}`
            : `Current quantity is calculated to ${item.quantity}`}
        </p>
        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          {item.isOverridden && (
            <button className="btn btn-error" onClick={handleResetOverride}>
              Reset to Calculated
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={() => handleOverride(item.quantity + 1)}
          >
            Add One
          </button>
          {item.quantity > 0 && (
            <button
              className="btn btn-primary"
              onClick={() => handleOverride(item.quantity - 1)}
            >
              Remove One
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

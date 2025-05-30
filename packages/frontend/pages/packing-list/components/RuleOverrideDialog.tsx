import { useState } from 'react';
import { useAppDispatch } from '@packing-list/state';
import { PackingListItem } from '@packing-list/model';

export type RuleOverrideDialogProps = {
  item: PackingListItem;
  isOpen: boolean;
  onClose: () => void;
};

export const RuleOverrideDialog: React.FC<RuleOverrideDialogProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const [quantity, setQuantity] = useState(item.quantity);
  const [isExcluded, setIsExcluded] = useState(item.isOverridden);

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_ITEM_OVERRIDE',
      payload: {
        itemId: item.id,
        quantity,
        isExcluded,
      },
    });
    onClose();
  };

  return (
    <dialog className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Override {item.name}</h3>

        <div className="form-control w-full mb-6">
          <label className="label">
            <span className="label-text">Quantity</span>
            <span className="label-text-alt">Original: {item.quantity}</span>
          </label>
          <div className="join">
            <button
              className="btn join-item"
              onClick={() => setQuantity(Math.max(0, quantity - 1))}
            >
              -
            </button>
            <input
              type="number"
              className="input input-bordered join-item w-20 text-center"
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(0, parseInt(e.target.value) || 0))
              }
              min="0"
            />
            <button
              className="btn join-item"
              onClick={() => setQuantity(quantity + 1)}
            >
              +
            </button>
          </div>
        </div>

        <div className="form-control mb-6">
          <label className="label cursor-pointer">
            <span className="label-text">Exclude this item</span>
            <input
              type="checkbox"
              className="toggle toggle-error"
              checked={isExcluded}
              onChange={(e) => setIsExcluded(e.target.checked)}
            />
          </label>
          {isExcluded && (
            <span className="label-text-alt text-error mt-1">
              This item will be removed from your packing list
            </span>
          )}
        </div>

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`btn ${isExcluded ? 'btn-error' : 'btn-primary'}`}
            onClick={handleSave}
          >
            {isExcluded ? 'Exclude Item' : 'Save Changes'}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
};

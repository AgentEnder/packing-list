import React from 'react';
import { useAppDispatch, useAppSelector } from '@packing-list/state';
import { PackingListItem } from '@packing-list/model';

type GroupMetadata = {
  isExtra?: boolean;
  dayIndex?: number;
  dayStart?: number;
  dayEnd?: number;
};

interface PackItemsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupedItem: {
    baseItem: PackingListItem;
    instances: PackingListItem[];
    displayName: string;
    totalCount: number;
    packedCount: number;
    metadata: GroupMetadata;
  };
}

export const PackItemsDialog: React.FC<PackItemsDialogProps> = ({
  isOpen,
  onClose,
  groupedItem,
}) => {
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector((state) => state.packingListView.viewMode);

  if (!isOpen) return null;

  const handleToggleItem = (item: PackingListItem) => {
    dispatch({
      type: 'TOGGLE_ITEM_PACKED',
      payload: { itemId: item.id },
    });
    item.isPacked = !item.isPacked;
  };

  // Get the base name and any relevant context for the header
  let headerText = groupedItem.displayName;

  if (viewMode === 'by-day') {
    // Add day information to the header in day view
    const { dayIndex, dayStart, dayEnd } = groupedItem.metadata;
    if (dayStart !== undefined && dayEnd !== undefined && dayStart !== dayEnd) {
      headerText += ` (Days ${dayStart + 1}-${dayEnd + 1})`;
    } else if (dayIndex !== undefined) {
      headerText += ` (Day ${dayIndex + 1})`;
    }
  } else if (viewMode === 'by-person' && groupedItem.baseItem.personName) {
    headerText += ` (${groupedItem.baseItem.personName})`;
  }

  // Group instances by extra status
  const baseItems = groupedItem.instances.filter((item) => !item.isExtra);
  const extraItems = groupedItem.instances.filter((item) => item.isExtra);

  return (
    <dialog className="modal" open={isOpen}>
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Pack {headerText}</h3>
        <div className="space-y-4">
          {/* Base items */}
          {baseItems.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Base Items</h4>
              <div className="space-y-2">
                {baseItems.map((item) => {
                  let itemLabel = item.itemName;
                  let quantityLabel = '';

                  if (viewMode === 'by-day') {
                    // In day view, show person name for each instance
                    itemLabel = item.personName || 'General';
                  } else {
                    // In person view, show day information
                    if (item.dayIndex !== undefined) {
                      itemLabel += ` (Day ${item.dayIndex + 1})`;
                    }
                  }

                  // Add quantity information
                  if (item.quantity > 1) {
                    quantityLabel = ` - ${item.quantity} needed`;
                  }

                  return (
                    <label
                      key={item.id}
                      className="flex items-center gap-2 p-2 hover:bg-base-200 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={item.isPacked}
                        onChange={() => handleToggleItem(item)}
                      />
                      <span>
                        {itemLabel}
                        <span className="text-base-content/70">
                          {quantityLabel}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Extra items */}
          {extraItems.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Extra Items</h4>
              <div className="space-y-2">
                {extraItems.map((item) => {
                  let itemLabel = item.itemName;
                  let quantityLabel = '';

                  if (viewMode === 'by-day') {
                    // In day view, show person name for each instance
                    itemLabel = item.personName || 'General';
                  } else {
                    // In person view, show day information
                    if (item.dayIndex !== undefined) {
                      itemLabel += ` (Day ${item.dayIndex + 1})`;
                    }
                  }

                  // Add quantity information
                  if (item.quantity > 1) {
                    quantityLabel = ` - ${item.quantity} needed`;
                  }

                  return (
                    <label
                      key={item.id}
                      className="flex items-center gap-2 p-2 hover:bg-base-200 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={item.isPacked}
                        onChange={() => handleToggleItem(item)}
                      />
                      <span>
                        {itemLabel}
                        <span className="text-base-content/70">
                          {quantityLabel}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
};

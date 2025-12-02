import React from 'react';
import {
  selectPackingListViewMode,
  useAppDispatch,
  useAppSelector,
} from '@packing-list/state';
import { PackingListItem } from '@packing-list/model';
import { GroupMetadata } from '@packing-list/state';
import { Modal } from '@packing-list/shared-components';
import {
  splitInstancesByExtraStatus,
  getItemLabel,
  getQuantityLabel,
} from '../utils/item-formatting';
import { getAllCategories } from '@packing-list/model';

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
  canEdit?: boolean;
}

export const PackItemsDialog: React.FC<PackItemsDialogProps> = ({
  isOpen,
  onClose,
  groupedItem,
  canEdit = true,
}) => {
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector(selectPackingListViewMode);
  const categories = getAllCategories();

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
  const { baseItems, extraItems } = splitInstancesByExtraStatus(
    groupedItem.instances
  );

  const renderItem = (item: PackingListItem) => {
    const itemLabel = getItemLabel(item, viewMode);
    const quantityLabel = getQuantityLabel(item.quantity);
    const category = categories.find((cat) => cat.id === item.categoryId);
    // Check both item.subcategoryId and baseItem.subcategoryId for backwards compatibility
    const subcategoryId =
      item.subcategoryId || groupedItem.baseItem.subcategoryId;
    const subcategory = categories.find((cat) => cat.id === subcategoryId);

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
          disabled={!canEdit}
        />
        <div className="flex flex-col gap-0.5">
          <span>
            {itemLabel}
            <span className="text-base-content/70">{quantityLabel}</span>
          </span>
          {category && (
            <span className="text-xs text-base-content/70">
              {category.name}
              {subcategory && ` / ${subcategory.name}`}
            </span>
          )}
        </div>
      </label>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Pack ${headerText}`}
      size="lg"
      data-testid="pack-items-modal"
      ariaLabelledBy="pack-dialog-title"
    >
      <div className="space-y-4" data-testid="pack-dialog-content">
        {/* Base items */}
        {baseItems.length > 0 && (
          <div data-testid="base-items-section">
            <h4 className="font-medium mb-2">Base Items</h4>
            <div className="space-y-2">{baseItems.map(renderItem)}</div>
          </div>
        )}

        {/* Extra items */}
        {extraItems.length > 0 && (
          <div data-testid="extra-items-section">
            <h4 className="font-medium mb-2">Extra Items</h4>
            <div className="space-y-2">{extraItems.map(renderItem)}</div>
          </div>
        )}
      </div>
      <div className="modal-action">
        <button
          className="btn"
          onClick={onClose}
          data-testid="pack-dialog-close"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

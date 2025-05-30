import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@packing-list/state';
import { PackingListViewState } from '@packing-list/model';
import { RuleOverrideDialog } from './RuleOverrideDialog';
import { PackItemsDialog } from './PackItemsDialog';
import { HelpBlurb } from '../../../components/HelpBlurb';
import {
  selectPackingListViewState,
  selectGroupedItems,
  GroupedItem,
  ItemGroup,
  GroupedItemsResult,
} from '@packing-list/state';

export const PackingList: React.FC = () => {
  const dispatch = useAppDispatch();
  const viewState = useAppSelector(selectPackingListViewState);
  const { groupedItems, groupedGeneralItems } =
    useAppSelector(selectGroupedItems);

  const [selectedItem, setSelectedItem] = useState<
    GroupedItem['baseItem'] | null
  >(null);
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
  const [selectedGroupForPacking, setSelectedGroupForPacking] =
    useState<GroupedItem | null>(null);
  const [isPackDialogOpen, setIsPackDialogOpen] = useState(false);

  useEffect(() => {
    // Calculate default items first
    dispatch({ type: 'CALCULATE_DEFAULT_ITEMS' });
    // Then calculate the packing list based on those items and any overrides
    dispatch({ type: 'CALCULATE_PACKING_LIST' });
  }, [dispatch]);

  const handleViewModeChange = (mode: PackingListViewState['viewMode']) => {
    dispatch({
      type: 'UPDATE_PACKING_LIST_VIEW',
      payload: { viewMode: mode },
    });
  };

  const handleFilterChange = (filters: PackingListViewState['filters']) => {
    dispatch({
      type: 'UPDATE_PACKING_LIST_VIEW',
      payload: { filters },
    });
  };

  const handleOpenOverrideDialog = (groupedItem: GroupedItem) => {
    setSelectedItem(groupedItem.baseItem);
    setIsOverrideDialogOpen(true);
  };

  const handleCloseOverrideDialog = () => {
    setSelectedItem(null);
    setIsOverrideDialogOpen(false);
  };

  const handleOpenPackDialog = (groupedItem: GroupedItem) => {
    setSelectedGroupForPacking(groupedItem);
    setIsPackDialogOpen(true);
  };

  const handleClosePackDialog = () => {
    setSelectedGroupForPacking(null);
    setIsPackDialogOpen(false);
  };

  const renderGroupedItem = (groupedItem: GroupedItem) => {
    const progress = (groupedItem.packedCount / groupedItem.totalCount) * 100;

    return (
      <li
        key={groupedItem.baseItem.id}
        className="relative overflow-hidden bg-base-100 rounded"
      >
        {/* Progress bar background */}
        <div
          className="absolute inset-0 bg-success/20 transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />

        {/* Content */}
        <div className="relative flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => handleOpenPackDialog(groupedItem)}
            >
              <span className={progress === 100 ? 'text-success' : ''}>
                {groupedItem.packedCount}/{groupedItem.totalCount}
              </span>
            </button>
            <button
              className="hover:underline"
              onClick={() => handleOpenOverrideDialog(groupedItem)}
            >
              {groupedItem.displayName}
            </button>
          </div>
          {groupedItem.baseItem.isOverridden && (
            <span className="badge badge-warning">Modified</span>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Packing List</h1>
        <div className="flex gap-4">
          <div className="btn-group">
            <button
              className={`btn ${
                viewState.viewMode === 'by-day' ? 'btn-active' : ''
              }`}
              onClick={() => handleViewModeChange('by-day')}
            >
              By Day
            </button>
            <button
              className={`btn ${
                viewState.viewMode === 'by-person' ? 'btn-active' : ''
              }`}
              onClick={() => handleViewModeChange('by-person')}
            >
              By Person
            </button>
          </div>
          <div className="flex gap-2">
            <label className="cursor-pointer label">
              <span className="label-text mr-2">Packed</span>
              <input
                type="checkbox"
                className="checkbox"
                checked={viewState.filters.packed}
                onChange={(e) =>
                  handleFilterChange({
                    ...viewState.filters,
                    packed: e.target.checked,
                  })
                }
              />
            </label>
            <label className="cursor-pointer label">
              <span className="label-text mr-2">Unpacked</span>
              <input
                type="checkbox"
                className="checkbox"
                checked={viewState.filters.unpacked}
                onChange={(e) =>
                  handleFilterChange({
                    ...viewState.filters,
                    unpacked: e.target.checked,
                  })
                }
              />
            </label>
            <label className="cursor-pointer label">
              <span className="label-text mr-2">Excluded</span>
              <input
                type="checkbox"
                className="checkbox"
                checked={viewState.filters.excluded}
                onChange={(e) =>
                  handleFilterChange({
                    ...viewState.filters,
                    excluded: e.target.checked,
                  })
                }
              />
            </label>
          </div>
        </div>
      </div>

      <HelpBlurb
        title="How to use this packing list"
        storageKey="packing-list-help"
      >
        <p>
          Your packing list automatically updates based on your trip details and
          rules. Use these features to stay organized:
        </p>

        <h3 className="text-base mt-4 mb-2">Key Features</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 my-4">
          <dt className="font-bold">Views:</dt>
          <dd>Switch between organizing by day or by person</dd>

          <dt className="font-bold">Progress:</dt>
          <dd>Track what's packed with progress bars and counts</dd>

          <dt className="font-bold">Filters:</dt>
          <dd>Show/hide packed items or find specific things</dd>

          <dt className="font-bold">Quantities:</dt>
          <dd>See exactly how many of each item you need</dd>

          <dt className="font-bold">Extras:</dt>
          <dd>Additional items are grouped with their base items</dd>

          <dt className="font-bold">General Items:</dt>
          <dd>Shared items not tied to specific people</dd>
        </dl>

        <div className="bg-base-200 rounded-lg p-4 my-4">
          <h3 className="text-sm font-medium mb-2">Pro Tips</h3>
          <p className="text-sm text-base-content/70 m-0">
            Pack efficiently by:
            <br />
            • Grouping similar items together
            <br />
            • Using search to find related items
            <br />
            • Checking off items as you pack
            <br />• Reviewing the list before departure
          </p>
        </div>
      </HelpBlurb>

      <div className="flex flex-col gap-8">
        {/* View-specific items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupedItems.map((group, index) => (
            <div key={index} className="card bg-base-200">
              <div className="card-body">
                <h2 className="card-title">
                  {group.type === 'day'
                    ? `Day ${group.index + 1} - ${group.day.location}`
                    : group.person.name}
                </h2>
                <ul className="space-y-2">
                  {group.items.map(renderGroupedItem)}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* General items */}
        {groupedGeneralItems.length > 0 && (
          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title">General Items</h2>
              <p className="text-sm text-base-content/70 mb-4">
                These items are not specific to{' '}
                {viewState.viewMode === 'by-day' ? 'days' : 'people'}
              </p>
              <ul className="space-y-2">
                {groupedGeneralItems.map(renderGroupedItem)}
              </ul>
            </div>
          </div>
        )}
      </div>

      {selectedItem && (
        <RuleOverrideDialog
          item={selectedItem}
          isOpen={isOverrideDialogOpen}
          onClose={handleCloseOverrideDialog}
        />
      )}

      {selectedGroupForPacking && (
        <PackItemsDialog
          groupedItem={selectedGroupForPacking}
          isOpen={isPackDialogOpen}
          onClose={handleClosePackDialog}
        />
      )}
    </div>
  );
};

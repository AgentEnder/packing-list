import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@packing-list/state';
import { PackingListViewState } from '@packing-list/model';
import { RuleOverrideDialog } from './RuleOverrideDialog';
import { PackItemsDialog } from './PackItemsDialog';
import { PrintDialog } from './PrintDialog';
import { HelpBlurb } from '../../../components/HelpBlurb';
import {
  selectPackingListViewState,
  selectGroupedItems,
  GroupedItem,
} from '@packing-list/state';
import {
  PackagePlus,
  Info,
  AlertTriangle,
  Check,
  Calendar,
  Users,
  ClipboardList,
  Printer,
} from 'lucide-react';
import { Link } from '../../../components/Link';
import { formatDayInfo } from '../utils/item-formatting';

export const PackingList: React.FC = () => {
  const dispatch = useAppDispatch();
  const viewState = useAppSelector(selectPackingListViewState);
  const { groupedItems, groupedGeneralItems } =
    useAppSelector(selectGroupedItems);
  const trip = useAppSelector((state) => state.trip);
  const people = useAppSelector((state) => state.people);
  const defaultItemRules = useAppSelector((state) => state.defaultItemRules);

  const [selectedItem, setSelectedItem] = useState<
    GroupedItem['baseItem'] | null
  >(null);
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
  const [selectedGroupForPacking, setSelectedGroupForPacking] =
    useState<GroupedItem | null>(null);
  const [isPackDialogOpen, setIsPackDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);

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
        className="relative overflow-hidden bg-base-100 rounded-lg border border-base-200 hover:border-primary transition-colors duration-200"
      >
        {/* Progress bar background */}
        <div
          className="absolute inset-0 bg-success/30 transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />

        {/* Content */}
        <div className="relative flex items-center gap-1.5 p-1.5">
          <button
            className="btn btn-xs sm:btn-sm btn-square shrink-0"
            onClick={() => handleOpenPackDialog(groupedItem)}
          >
            <PackagePlus className="w-3.5 h-3.5" />
          </button>

          <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
            <button
              className="hover:text-primary transition-colors duration-200 truncate text-xs sm:text-sm"
              onClick={() => handleOpenOverrideDialog(groupedItem)}
            >
              {groupedItem.displayName}
            </button>
            {groupedItem.baseItem.notes && (
              <div
                className="tooltip tooltip-right"
                data-tip={groupedItem.baseItem.notes}
              >
                <Info className="w-3.5 h-3.5 stroke-current opacity-60 shrink-0" />
              </div>
            )}
            {groupedItem.baseItem.isOverridden && (
              <div className="badge badge-warning badge-xs sm:badge-sm gap-1 shrink-0">
                <AlertTriangle className="w-3 h-3 stroke-current" />
                <span className="hidden xs:inline">Modified</span>
              </div>
            )}
          </div>

          <span
            className={`shrink-0 tabular-nums text-xs sm:text-sm ${
              progress === 100 ? 'text-success' : ''
            }`}
          >
            {groupedItem.packedCount}/{groupedItem.totalCount}
          </span>
        </div>
      </li>
    );
  };

  // Check if we have any items before filtering
  const hasAnyItems = groupedItems.length > 0 || groupedGeneralItems.length > 0;
  const hasTrip = trip.days.length > 0;
  const hasPeople = people.length > 0;
  const hasRules = defaultItemRules.length > 0;

  // If we have no items, show the empty state
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-bold">Packing List</h1>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => setIsPrintDialogOpen(true)}
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="ml-1.5">Print</span>
          </button>
        </div>

        {/* View Mode and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-3 sm:items-center">
            <label className="text-sm font-medium text-base-content/70 sm:min-w-[4.5rem]">
              View By
            </label>
            <div className="join">
              <button
                className={`btn btn-xs sm:btn-sm join-item ${
                  viewState.viewMode === 'by-day' ? 'btn-active' : ''
                }`}
                onClick={() => handleViewModeChange('by-day')}
              >
                By Day
              </button>
              <button
                className={`btn btn-xs sm:btn-sm join-item ${
                  viewState.viewMode === 'by-person' ? 'btn-active' : ''
                }`}
                onClick={() => handleViewModeChange('by-person')}
              >
                By Person
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-3 sm:items-center sm:ml-6">
            <label className="text-sm font-medium text-base-content/70 sm:min-w-[4.5rem]">
              Show Items
            </label>
            <div className="grid grid-cols-3 sm:flex sm:flex-row gap-1.5 sm:gap-2">
              <label className="flex flex-col sm:flex-row items-center xs:flex-col sm:items-center gap-1.5 p-1.5 xs:p-2 sm:p-0 bg-base-200 sm:bg-transparent rounded-lg sm:rounded-none cursor-pointer hover:bg-base-200 transition-colors sm:px-2">
                <input
                  type="checkbox"
                  className="toggle toggle-success toggle-xs sm:toggle-sm"
                  checked={viewState.filters.packed}
                  onChange={(e) =>
                    handleFilterChange({
                      ...viewState.filters,
                      packed: e.target.checked,
                    })
                  }
                />
                <span className="text-xs sm:text-sm">Packed</span>
              </label>
              <label className="flex flex-col sm:flex-row items-center xs:flex-col sm:items-center gap-1.5 p-1.5 xs:p-2 sm:p-0 bg-base-200 sm:bg-transparent rounded-lg sm:rounded-none cursor-pointer hover:bg-base-200 transition-colors sm:px-2">
                <input
                  type="checkbox"
                  className="toggle toggle-success toggle-xs sm:toggle-sm"
                  checked={viewState.filters.unpacked}
                  onChange={(e) =>
                    handleFilterChange({
                      ...viewState.filters,
                      unpacked: e.target.checked,
                    })
                  }
                />
                <span className="text-xs sm:text-sm">Unpacked</span>
              </label>
              <label className="flex flex-col sm:flex-row items-center xs:flex-col sm:items-center gap-1.5 p-1.5 xs:p-2 sm:p-0 bg-base-200 sm:bg-transparent rounded-lg sm:rounded-none cursor-pointer hover:bg-base-200 transition-colors sm:px-2">
                <input
                  type="checkbox"
                  className="toggle toggle-success toggle-xs sm:toggle-sm"
                  checked={viewState.filters.excluded}
                  onChange={(e) =>
                    handleFilterChange({
                      ...viewState.filters,
                      excluded: e.target.checked,
                    })
                  }
                />
                <span className="text-xs sm:text-sm">Excluded</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <HelpBlurb
        title="How to use this packing list"
        storageKey="packing-list-help"
      >
        <p>
          Your packing list helps you track and organize everything you need for
          your trip. Use these features to make packing easier:
        </p>

        <h3 className="text-base mt-4 mb-2">Key Features</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 my-4">
          <dt className="font-bold">Views:</dt>
          <dd>Switch between organizing by day or by person</dd>
          <dt className="font-bold">Progress:</dt>
          <dd>Track what's packed with progress bars and counts</dd>
          <dt className="font-bold">Filters:</dt>
          <dd>Show/hide packed items or find specific things</dd>
        </dl>

        <div className="bg-base-200 rounded-lg p-4 my-4">
          <h3 className="text-sm font-medium mb-2">Pro Tips</h3>
          <p className="text-sm text-base-content/70 m-0">
            Make the most of your packing list:
            <br />
            • Group similar items together
            <br />
            • Use search to find related items
            <br />
            • Check off items as you pack
            <br />• Review the list before departure
          </p>
        </div>
      </HelpBlurb>

      {!hasAnyItems ? (
        <div className="card bg-base-200 shadow-lg mt-6">
          <div className="card-body">
            <h2 className="card-title">Get Started</h2>
            <p className="text-base-content/70">
              To start building your packing list:
            </p>
            <ol className="list-decimal list-inside space-y-4 mt-4">
              <li>
                <Link href="/days" className="link link-primary">
                  <Calendar className="w-4 h-4 inline-block mr-2" />
                  Add trip days
                </Link>
                {hasTrip && <Check className="w-4 h-4 inline-block ml-2" />}
              </li>
              <li>
                <Link href="/people" className="link link-primary">
                  <Users className="w-4 h-4 inline-block mr-2" />
                  Add people
                </Link>
                {hasPeople && <Check className="w-4 h-4 inline-block ml-2" />}
              </li>
              <li>
                <Link href="/rules" className="link link-primary">
                  <ClipboardList className="w-4 h-4 inline-block mr-2" />
                  Add packing rules
                </Link>
                {hasRules && <Check className="w-4 h-4 inline-block ml-2" />}
              </li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="container mx-auto p-4">
          <div className="flex flex-col gap-6">
            {/* View-specific items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {groupedItems.map((group, index) => (
                <div key={index} className="card bg-base-200 shadow-lg">
                  <div className="card-body p-3">
                    <h2 className="card-title text-sm sm:text-base flex flex-wrap gap-1.5 items-center">
                      {group.type === 'day' ? (
                        <>
                          <span className="min-w-0 truncate">
                            {formatDayInfo(
                              {
                                dayIndex: group.index,
                                dayStart: group.items[0]?.metadata?.dayStart,
                                dayEnd: group.items[0]?.metadata?.dayEnd,
                              },
                              trip.days
                            )}
                          </span>
                          {group.day.location && (
                            <div className="badge badge-primary/20 text-xs">
                              {group.day.location}
                            </div>
                          )}
                        </>
                      ) : (
                        group.person.name
                      )}
                    </h2>
                    <ul className="space-y-1.5">
                      {group.items.map(renderGroupedItem)}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* General items */}
            {groupedGeneralItems.length > 0 && (
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body p-3">
                  <h2 className="card-title text-sm sm:text-base">
                    General Items
                  </h2>
                  <p className="text-xs sm:text-sm text-base-content/70 mb-3">
                    These items are not specific to{' '}
                    {viewState.viewMode === 'by-day' ? 'days' : 'people'}
                  </p>
                  <ul className="space-y-1.5">
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

          <PrintDialog
            isOpen={isPrintDialogOpen}
            onClose={() => setIsPrintDialogOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

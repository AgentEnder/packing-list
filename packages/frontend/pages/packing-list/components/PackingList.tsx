import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@packing-list/state';
import { PackingListViewState } from '@packing-list/model';
import { RuleOverrideDialog } from './RuleOverrideDialog';
import { PackItemsDialog } from './PackItemsDialog';
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
} from 'lucide-react';
import { Link } from '../../../components/Link';

export const PackingList: React.FC = () => {
  const dispatch = useAppDispatch();
  const viewState = useAppSelector(selectPackingListViewState);
  const { groupedItems, groupedGeneralItems } =
    useAppSelector(selectGroupedItems);
  const trip = useAppSelector((state) => state.trip);
  const people = useAppSelector((state) => state.people);
  const defaultItemRules = useAppSelector((state) => state.defaultItemRules);

  const [selectedItem, setSelectedItem] = useState<
    GroupedItem['baseItem'] | 
  >(null);
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
  const [selectedGroupForPacking, setSelectedGroupForPacking] =
    useState<GroupedItem | null>(null);
  const [isPackDialogOpen, setIsPackDialogOpen] = useState(false);

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
        <div className="relative flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <button
              className="btn btn-sm btn-square"
              onClick={() => handleOpenPackDialog(groupedItem)}
            >
              <PackagePlus className="w-4 h-4" />
            </button>
            <button
              className="hover:text-primary transition-colors duration-200"
              onClick={() => handleOpenOverrideDialog(groupedItem)}
            >
              {groupedItem.displayName}
              {groupedItem.baseItem.notes && (
                <div
                  className="tooltip tooltip-right ml-2"
                  data-tip={groupedItem.baseItem.notes}
                >
                  <Info className="w-4 h-4 stroke-current opacity-60" />
                </div>
              )}
            </button>
          </div>
          {groupedItem.baseItem.isOverridden && (
            <div className="badge badge-warning gap-1">
              <AlertTriangle className="w-4 h-4 stroke-current" />
              Modified
            </div>
          )}
          <span className={progress === 100 ? 'text-success' : ''}>
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

  // Show setup help if we have no items
  if (!hasAnyItems) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Packing List</h1>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Setup Your Packing List</h2>
            <p className="text-base-content/70 mb-6">
              To generate your packing list, complete these steps in order:
            </p>
            <div className="space-y-4">
              <div
                className={`flex items-start gap-4 ${
                  hasTrip ? 'opacity-50' : ''
                }`}
              >
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">1. Configure Your Trip</h3>
                  <p className="text-sm text-base-content/70 mb-2">
                    Add your travel dates and destinations to calculate how many
                    days you'll be away.
                  </p>
                  {!hasTrip && (
                    <Link href="/days" className="btn btn-primary btn-sm">
                      Configure Trip
                    </Link>
                  )}
                  {hasTrip && (
                    <div className="badge badge-success gap-2">
                      <Check className="w-4 h-4" />
                      Completed
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`flex items-start gap-4 ${
                  hasPeople ? 'opacity-50' : ''
                }`}
              >
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">2. Add Travelers</h3>
                  <p className="text-sm text-base-content/70 mb-2">
                    Add the people going on the trip so we can calculate
                    personal items.
                  </p>
                  {!hasPeople && hasTrip && (
                    <Link href="/people" className="btn btn-primary btn-sm">
                      Add People
                    </Link>
                  )}
                  {!hasPeople && !hasTrip && (
                    <div className="badge badge-neutral gap-2">
                      Configure trip first
                    </div>
                  )}
                  {hasPeople && (
                    <div className="badge badge-success gap-2">
                      <Check className="w-4 h-4" />
                      Completed
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`flex items-start gap-4 ${
                  hasRules ? 'opacity-50' : ''
                }`}
              >
                <div className="bg-primary/10 p-3 rounded-lg">
                  <ClipboardList className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">3. Create Packing Rules</h3>
                  <p className="text-sm text-base-content/70 mb-2">
                    Set up rules for what to pack (e.g., "1 shirt per day + 1
                    extra").
                  </p>
                  {!hasRules && hasTrip && hasPeople && (
                    <Link href="/defaults" className="btn btn-primary btn-sm">
                      Create Rules
                    </Link>
                  )}
                  {!hasRules && (!hasTrip || !hasPeople) && (
                    <div className="badge badge-neutral gap-2">
                      Complete previous steps first
                    </div>
                  )}
                  {hasRules && (
                    <div className="badge badge-success gap-2">
                      <Check className="w-4 h-4" />
                      Completed
                    </div>
                  )}
                </div>
              </div>

              {hasTrip && hasPeople && hasRules && (
                <div className="alert alert-info mt-4">
                  <Info className="w-6 h-6" />
                  <span>
                    Your packing list is configured but all items are currently
                    filtered out. Try adjusting the filters above to show your
                    items.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Packing List</h1>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="join">
            <button
              className={`btn join-item ${
                viewState.viewMode === 'by-day' ? 'btn-active' : ''
              }`}
              onClick={() => handleViewModeChange('by-day')}
            >
              By Day
            </button>
            <button
              className={`btn join-item ${
                viewState.viewMode === 'by-person' ? 'btn-active' : ''
              }`}
              onClick={() => handleViewModeChange('by-person')}
            >
              By Person
            </button>
          </div>

          <div className="join">
            <label className="join-item btn gap-2">
              <input
                type="checkbox"
                className="toggle toggle-success toggle-sm"
                checked={viewState.filters.packed}
                onChange={(e) =>
                  handleFilterChange({
                    ...viewState.filters,
                    packed: e.target.checked,
                  })
                }
              />
              <span>Packed</span>
            </label>
            <label className="join-item btn gap-2">
              <input
                type="checkbox"
                className="toggle toggle-success toggle-sm"
                checked={viewState.filters.unpacked}
                onChange={(e) =>
                  handleFilterChange({
                    ...viewState.filters,
                    unpacked: e.target.checked,
                  })
                }
              />
              <span>Unpacked</span>
            </label>
            <label className="join-item btn gap-2">
              <input
                type="checkbox"
                className="toggle toggle-success toggle-sm"
                checked={viewState.filters.excluded}
                onChange={(e) =>
                  handleFilterChange({
                    ...viewState.filters,
                    excluded: e.target.checked,
                  })
                }
              />
              <span>Excluded</span>
            </label>
          </div>
        </div>
      </div>

      <HelpBlurb
        title="How to use this packing list"
        storageKey="packing-list-help"
      >
        <div className="alert alert-info shadow-lg">
          <Info className="w-6 h-6 stroke-current shrink-0" />
          <div>
            <h3 className="font-bold">Key Features</h3>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 mt-2">
              <dt className="font-medium">Views:</dt>
              <dd>Switch between organizing by day or by person</dd>
              <dt className="font-medium">Progress:</dt>
              <dd>Track what's packed with progress bars and counts</dd>
              <dt className="font-medium">Filters:</dt>
              <dd>Show/hide packed items or find specific things</dd>
            </dl>
          </div>
        </div>

        <div className="alert alert-success mt-4">
          <Check className="w-6 h-6 stroke-current shrink-0" />
          <div>
            <h3 className="font-bold">Pro Tips</h3>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Group similar items together</li>
              <li>Use search to find related items</li>
              <li>Check off items as you pack</li>
              <li>Review the list before departure</li>
            </ul>
          </div>
        </div>
      </HelpBlurb>

      <div className="flex flex-col gap-8 mt-8">
        {/* View-specific items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupedItems.map((group, index) => (
            <div key={index} className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="card-title flex justify-between items-center">
                  {group.type === 'day' ? (
                    <>
                      <span>Day {group.index + 1}</span>
                      {group.day.location && (
                        <div className="badge badge-primary/20">
                          {group.day.location}
                        </div>
                      )}
                    </>
                  ) : (
                    group.person.name
                  )}
                </h2>
                <ul className="space-y-2 mt-2">
                  {group.items.map(renderGroupedItem)}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* General items */}
        {groupedGeneralItems.length > 0 && (
          <div className="card bg-base-200 shadow-lg">
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

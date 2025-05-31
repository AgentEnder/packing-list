import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@packing-list/state';
import { PackingListViewState, Category } from '@packing-list/model';
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
import { formatDayInfo } from '../utils/item-formatting';
import { PrintButton } from './PrintButton';
import { getAllCategories } from '@packing-list/model';
import { format } from 'date-fns';

export const PackingList: React.FC = () => {
  const dispatch = useAppDispatch();
  const viewState = useAppSelector(selectPackingListViewState);
  const { groupedItems, groupedGeneralItems } =
    useAppSelector(selectGroupedItems);
  const trip = useAppSelector((state) => state.trip);
  const people = useAppSelector((state) => state.people);
  const defaultItemRules = useAppSelector((state) => state.defaultItemRules);
  const categories = getAllCategories();

  const [selectedItem, setSelectedItem] = useState<GroupedItem | null>(null);
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
  const [isPackDialogOpen, setIsPackDialogOpen] = useState(false);

  const handleViewModeChange = (mode: PackingListViewState['viewMode']) => {
    dispatch({
      type: 'UPDATE_PACKING_LIST_VIEW',
      payload: { viewMode: mode },
    });
  };

  const handleFilterChange = (
    filter: keyof PackingListViewState['filters']
  ) => {
    dispatch({
      type: 'UPDATE_PACKING_LIST_VIEW',
      payload: {
        filters: {
          ...viewState.filters,
          [filter]: !viewState.filters[filter],
        },
      },
    });
  };

  const handleOpenOverrideDialog = (item: GroupedItem) => {
    setSelectedItem(item);
    setIsOverrideDialogOpen(true);
  };

  const handleOpenPackDialog = (item: GroupedItem) => {
    setSelectedItem(item);
    setIsPackDialogOpen(true);
  };

  // Helper function to group items by category
  const groupItemsByCategory = (items: GroupedItem[]) => {
    const grouped = new Map<string, GroupedItem[]>();

    // First, group by main categories
    items.forEach((item) => {
      const categoryId = item.baseItem.categoryId || 'uncategorized';
      if (!grouped.has(categoryId)) {
        grouped.set(categoryId, []);
      }
      grouped.get(categoryId)?.push(item);
    });

    // Sort categories by their order in the categories array
    return Array.from(grouped.entries()).sort((a, b) => {
      const catA = categories.findIndex((c) => c.id === a[0]);
      const catB = categories.findIndex((c) => c.id === b[0]);
      return catA - catB;
    });
  };

  const renderGroupedItem = (groupedItem: GroupedItem) => {
    const progress = Math.round(
      (groupedItem.packedCount / groupedItem.totalCount) * 100
    );

    return (
      <li
        key={`${groupedItem.baseItem.id}-${groupedItem.displayName}`}
        className="card bg-base-100 shadow-sm"
      >
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

  const renderGroup = (group: {
    type: 'day' | 'person';
    items: GroupedItem[];
    title: string;
  }) => {
    const categorizedItems = groupItemsByCategory(group.items);

    return (
      <div key={group.title} className="space-y-4">
        <h2 className="text-lg font-semibold">{group.title}</h2>
        {categorizedItems.map(([categoryId, items]) => {
          const category = categories.find((c) => c.id === categoryId);
          const categoryName = category?.name || 'Other Items';

          return (
            <div key={categoryId} className="space-y-2">
              <h3 className="text-sm font-medium text-base-content/70 border-b border-base-content/10 pb-1">
                {categoryName}
              </h3>
              <ul className="space-y-2">
                {items.map((item) => renderGroupedItem(item))}
              </ul>
            </div>
          );
        })}
      </div>
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
          <PrintButton />
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
                <Calendar className="w-3.5 h-3.5" />
                <span className="ml-1.5">By Day</span>
              </button>
              <button
                className={`btn btn-xs sm:btn-sm join-item ${
                  viewState.viewMode === 'by-person' ? 'btn-active' : ''
                }`}
                onClick={() => handleViewModeChange('by-person')}
              >
                <Users className="w-3.5 h-3.5" />
                <span className="ml-1.5">By Person</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-3 sm:items-center">
            <label className="text-sm font-medium text-base-content/70 sm:min-w-[4.5rem]">
              Show
            </label>
            <div className="join">
              <button
                className={`btn btn-xs sm:btn-sm join-item ${
                  viewState.filters.packed ? 'btn-active' : ''
                }`}
                onClick={() => handleFilterChange('packed')}
              >
                <Check className="w-3.5 h-3.5" />
                <span className="ml-1.5">Packed</span>
              </button>
              <button
                className={`btn btn-xs sm:btn-sm join-item ${
                  viewState.filters.unpacked ? 'btn-active' : ''
                }`}
                onClick={() => handleFilterChange('unpacked')}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span className="ml-1.5">Unpacked</span>
              </button>
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
        <div className="space-y-8">
          {/* Main grouped items */}
          {groupedItems.map((group) => {
            let title = '';
            if (group.type === 'day') {
              const date = new Date(group.day.date);
              const dateStr = format(date, 'MMM d');
              title = `Day ${group.index + 1} - ${dateStr}${
                group.day.location ? ` - ${group.day.location}` : ''
              }`;
            } else if (group.type === 'person') {
              title = group.person.name;
            }

            return renderGroup({
              type: group.type,
              items: group.items,
              title,
            });
          })}

          {/* General items */}
          {groupedGeneralItems.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">General Items</h2>
              {groupItemsByCategory(groupedGeneralItems).map(
                ([categoryId, items]) => {
                  const category = categories.find((c) => c.id === categoryId);
                  const categoryName = category?.name || 'Other Items';

                  return (
                    <div key={categoryId} className="space-y-2">
                      <h3 className="text-sm font-medium text-base-content/70 border-b border-base-content/10 pb-1">
                        {categoryName}
                      </h3>
                      <ul className="space-y-2">
                        {items.map((item) => renderGroupedItem(item))}
                      </ul>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      )}

      {selectedItem && (
        <>
          <RuleOverrideDialog
            isOpen={isOverrideDialogOpen}
            onClose={() => {
              setIsOverrideDialogOpen(false);
              setSelectedItem(null);
            }}
            item={selectedItem.baseItem}
          />
          <PackItemsDialog
            isOpen={isPackDialogOpen}
            onClose={() => {
              setIsPackDialogOpen(false);
              setSelectedItem(null);
            }}
            groupedItem={selectedItem}
          />
        </>
      )}
    </div>
  );
};

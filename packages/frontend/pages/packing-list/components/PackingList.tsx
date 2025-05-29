import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@packing-list/state';
import {
  PackingListViewState,
  Day,
  Person,
  PackingListItem,
} from '@packing-list/model';
import { RuleOverrideDialog } from './RuleOverrideDialog';

type DayGroup = {
  type: 'day';
  day: Day;
  index: number;
  items: PackingListItem[];
};

type PersonGroup = {
  type: 'person';
  person: Person;
  items: PackingListItem[];
};

type ItemGroup = DayGroup | PersonGroup;

export const PackingList: React.FC = () => {
  const dispatch = useAppDispatch();
  const viewState = useAppSelector((state) => state.packingListView);
  const items = useAppSelector((state) => state.calculated.packingListItems);
  const people = useAppSelector((state) => state.people);
  const days = useAppSelector((state) => state.trip.days);
  const defaultItemRules = useAppSelector((state) => state.defaultItemRules);

  const [selectedItem, setSelectedItem] = useState<PackingListItem | null>(
    null
  );
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);

  useEffect(() => {
    // Calculate default items first
    dispatch({ type: 'CALCULATE_DEFAULT_ITEMS' });
    // Then calculate the packing list based on those items and any overrides
    dispatch({ type: 'CALCULATE_PACKING_LIST' });
  }, [dispatch, defaultItemRules, people, days]);

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

  const handleTogglePacked = (item: PackingListItem) => {
    dispatch({
      type: 'TOGGLE_ITEM_PACKED',
      payload: { itemId: item.id },
    });
  };

  const handleOpenOverrideDialog = (item: PackingListItem) => {
    setSelectedItem(item);
    setIsOverrideDialogOpen(true);
  };

  const handleCloseOverrideDialog = () => {
    setSelectedItem(null);
    setIsOverrideDialogOpen(false);
  };

  const filteredItems = items.filter((item) => {
    const { packed, unpacked, excluded } = viewState.filters;
    if (item.isPacked && !packed) return false;
    if (!item.isPacked && !unpacked) return false;
    if (item.isOverridden && !excluded) return false;
    return true;
  });

  const groupedItems: ItemGroup[] =
    viewState.viewMode === 'by-day'
      ? days.map((day, index) => ({
          type: 'day',
          day,
          index,
          items: filteredItems.filter((item) =>
            item.applicableDays.includes(index)
          ),
        }))
      : people.map((person) => ({
          type: 'person',
          person,
          items: filteredItems.filter((item) =>
            item.applicablePersons.includes(person.id)
          ),
        }));

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
                {group.items.map((item) => (
                  <li
                    key={item.id}
                    className={`flex items-center justify-between p-2 rounded ${
                      item.isPacked ? 'bg-success/20' : 'bg-base-100'
                    }`}
                  >
                    <span className="flex items-center">
                      <input
                        type="checkbox"
                        className="checkbox mr-2"
                        checked={item.isPacked}
                        onChange={() => handleTogglePacked(item)}
                      />
                      <button
                        className="hover:underline"
                        onClick={() => handleOpenOverrideDialog(item)}
                      >
                        {item.name} ({item.count})
                      </button>
                    </span>
                    {item.isOverridden && (
                      <span className="badge badge-warning">Modified</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {selectedItem && (
        <RuleOverrideDialog
          item={selectedItem}
          isOpen={isOverrideDialogOpen}
          onClose={handleCloseOverrideDialog}
        />
      )}
    </div>
  );
};

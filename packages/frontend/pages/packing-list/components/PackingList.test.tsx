/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PackingList } from './PackingList';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import * as state from '@packing-list/state';
import { PackingListViewState } from '@packing-list/model';

// Mock the state hooks
vi.mock('@packing-list/state', () => ({
  useAppSelector: vi.fn(),
  useAppDispatch: vi.fn(),
  selectPackingListViewState: vi.fn(),
  selectGroupedItems: vi.fn(),
  selectPackingListViewMode: (state: any) => state.packingListView.viewMode,

  selectCurrentTrip: (state: any) => state.trip,
  selectTripDays: (state: any) => state.trip?.days || [],

  selectPeople: (state: any) => state.people,

  selectDefaultItemRules: (state: any) => state.defaultItemRules,
}));

// Mock date-fns format function to ensure consistent timezone-independent results
vi.mock('date-fns', () => ({
  format: vi.fn((date: Date, formatStr: string) => {
    // Mock the format function to return predictable results
    if (formatStr === 'MMM d') {
      // For our test date 2023-12-31T00:00:00.000Z, always return 'Dec 31'
      const timestamp = date.getTime();
      if (timestamp === 1703980800000) {
        // Dec 31, 2023 UTC timestamp
        return 'Dec 31';
      }
      // Fallback for other dates
      return 'Jan 1';
    }
    return formatStr;
  }),
}));

// Mock the page context
vi.mock('../../../components/Link', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('PackingList', () => {
  const mockDispatch = vi.fn();
  const mockViewState: PackingListViewState = {
    viewMode: 'by-day',
    filters: {
      packed: true,
      unpacked: true,
      excluded: false,
    },
  };

  const mockGroupedItems = {
    groupedItems: [
      {
        type: 'day',
        index: 0,
        day: {
          date: new Date('2023-12-31T00:00:00.000Z').getTime(),
          location: 'Beach',
        },
        items: [
          {
            baseItem: {
              id: '1',
              name: 'Sunscreen',
              quantity: 1,
              isPacked: false,
              categoryId: 'essentials',
            },
            instances: [
              {
                id: '1',
                name: 'Sunscreen',
                quantity: 1,
                isPacked: false,
                categoryId: 'essentials',
              },
            ],
            displayName: 'Sunscreen',
            totalCount: 1,
            packedCount: 0,
            metadata: {
              dayIndex: 0,
              dayStart: 0,
              dayEnd: 0,
            },
          },
        ],
      },
    ],
    groupedGeneralItems: [],
  };

  const mockState = {
    trip: {
      id: 'test-trip',
      days: [
        {
          date: new Date('2023-12-31T00:00:00.000Z').getTime(),
          location: 'Beach',
        },
      ],
    },
    people: [{ id: 'person1', name: 'John' }],
    defaultItemRules: [{ id: 'rule1', name: 'Beach Essentials' }],
    packingListView: mockViewState,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    (state.useAppSelector as any).mockImplementation((selector: unknown) => {
      if (selector === state.selectPackingListViewState) return mockViewState;
      if (selector === state.selectPackingListViewMode)
        return mockViewState.viewMode;
      if (selector === state.selectGroupedItems) return mockGroupedItems;
      if (selector === state.selectCurrentTrip) return mockState.trip;
      if (selector === state.selectPeople) return mockState.people;
      if (selector === state.selectDefaultItemRules)
        return mockState.defaultItemRules;
      return {};
    });

    (state.useAppDispatch as any).mockReturnValue(mockDispatch);
  });

  it('renders the packing list title', () => {
    render(
      <Provider store={configureStore({ reducer: (state) => state })}>
        <PackingList />
      </Provider>
    );
    expect(screen.getByText('Packing List')).toBeInTheDocument();
  });

  it('renders view mode toggle buttons', () => {
    render(
      <Provider store={configureStore({ reducer: (state) => state })}>
        <PackingList />
      </Provider>
    );
    expect(screen.getByText('By Day')).toBeInTheDocument();
    expect(screen.getByText('By Person')).toBeInTheDocument();
  });

  it('changes view mode when toggle buttons are clicked', () => {
    render(
      <Provider store={configureStore({ reducer: (state) => state })}>
        <PackingList />
      </Provider>
    );

    fireEvent.click(screen.getByText('By Person'));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_PACKING_LIST_VIEW',
      payload: { viewMode: 'by-person' },
    });
  });

  it('renders filter toggle buttons', () => {
    render(
      <Provider store={configureStore({ reducer: (state) => state })}>
        <PackingList />
      </Provider>
    );
    expect(screen.getByText('Packed')).toBeInTheDocument();
    expect(screen.getByText('Unpacked')).toBeInTheDocument();
  });

  it('changes filters when toggle buttons are clicked', () => {
    render(
      <Provider store={configureStore({ reducer: (state) => state })}>
        <PackingList />
      </Provider>
    );

    fireEvent.click(screen.getByText('Packed'));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_PACKING_LIST_VIEW',
      payload: {
        filters: {
          ...mockViewState.filters,
          packed: false,
        },
      },
    });
  });

  it('renders grouped items correctly', () => {
    render(
      <Provider store={configureStore({ reducer: (state) => state })}>
        <PackingList />
      </Provider>
    );

    expect(screen.getByText('Day 1 - Dec 31 - Beach')).toBeInTheDocument();
    expect(screen.getByText('Sunscreen')).toBeInTheDocument();
  });

  it('shows item notes when available', () => {
    const itemsWithNotes = {
      ...mockGroupedItems,
      groupedItems: [
        {
          ...mockGroupedItems.groupedItems[0],
          items: [
            {
              ...mockGroupedItems.groupedItems[0].items[0],
              baseItem: {
                ...mockGroupedItems.groupedItems[0].items[0].baseItem,
                notes: 'SPF 50+',
              },
            },
          ],
        },
      ],
    };

    (state.useAppSelector as any).mockImplementation((selector: any) => {
      if (selector === state.selectPackingListViewState) return mockViewState;
      if (selector === state.selectGroupedItems) return itemsWithNotes;
      if (selector === state.selectCurrentTrip) return mockState.trip;
      if (selector === state.selectPeople) return mockState.people;
      if (selector === state.selectDefaultItemRules)
        return mockState.defaultItemRules;
      return {};
    });

    render(
      <Provider store={configureStore({ reducer: (state) => state })}>
        <PackingList />
      </Provider>
    );

    const infoIcon = screen.getByTestId('info-icon');
    expect(infoIcon).toBeInTheDocument();
    fireEvent.mouseOver(infoIcon);
    expect(screen.getByText('SPF 50+')).toBeInTheDocument();
  });

  it('shows packing progress for items', () => {
    render(
      <Provider store={configureStore({ reducer: (state) => state })}>
        <PackingList />
      </Provider>
    );

    expect(screen.getByText('0/1')).toBeInTheDocument();
  });

  it('opens pack dialog when pack button is clicked', () => {
    render(
      <Provider store={configureStore({ reducer: (state) => state })}>
        <PackingList />
      </Provider>
    );

    const packButtons = screen.getAllByRole('button', { name: 'Pack' });
    const sunscreenPackButton = packButtons.find(
      (button) => button.getAttribute('aria-description') === 'Pack Sunscreen'
    );
    expect(sunscreenPackButton).toBeTruthy();
    if (!sunscreenPackButton) {
      throw new Error('Sunscreen pack button not found');
    }
    fireEvent.click(sunscreenPackButton);

    const dialog = screen.getByRole('dialog', {
      name: /pack sunscreen/i,
    });
    expect(dialog).toBeInTheDocument();
  });

  it('opens override dialog when item name is clicked', () => {
    render(
      <Provider store={configureStore({ reducer: (state) => state })}>
        <PackingList />
      </Provider>
    );

    fireEvent.click(screen.getByText('Sunscreen'));
    const dialog = screen.getByRole('dialog', {
      name: /override sunscreen quantity/i,
    });
    expect(dialog).toBeInTheDocument();
  });

  it('shows empty state when no items exist', () => {
    (state.useAppSelector as any).mockImplementation((selector: any) => {
      if (selector === state.selectPackingListViewState) return mockViewState;
      if (selector === state.selectGroupedItems)
        return { groupedItems: [], groupedGeneralItems: [] };
      if (selector === state.selectCurrentTrip)
        return { id: 'test-trip', days: [] };
      if (selector === state.selectPeople) return [];
      if (selector === state.selectDefaultItemRules) return [];
      return {};
    });

    render(
      <Provider store={configureStore({ reducer: (state) => state })}>
        <PackingList />
      </Provider>
    );

    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('dismisses help blurb when dismiss button is clicked', () => {
    render(
      <Provider store={configureStore({ reducer: (state) => state })}>
        <PackingList />
      </Provider>
    );

    const dismissButton = screen.getByRole('button', { name: 'Dismiss help' });
    fireEvent.click(dismissButton);
    expect(
      screen.queryByText('How to use this packing list')
    ).not.toBeInTheDocument();
  });

  it('overrides item quantity when override dialog is confirmed', () => {
    render(
      <Provider store={configureStore({ reducer: (state) => state })}>
        <PackingList />
      </Provider>
    );

    fireEvent.click(screen.getByText('Sunscreen'));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    const addButton = within(dialog).getByRole('button', { name: /add one/i });
    fireEvent.click(addButton);
    fireEvent.click(within(dialog).getByRole('button', { name: /cancel/i }));

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'OVERRIDE_ITEM_QUANTITY',
      payload: {
        itemId: '1',
        quantity: 2,
      },
    });
  });

  it('packs items when pack dialog is confirmed', () => {
    render(
      <Provider store={configureStore({ reducer: (state) => state })}>
        <PackingList />
      </Provider>
    );

    const packButton = screen.getAllByRole('button', { name: 'Pack' })[0];
    fireEvent.click(packButton);

    const dialog = screen.getByRole('dialog', { name: /pack sunscreen/i });
    const checkbox = within(dialog).getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'TOGGLE_ITEM_PACKED',
      payload: { itemId: '1' },
    });
  });

  it('groups items by category correctly', () => {
    const itemsWithCategories = {
      ...mockGroupedItems,
      groupedItems: [
        {
          ...mockGroupedItems.groupedItems[0],
          items: [
            {
              ...mockGroupedItems.groupedItems[0].items[0],
              baseItem: {
                ...mockGroupedItems.groupedItems[0].items[0].baseItem,
                categoryId: 'essentials',
              },
            },
            {
              baseItem: {
                id: '2',
                name: 'First Aid Kit',
                quantity: 1,
                isPacked: false,
                categoryId: 'essentials',
              },
              instances: [
                {
                  id: '2',
                  name: 'First Aid Kit',
                  quantity: 1,
                  isPacked: false,
                  categoryId: 'essentials',
                },
              ],
              displayName: 'First Aid Kit',
              totalCount: 1,
              packedCount: 0,
              metadata: {
                dayIndex: 0,
                dayStart: 0,
                dayEnd: 0,
              },
            },
          ],
        },
      ],
    };

    (state.useAppSelector as any).mockImplementation((selector: any) => {
      if (selector === state.selectPackingListViewState) return mockViewState;
      if (selector === state.selectGroupedItems) return itemsWithCategories;
      if (selector === state.selectCurrentTrip) return mockState.trip;
      if (selector === state.selectPeople) return mockState.people;
      if (selector === state.selectDefaultItemRules)
        return mockState.defaultItemRules;
      return {};
    });

    render(
      <Provider store={configureStore({ reducer: (state) => state })}>
        <PackingList />
      </Provider>
    );

    expect(screen.getByText('Essentials')).toBeInTheDocument();
    expect(screen.getByText('Sunscreen')).toBeInTheDocument();
    expect(screen.getByText('First Aid Kit')).toBeInTheDocument();
  });

  it('renders general items section when present', () => {
    const itemsWithGeneral = {
      groupedItems: [],
      groupedGeneralItems: [
        {
          baseItem: {
            id: '3',
            name: 'Passport',
            quantity: 1,
            isPacked: false,
            categoryId: 'documents',
          },
          instances: [
            {
              id: '3',
              name: 'Passport',
              quantity: 1,
              isPacked: false,
              categoryId: 'documents',
            },
          ],
          displayName: 'Passport',
          totalCount: 1,
          packedCount: 0,
        },
      ],
    };

    (state.useAppSelector as any).mockImplementation((selector: any) => {
      if (selector === state.selectPackingListViewState) return mockViewState;
      if (selector === state.selectGroupedItems) return itemsWithGeneral;
      if (selector === state.selectCurrentTrip) return mockState.trip;
      if (selector === state.selectPeople) return mockState.people;
      if (selector === state.selectDefaultItemRules)
        return mockState.defaultItemRules;
      return {};
    });

    render(
      <Provider store={configureStore({ reducer: (state) => state })}>
        <PackingList />
      </Provider>
    );

    expect(screen.getByText('General Items')).toBeInTheDocument();
    expect(screen.getByText('Passport')).toBeInTheDocument();
  });

  it('shows modified badge when item is overridden', () => {
    const itemsWithOverride = {
      ...mockGroupedItems,
      groupedItems: [
        {
          ...mockGroupedItems.groupedItems[0],
          items: [
            {
              ...mockGroupedItems.groupedItems[0].items[0],
              baseItem: {
                ...mockGroupedItems.groupedItems[0].items[0].baseItem,
                isOverridden: true,
              },
            },
          ],
        },
      ],
    };

    (state.useAppSelector as any).mockImplementation((selector: any) => {
      if (selector === state.selectPackingListViewState) return mockViewState;
      if (selector === state.selectGroupedItems) return itemsWithOverride;
      if (selector === state.selectCurrentTrip) return mockState.trip;
      if (selector === state.selectPeople) return mockState.people;
      if (selector === state.selectDefaultItemRules)
        return mockState.defaultItemRules;
      return {};
    });

    render(
      <Provider store={configureStore({ reducer: (state) => state })}>
        <PackingList />
      </Provider>
    );

    expect(screen.getByText('Modified')).toBeInTheDocument();
  });

  it('shows help blurb with correct content', () => {
    render(
      <Provider store={configureStore({ reducer: (state) => state })}>
        <PackingList />
      </Provider>
    );

    expect(
      screen.getByText('How to use this packing list')
    ).toBeInTheDocument();
    expect(screen.getByText('Views:')).toBeInTheDocument();
    expect(screen.getByText('Progress:')).toBeInTheDocument();
    expect(screen.getByText('Filters:')).toBeInTheDocument();
    expect(screen.getByText('Pro Tips')).toBeInTheDocument();
  });

  it('shows empty state with only trip data', () => {
    (state.useAppSelector as any).mockImplementation((selector: any) => {
      if (selector === state.selectPackingListViewState) return mockViewState;
      if (selector === state.selectGroupedItems)
        return { groupedItems: [], groupedGeneralItems: [] };
      if (selector === state.selectCurrentTrip) return mockState.trip;
      if (selector === state.selectPeople) return [];
      if (selector === state.selectDefaultItemRules) return [];
      return {};
    });

    render(
      <Provider store={configureStore({ reducer: (state) => state })}>
        <PackingList />
      </Provider>
    );

    const tripCheckmark = screen.getAllByTestId('check')[0];
    expect(tripCheckmark).toBeInTheDocument();
    expect(screen.getAllByTestId('check')).toHaveLength(1);
  });

  it('shows category and subcategory in pack dialog', () => {
    const itemsWithCategories = {
      ...mockGroupedItems,
      groupedItems: [
        {
          ...mockGroupedItems.groupedItems[0],
          items: [
            {
              ...mockGroupedItems.groupedItems[0].items[0],
              baseItem: {
                ...mockGroupedItems.groupedItems[0].items[0].baseItem,
                categoryId: 'essentials',
                subcategoryId: 'sun-protection',
              },
            },
          ],
        },
      ],
    };

    (state.useAppSelector as any).mockImplementation((selector: any) => {
      if (selector === state.selectPackingListViewState) return mockViewState;
      if (selector === state.selectGroupedItems) return itemsWithCategories;
      if (selector === state.selectCurrentTrip) return mockState.trip;
      if (selector === state.selectPeople) return mockState.people;
      if (selector === state.selectDefaultItemRules)
        return mockState.defaultItemRules;
      return {};
    });

    render(
      <Provider store={configureStore({ reducer: (state) => state })}>
        <PackingList />
      </Provider>
    );

    const packButton = screen.getAllByRole('button', { name: 'Pack' })[0];
    fireEvent.click(packButton);

    expect(screen.getByText('Essentials / Sun Protection')).toBeInTheDocument();
  });

  it('shows day range in pack dialog header when item spans multiple days', () => {
    const itemsWithDayRange = {
      ...mockGroupedItems,
      groupedItems: [
        {
          ...mockGroupedItems.groupedItems[0],
          items: [
            {
              ...mockGroupedItems.groupedItems[0].items[0],
              metadata: {
                dayStart: 0,
                dayEnd: 2,
              },
            },
          ],
        },
      ],
    };

    (state.useAppSelector as any).mockImplementation((selector: any) => {
      if (selector === state.selectPackingListViewState) return mockViewState;
      if (selector === state.selectPackingListViewMode)
        return mockViewState.viewMode;
      if (selector === state.selectGroupedItems) return itemsWithDayRange;
      if (selector === state.selectCurrentTrip) return mockState.trip;
      if (selector === state.selectPeople) return mockState.people;
      if (selector === state.selectDefaultItemRules)
        return mockState.defaultItemRules;
      return {};
    });

    render(
      <Provider store={configureStore({ reducer: (state) => state })}>
        <PackingList />
      </Provider>
    );

    const packButton = screen.getAllByRole('button', { name: 'Pack' })[0];
    fireEvent.click(packButton);

    const allH3Tags = screen.getAllByRole('heading', { level: 3 });

    expect(allH3Tags[allH3Tags.length - 1]).toHaveTextContent(
      'Sunscreen (Days 1-3)'
    );
  });
});

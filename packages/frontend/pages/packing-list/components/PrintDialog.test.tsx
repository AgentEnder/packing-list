/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import {
  vi,
  describe,
  expect,
  it,
  beforeEach,
  afterEach,
  type Mock,
} from 'vitest';
import { PrintDialog } from './PrintDialog';
import * as state from '@packing-list/state';
import * as ReactDOMClient from 'react-dom/client';
import { parseISO } from 'date-fns';

// Mock the state hooks
vi.mock('@packing-list/state', () => ({
  useAppSelector: vi.fn(),
  useAppDispatch: vi.fn(),
  selectGroupedItems: vi.fn(),
}));

// Mock React DOM client
vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(),
}));

// Mock window.open
const mockOpen = vi.fn();
const originalOpen = window.open;

describe('PrintDialog', () => {
  const mockDispatch = vi.fn();
  const mockOnClose = vi.fn();
  let mockRoot: { render: Mock; unmount: Mock };
  let capturedElement: any;

  const mockGroupedItems = {
    groupedItems: [
      {
        type: 'person',
        person: { id: '1', name: 'John' },
        items: [
          {
            displayName: 'Toothbrush',
            baseItem: { id: '1', name: 'Toothbrush', notes: 'Travel size' },
            instances: [
              { dayIndex: 0, quantity: 1, isExtra: false },
              { dayIndex: 1, quantity: 1, isExtra: true },
            ],
            totalCount: 2,
            metadata: { isExtra: false },
          },
        ],
      },
    ],
    groupedGeneralItems: [
      {
        displayName: 'First Aid Kit',
        baseItem: { id: '2', name: 'First Aid Kit', notes: null },
        instances: [{ dayIndex: undefined, quantity: 1, isExtra: false }],
        totalCount: 1,
        metadata: { isExtra: false },
      },
    ],
  };

  const mockDays = [
    { date: '2024-03-20', location: 'Paris' },
    { date: '2024-03-21', location: 'London' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    window.open = mockOpen;

    // Setup mock state
    (
      state.useAppDispatch as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue(mockDispatch);
    (
      state.useAppSelector as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation((selector) => {
      if (selector === state.selectGroupedItems) {
        return mockGroupedItems;
      }
      // Return days when selecting state.trip.days
      if (typeof selector === 'function') {
        return mockDays;
      }
      return {};
    });

    // Set up the mock root
    mockRoot = {
      render: vi.fn((element) => {
        capturedElement = element;
      }),
      unmount: vi.fn(),
    };
    (ReactDOMClient.createRoot as Mock).mockReturnValue(mockRoot);
  });

  afterEach(() => {
    window.open = originalOpen;
    vi.clearAllMocks();
    capturedElement = null;
  });

  it('renders print dialog when open', () => {
    render(<PrintDialog isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Print Packing List')).toBeInTheDocument();
    expect(screen.getByText('Group by Day')).toBeInTheDocument();
    expect(screen.getByText('Group by Person')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<PrintDialog isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByText('Print Packing List')).not.toBeInTheDocument();
  });

  it('switches between day and person view modes', () => {
    render(<PrintDialog isOpen={true} onClose={() => void 0} />);

    const byDayRadio = screen.getByLabelText('Group by Day');
    const byPersonRadio = screen.getByLabelText('Group by Person');

    // Default should be by-day
    expect(byDayRadio).toBeChecked();
    expect(byPersonRadio).not.toBeChecked();

    // Switch to by-person
    fireEvent.click(byPersonRadio);
    expect(byPersonRadio).toBeChecked();
    expect(byDayRadio).not.toBeChecked();
  });

  it('closes dialog when cancel is clicked', () => {
    render(<PrintDialog isOpen={true} onClose={mockOnClose} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  describe('print functionality', () => {
    beforeEach(() => {
      // Reset captured view
      capturedElement = null;
    });

    it('formats dates correctly in person mode', () => {
      const mockWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
          getElementById: vi
            .fn()
            .mockReturnValue(document.createElement('div')),
          readyState: 'complete',
        },
        addEventListener: vi.fn(),
        print: vi.fn(),
      };
      mockOpen.mockReturnValue(mockWindow);

      render(<PrintDialog isOpen={true} onClose={mockOnClose} />);

      // Switch to person mode and print
      const byPersonRadio = screen.getByLabelText('Group by Person');
      fireEvent.click(byPersonRadio);
      const printButton = screen.getByText('Print');
      fireEvent.click(printButton);

      // Verify the PrintableView was rendered with correct data
      expect(capturedElement).toBeTruthy();
      expect(capturedElement.props.mode).toBe('by-person');

      // Verify items are formatted correctly
      const items = capturedElement.props.items;
      expect(items).toBeTruthy();
      expect(items['John']).toBeDefined();
      expect(
        items['John'].some(
          (item: any) =>
            item.name === 'Toothbrush' && item.day?.includes('Day 1')
        )
      ).toBe(true);
    });

    it('handles general items correctly in person mode', () => {
      const mockWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
          getElementById: vi
            .fn()
            .mockReturnValue(document.createElement('div')),
          readyState: 'complete',
        },
        addEventListener: vi.fn(),
        print: vi.fn(),
      };
      mockOpen.mockReturnValue(mockWindow);

      render(<PrintDialog isOpen={true} onClose={mockOnClose} />);

      // Switch to person mode and print
      const byPersonRadio = screen.getByLabelText('Group by Person');
      fireEvent.click(byPersonRadio);
      const printButton = screen.getByText('Print');
      fireEvent.click(printButton);

      // Verify the PrintableView was rendered with correct data
      expect(capturedElement).toBeTruthy();
      expect(capturedElement.props.mode).toBe('by-person');

      // Verify general items are included
      const items = capturedElement.props.items;
      expect(items).toBeTruthy();
      expect(items['General Items']).toBeDefined();
      expect(
        items['General Items'].some(
          (item: any) => item.name === 'First Aid Kit'
        )
      ).toBe(true);
    });

    describe('by-day view', () => {
      beforeEach(() => {
        // Mock the days data and grouped items
        (state.useAppSelector as unknown as Mock).mockImplementation(
          (selector) => {
            if (selector === state.selectGroupedItems) {
              return {
                groupedItems: [
                  {
                    type: 'day',
                    index: 0,
                    day: {
                      // Use UTC timestamp to avoid timezone issues
                      date: parseISO('2024-01-01T12:00:00Z').getTime(),
                      location: 'Beach',
                    },
                    items: [
                      {
                        displayName: 'Sunscreen',
                        baseItem: { notes: 'SPF 50' },
                        instances: [
                          {
                            dayIndex: 0,
                            quantity: 1,
                            isExtra: false,
                            personName: 'John',
                          },
                          {
                            dayIndex: 0,
                            quantity: 1,
                            isExtra: true,
                            personName: 'Jane',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    type: 'person',
                    person: { id: '1', name: 'John' },
                    items: [
                      {
                        displayName: 'Hat',
                        baseItem: { notes: 'Wide brim' },
                        instances: [
                          { dayIndex: 0, quantity: 1, isExtra: false },
                        ],
                      },
                    ],
                  },
                ],
                groupedGeneralItems: [],
              };
            }
            // Return days when selecting state.trip.days
            if (typeof selector === 'function') {
              return [
                {
                  // Use UTC timestamp to avoid timezone issues
                  date: parseISO('2024-01-01T12:00:00Z').getTime(),
                  location: 'Beach',
                },
              ];
            }
            return {};
          }
        );
      });

      it('includes person information for day-specific items', () => {
        const mockDocument = document.createElement('div');
        const mockWindow = {
          document: {
            write: vi.fn(),
            close: vi.fn(),
            getElementById: vi.fn().mockReturnValue(mockDocument),
            readyState: 'complete',
          },
          addEventListener: vi.fn(),
          print: vi.fn(),
        };
        mockOpen.mockReturnValue(mockWindow);

        render(<PrintDialog isOpen={true} onClose={mockOnClose} />);

        // Print in by-day mode (default)
        const printButton = screen.getByText('Print');
        fireEvent.click(printButton);

        // Get the rendered content from the mock root's render call
        expect(mockRoot.render).toHaveBeenCalled();
        const printableView = mockRoot.render.mock.calls[0][0];
        expect(printableView.props.mode).toBe('by-day');

        const items = printableView.props.items;
        expect(items).toBeTruthy();

        // Check day section items - using the correct format from the component
        const dayOneItems = items['Day 1 - Jan 1 - Beach'];
        expect(dayOneItems).toBeDefined();

        // Check for John's regular sunscreen
        const johnSunscreen = dayOneItems.find(
          (item: any) =>
            item.name === 'Sunscreen' && item.person === 'John' && !item.isExtra
        );
        expect(johnSunscreen).toBeTruthy();

        // Check for Jane's extra sunscreen
        const janeSunscreen = dayOneItems.find(
          (item: any) =>
            item.name === 'Sunscreen' && item.person === 'Jane' && item.isExtra
        );
        expect(janeSunscreen).toBeTruthy();
      });

      it('properly handles items from person groups in day view', () => {
        const mockDocument = document.createElement('div');
        const mockWindow = {
          document: {
            write: vi.fn(),
            close: vi.fn(),
            getElementById: vi.fn().mockReturnValue(mockDocument),
            readyState: 'complete',
          },
          addEventListener: vi.fn(),
          print: vi.fn(),
        };
        mockOpen.mockReturnValue(mockWindow);

        render(<PrintDialog isOpen={true} onClose={mockOnClose} />);

        // Print in by-day mode (default)
        const printButton = screen.getByText('Print');
        fireEvent.click(printButton);

        // Get the rendered content from the mock root's render call
        expect(mockRoot.render).toHaveBeenCalled();
        const printableView = mockRoot.render.mock.calls[0][0];
        expect(printableView.props.mode).toBe('by-day');

        const items = printableView.props.items;
        expect(items).toBeTruthy();

        // Check day section items - using the correct format from the component
        const dayOneItems = items['Day 1 - Jan 1 - Beach'];
        expect(dayOneItems).toBeDefined();

        // Check for John's hat
        const johnsHat = dayOneItems.find(
          (item: any) =>
            item.name === 'Hat' && item.person === 'John' && !item.isExtra
        );
        expect(johnsHat).toBeTruthy();
      });

      it('includes person information in Any Day section', () => {
        // Update the mock data to include an item without a day
        (state.useAppSelector as unknown as Mock).mockImplementation(
          (selector) => {
            if (selector === state.selectGroupedItems) {
              return {
                groupedItems: [
                  {
                    type: 'person',
                    person: { id: '1', name: 'John' },
                    items: [
                      {
                        displayName: 'Passport',
                        baseItem: { notes: null },
                        instances: [
                          { dayIndex: undefined, quantity: 1, isExtra: false },
                        ],
                      },
                    ],
                  },
                ],
                groupedGeneralItems: [],
              };
            }
            // Return days when selecting state.trip.days
            if (typeof selector === 'function') {
              return [{ date: '2024-01-01', location: 'Beach' }];
            }
            return {};
          }
        );

        const mockDocument = document.createElement('div');
        const mockWindow = {
          document: {
            write: vi.fn(),
            close: vi.fn(),
            getElementById: vi.fn().mockReturnValue(mockDocument),
            readyState: 'complete',
          },
          addEventListener: vi.fn(),
          print: vi.fn(),
        };
        mockOpen.mockReturnValue(mockWindow);

        render(<PrintDialog isOpen={true} onClose={mockOnClose} />);

        // Print in by-day mode (default)
        const printButton = screen.getByText('Print');
        fireEvent.click(printButton);

        // Get the rendered content from the mock root's render call
        expect(mockRoot.render).toHaveBeenCalled();
        const printableView = mockRoot.render.mock.calls[0][0];
        expect(printableView.props.mode).toBe('by-day');

        const items = printableView.props.items;
        expect(items).toBeTruthy();

        // Check Any Day section items
        const anyDayItems = items['Any Day'];
        expect(anyDayItems).toBeDefined();

        // Check for John's passport
        const johnsPassport = anyDayItems.find(
          (item: any) =>
            item.name === 'Passport' && item.person === 'John' && !item.isExtra
        );
        expect(johnsPassport).toBeTruthy();
      });
    });
  });
});

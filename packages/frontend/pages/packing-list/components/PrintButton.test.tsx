/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, expect, it, beforeEach, afterEach } from 'vitest';
import { PrintButton } from './PrintButton';
import * as state from '@packing-list/state';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock the state hooks
vi.mock('@packing-list/state', () => ({
  useAppSelector: vi.fn(),
  useAppDispatch: vi.fn(),
  selectGroupedItems: vi.fn(),
  selectPackingListViewState: vi.fn(),
}));

// Mock window.open
const mockPrint = vi.fn();
const mockWrite = vi.fn();
const mockClose = vi.fn();
const mockOpen = vi.fn().mockReturnValue({
  document: {
    write: mockWrite,
    close: mockClose,
    getElementById: vi.fn().mockImplementation((id) => {
      if (id === 'print-root') {
        return document.createElement('div');
      }
      throw new Error(`Element with id ${id} not found`);
    }),
    readyState: 'complete',
  },
  print: mockPrint,
  addEventListener: vi.fn((event, handler) => {
    if (event === 'load') {
      handler();
    }
  }),
});

const originalOpen = window.open;

// Create a mock reducer
const mockReducer = (state = {}, action: any) => {
  switch (action.type) {
    case 'UPDATE_PACKING_LIST_VIEW':
      return {
        ...state,
        viewMode: action.payload.viewMode,
      };
    default:
      return state;
  }
};

describe('PrintButton', () => {
  let portalRoot: HTMLElement;
  const mockDispatch = vi.fn((action: any) => action);
  let store: any;

  beforeEach(() => {
    // Create Redux store with mock reducer
    store = configureStore({
      reducer: mockReducer,
      preloadedState: {},
    });

    // Mock window.open
    window.open = mockOpen;

    // Create portal root
    portalRoot = document.createElement('div');
    portalRoot.setAttribute('id', 'print-message-root');
    document.body.appendChild(portalRoot);

    // Mock state
    (
      state.useAppSelector as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation((selector: any) => {
      if (selector === state.selectPackingListViewState) {
        return { viewMode: 'day' };
      }
      if (selector === state.selectGroupedItems) {
        return {
          groupedItems: [
            {
              type: 'day',
              index: 0,
              day: { date: '2024-01-01', location: 'Test Location' },
              items: [
                {
                  displayName: 'Test Item',
                  baseItem: { notes: 'Test Notes' },
                  instances: [
                    {
                      dayIndex: 0,
                      quantity: 1,
                      isExtra: false,
                    },
                  ],
                },
              ],
            },
          ],
          groupedGeneralItems: [
            {
              displayName: 'General Item',
              baseItem: { notes: 'General Notes' },
              instances: [
                {
                  quantity: 1,
                  isExtra: false,
                },
              ],
            },
          ],
        };
      }
      // Handle trip.days selector
      if (typeof selector === 'function') {
        return [{ date: '2024-01-01', location: 'Test Location' }];
      }
      return {};
    });

    (
      state.useAppDispatch as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue(mockDispatch);

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.open = originalOpen;
    document.body.removeChild(portalRoot);
    vi.clearAllMocks();
  });

  it('renders print button', () => {
    render(
      <Provider store={store}>
        <PrintButton />
      </Provider>
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  describe('print functionality', () => {
    it('opens print window and formats items correctly in day mode', () => {
      render(
        <Provider store={store}>
          <PrintButton />
        </Provider>
      );

      fireEvent.click(screen.getByRole('button'));

      // Verify window.open was called
      expect(mockOpen).toHaveBeenCalledWith('', '_blank');

      // Verify HTML was written to the print window
      expect(mockWrite).toHaveBeenCalled();
      const htmlContent = mockWrite.mock.calls[0][0];
      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('<title>Packing List</title>');

      // Verify print was called
      expect(mockPrint).toHaveBeenCalled();
    });

    it('handles window.open failure gracefully', () => {
      // Mock console.error
      const mockConsoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {
          // Do nothing, just capture the error message
          return undefined;
        });

      // Mock window.open to return null
      window.open = vi.fn().mockReturnValue(null);

      render(
        <Provider store={store}>
          <PrintButton />
        </Provider>
      );

      fireEvent.click(screen.getByRole('button'));

      // Verify error was logged
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to open print window'
      );

      // Verify print was not called
      expect(mockPrint).not.toHaveBeenCalled();

      // Restore console.error
      mockConsoleError.mockRestore();
    });

    it('handles keyboard shortcut (Ctrl+P/Cmd+P)', () => {
      render(
        <Provider store={store}>
          <PrintButton />
        </Provider>
      );

      // Simulate Ctrl+P
      fireEvent.keyDown(document, {
        key: 'p',
        ctrlKey: true,
        preventDefault: vi.fn(),
      });

      // Verify window.open was called
      expect(mockOpen).toHaveBeenCalledWith('', '_blank');
      expect(mockPrint).toHaveBeenCalled();
    });
  });
});

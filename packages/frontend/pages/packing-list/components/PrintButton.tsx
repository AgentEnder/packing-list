import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppSelector, useAppDispatch } from '@packing-list/state';
import { Printer } from 'lucide-react';
import {
  selectGroupedItems,
  selectPackingListViewState,
} from '@packing-list/state';
import { PrintableView } from './PrintableView';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { format } from 'date-fns';
import {
  formatDayInfo,
  splitInstancesByExtraStatus,
} from '../utils/item-formatting';

interface PrintItem {
  name: string;
  notes?: string;
  context: string;
  isExtra: boolean;
  quantity: number;
  person?: string;
  day?: string;
  dayStart?: number;
  dayEnd?: number;
}

// Helper function to process instances and create print items
const processInstances = (
  instances: Array<{
    dayIndex?: number;
    quantity: number;
    isExtra: boolean;
    personName?: string;
    dayStart?: number;
    dayEnd?: number;
  }>,
  item: { displayName: string; baseItem: { notes?: string } },
  context: string,
  days: { date: string | number; location?: string }[],
  personName?: string,
  dayContext?: boolean
): PrintItem[] => {
  return instances.flatMap((instance) => {
    if (dayContext) {
      // For by-day view
      if (instance.dayIndex === undefined) {
        // Items without a specific day go to "Any Day"
        return [
          {
            name: item.displayName,
            notes: item.baseItem.notes,
            context: 'Any Day',
            isExtra: instance.isExtra,
            quantity: instance.quantity,
            person: instance.personName || personName,
          },
        ];
      }

      const day = days[instance.dayIndex];
      if (day) {
        const date = new Date(day.date);
        const dateStr = format(date, 'MMM d');
        const context = `Day ${instance.dayIndex + 1} - ${dateStr}${
          day.location ? ` - ${day.location}` : ''
        }`;

        return [
          {
            name: item.displayName,
            notes: item.baseItem.notes,
            context,
            isExtra: instance.isExtra,
            quantity: instance.quantity,
            person: instance.personName || personName,
          },
        ];
      }
      return [];
    } else {
      // For by-person view
      const dayInfo = formatDayInfo(instance, days) || 'All Days';
      return [
        {
          name: item.displayName,
          notes: item.baseItem.notes,
          context,
          isExtra: instance.isExtra,
          quantity: instance.quantity,
          person: personName,
          day: dayInfo,
          dayStart: instance.dayStart,
          dayEnd: instance.dayEnd,
        },
      ];
    }
  });
};

export function PrintButton() {
  const dispatch = useAppDispatch();
  const viewState = useAppSelector(selectPackingListViewState);
  const { groupedItems, groupedGeneralItems } =
    useAppSelector(selectGroupedItems);
  const days = useAppSelector((state) => state.trip.days);

  useEffect(() => {
    const handleBeforePrint = () => {
      // Show the print message
      const printRoot = document.getElementById('print-message-root');
      if (printRoot) {
        printRoot.style.display = 'block';
      }
    };

    const handleAfterPrint = () => {
      // Hide the print message
      const printRoot = document.getElementById('print-message-root');
      if (printRoot) {
        printRoot.style.display = 'none';
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      if (
        e.key === 'p' &&
        (e.ctrlKey || (e.metaKey && navigator.platform.includes('Mac')))
      ) {
        e.preventDefault();
        handlePrint();
        e.stopPropagation();
      }
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.error('Failed to open print window');
      return;
    }

    // First update the view mode in the store to match our print mode
    dispatch({
      type: 'UPDATE_PACKING_LIST_VIEW',
      payload: { viewMode: viewState.viewMode },
    });

    // Show the print message
    const printRoot = document.getElementById('print-message-root');
    if (printRoot) {
      printRoot.style.display = 'block';
    }

    // Convert grouped items to print items
    const allItems = groupedItems.flatMap((group) => {
      if (viewState.viewMode === 'by-day') {
        if (group.type === 'day') {
          const date = new Date(group.day.date);
          const dateStr = format(date, 'MMM d');
          const context = `Day ${group.index + 1} - ${dateStr}${
            group.day.location ? ` - ${group.day.location}` : ''
          }`;

          return group.items.flatMap((item) => {
            // Split instances by extra status
            const { baseItems, extraItems } = splitInstancesByExtraStatus(
              item.instances
            );

            return [
              ...processInstances(
                baseItems.filter((i) => i.dayIndex === group.index),
                item,
                context,
                days,
                undefined,
                true
              ),
              ...processInstances(
                extraItems.filter((i) => i.dayIndex === group.index),
                item,
                context,
                days,
                undefined,
                true
              ),
            ];
          });
        } else if (group.type === 'person') {
          return group.items.flatMap((item) => {
            // Split instances by extra status
            const { baseItems, extraItems } = splitInstancesByExtraStatus(
              item.instances
            );

            const baseItemsByDay = processInstances(
              baseItems,
              item,
              '',
              days,
              group.person.name,
              true
            );
            const extraItemsByDay = processInstances(
              extraItems,
              item,
              '',
              days,
              group.person.name,
              true
            );

            return [...baseItemsByDay, ...extraItemsByDay];
          });
        }
        return [];
      }
      // For by-person view, split each item into its instances
      return group.items.flatMap((item) => {
        const context = group.type === 'person' ? group.person.name : 'General';

        // Split instances by extra status
        const { baseItems, extraItems } = splitInstancesByExtraStatus(
          item.instances
        );

        return [
          ...processInstances(baseItems, item, context, days),
          ...processInstances(extraItems, item, context, days),
        ];
      });
    });

    // Add general items
    const generalItems = groupedGeneralItems.flatMap((item) => {
      // Split instances by extra status
      const { baseItems, extraItems } = splitInstancesByExtraStatus(
        item.instances
      );

      return [
        ...processInstances(
          baseItems,
          item,
          viewState.viewMode === 'by-day' ? 'Any Day' : 'General Items',
          days
        ),
        ...processInstances(
          extraItems,
          item,
          viewState.viewMode === 'by-day' ? 'Any Day' : 'General Items',
          days
        ),
      ];
    });

    // Combine all items and group them by context
    const itemsByContext = [...allItems, ...generalItems].reduce<
      Record<string, PrintItem[]>
    >((acc, item) => {
      if (!acc[item.context]) {
        acc[item.context] = [];
      }
      acc[item.context].push(item);
      return acc;
    }, {});

    // Set up the print window document
    const printDoc = printWindow.document;
    if (typeof printDoc.open === 'function') {
      printDoc.open();
    }
    printDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Packing List</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @media print {
              @page {
                size: letter;
                margin: 0.5in;
              }
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            html {
              background: white;
            }
            body {
              margin: 0;
              padding: 0;
              min-height: 100vh;
              background: white;
            }
            #print-root {
              min-height: 100vh;
              display: flex;
              flex-direction: column;
            }
          </style>
        </head>
        <body>
          <div id="print-root"></div>
        </body>
      </html>
    `);
    printDoc.close();

    // Wait for the document to be ready
    const waitForLoad = () => {
      const printRoot = printDoc.getElementById('print-root');
      if (!printRoot) {
        console.error('Could not find print root element');
        return;
      }

      // Create a React root and render the PrintableView
      const root = createRoot(printRoot);
      flushSync(() => {
        root.render(
          <PrintableView items={itemsByContext} mode={viewState.viewMode} />
        );
      });

      // Print the window
      printWindow.print();
    };

    if (printDoc.readyState === 'complete') {
      waitForLoad();
    } else {
      printWindow.addEventListener('load', waitForLoad);
    }
  };

  return (
    <>
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <Printer className="w-4 h-4" />
        Print
      </button>
      {createPortal(
        <div
          id="print-message-root"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          style={{ display: 'none' }}
        >
          <div className="p-6 bg-white rounded-lg shadow-xl">
            <h2 className="text-xl font-semibold">Printing...</h2>
            <p className="mt-2">
              Please wait while your packing list is being prepared for
              printing.
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

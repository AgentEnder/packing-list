import React, { useEffect, useCallback } from 'react';
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
  categoryId?: string;
  subcategoryId?: string;
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
  item: {
    displayName: string;
    baseItem: {
      notes?: string;
      categoryId?: string;
      subcategoryId?: string;
    };
  },
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
            categoryId: item.baseItem.categoryId,
            subcategoryId: item.baseItem.subcategoryId,
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
            categoryId: item.baseItem.categoryId,
            subcategoryId: item.baseItem.subcategoryId,
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
          categoryId: item.baseItem.categoryId,
          subcategoryId: item.baseItem.subcategoryId,
        },
      ];
    }
  });
};

// Create a client-side only component for the portal
const PrintMessagePortal: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);

    // Create the print message root if it doesn't exist
    if (!document.getElementById('print-message-root')) {
      const printRoot = document.createElement('div');
      printRoot.id = 'print-message-root';
      printRoot.style.display = 'none';
      document.body.appendChild(printRoot);
    }

    // Create the print styles
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      @media print {
        /* Hide everything except our overlay */
        body > *:not(#print-message-root) {
          display: none !important;
        }
        
        #print-message-root {
          display: block !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background: white !important;
          z-index: 99999 !important;
        }

        .print-message {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          height: 100% !important;
          padding: 2rem !important;
        }

        .print-message h2,
        .print-message p {
          display: block !important;
          color: black !important;
        }
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      styleEl.remove();
      const printRoot = document.getElementById('print-message-root');
      if (printRoot) {
        printRoot.remove();
      }
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    children,
    document.getElementById('print-message-root') || document.body
  );
};

export const PrintButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const viewState = useAppSelector(selectPackingListViewState);
  const { groupedItems, groupedGeneralItems } =
    useAppSelector(selectGroupedItems);
  const days = useAppSelector((state) => state.trip.days);

  const handlePrint = useCallback(() => {
    // Create a new window for printing
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
  }, [dispatch, viewState, groupedItems, groupedGeneralItems, days]);

  useEffect(() => {
    const onBeforePrint = () => {
      handlePrint();
    };
    const onKeyPress = (e: KeyboardEvent) => {
      if (
        e.key === 'p' &&
        (e.ctrlKey || (e.metaKey && navigator.platform.includes('Mac')))
      ) {
        e.preventDefault();
        handlePrint();
        e.stopPropagation();
      }
    };

    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('keydown', onKeyPress);

    return () => {
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('keydown', onKeyPress);
    };
  }, [handlePrint]);

  const printMessage = (
    <div className="print-message">
      <div>
        <h2 className="text-2xl font-bold mb-4">Stop! 🖨️</h2>
        <p className="text-lg mb-6">
          Please use the "Print" button in the app to open a properly formatted
          view of your packing list.
        </p>
        <p className="text-base text-base-content/70">
          The print button will open a new window with a clean, organized view
          of your items that's perfect for printing.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <PrintMessagePortal>{printMessage}</PrintMessagePortal>
      <button className="btn btn-sm btn-primary" onClick={handlePrint}>
        <Printer className="w-3.5 h-3.5" />
        <span className="ml-1.5">Print</span>
      </button>
    </>
  );
};

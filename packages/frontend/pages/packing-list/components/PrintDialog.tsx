import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@packing-list/state';
import { Printer } from 'lucide-react';
import { selectGroupedItems, DayGroup, PersonGroup } from '@packing-list/state';
import { PrintableView } from './PrintableView';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { format } from 'date-fns';

interface PrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

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

// Helper function to format day information
const formatDayInfo = (
  instance: { dayIndex?: number; dayStart?: number; dayEnd?: number },
  days: { date: string | number; location?: string }[]
): string | undefined => {
  if (instance.dayIndex === undefined) return undefined;

  const day = days[instance.dayIndex];
  if (!day) return undefined;

  const date = new Date(day.date);
  if (
    instance.dayStart !== undefined &&
    instance.dayEnd !== undefined &&
    instance.dayStart !== instance.dayEnd
  ) {
    return `Days ${instance.dayStart + 1}-${instance.dayEnd + 1}`;
  }

  return `Day ${instance.dayIndex + 1} - ${format(date, 'MMM d')}${
    day.location ? ` (${day.location})` : ''
  }`;
};

// Helper function to create a print item
const createPrintItem = (
  item: { displayName: string; baseItem: { notes?: string } },
  context: string,
  instance: { quantity: number; isExtra: boolean },
  person?: string,
  day?: string,
  dayStart?: number,
  dayEnd?: number
): PrintItem => ({
  name: item.displayName,
  notes: item.baseItem.notes,
  context,
  isExtra: instance.isExtra,
  quantity: instance.quantity,
  person,
  day,
  dayStart,
  dayEnd,
});

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

export const PrintDialog: React.FC<PrintDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [printMode, setPrintMode] = useState<'by-day' | 'by-person'>('by-day');
  const dispatch = useAppDispatch();
  const { groupedItems, groupedGeneralItems } =
    useAppSelector(selectGroupedItems);
  const days = useAppSelector((state) => state.trip.days);

  if (!isOpen) return null;

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.error('Failed to open print window');
      return;
    }

    // First update the view mode in the store to match our print mode
    dispatch({
      type: 'UPDATE_PACKING_LIST_VIEW',
      payload: { viewMode: printMode },
    });

    // Convert grouped items to print items
    const allItems = groupedItems.flatMap((group) => {
      if (printMode === 'by-day') {
        if (group.type === 'day') {
          const dayGroup = group as DayGroup;
          const date = new Date(dayGroup.day.date);
          const dateStr = format(date, 'MMM d');
          const context = `Day ${dayGroup.index + 1} - ${dateStr}${
            dayGroup.day.location ? ` - ${dayGroup.day.location}` : ''
          }`;

          return group.items.flatMap((item) => {
            // Split instances by extra status
            const baseItems = item.instances.filter((i) => !i.isExtra);
            const extraItems = item.instances.filter((i) => i.isExtra);

            return [
              ...processInstances(
                baseItems.filter((i) => i.dayIndex === dayGroup.index),
                item,
                context,
                days,
                undefined,
                true
              ),
              ...processInstances(
                extraItems.filter((i) => i.dayIndex === dayGroup.index),
                item,
                context,
                days,
                undefined,
                true
              ),
            ];
          });
        } else if (group.type === 'person') {
          const personGroup = group as PersonGroup;
          return group.items.flatMap((item) => {
            // Split instances by extra status
            const baseItems = item.instances.filter((i) => !i.isExtra);
            const extraItems = item.instances.filter((i) => i.isExtra);

            const baseItemsByDay = processInstances(
              baseItems,
              item,
              '',
              days,
              personGroup.person.name,
              true
            );
            const extraItemsByDay = processInstances(
              extraItems,
              item,
              '',
              days,
              personGroup.person.name,
              true
            );

            return [...baseItemsByDay, ...extraItemsByDay];
          });
        }
        return [];
      } else {
        // For by-person view, split each item into its instances
        return group.items.flatMap((item) => {
          const context =
            group.type === 'person'
              ? (group as PersonGroup).person.name
              : 'General';

          // Split instances by extra status
          const baseItems = item.instances.filter((i) => !i.isExtra);
          const extraItems = item.instances.filter((i) => i.isExtra);

          return [
            ...processInstances(baseItems, item, context, days),
            ...processInstances(extraItems, item, context, days),
          ];
        });
      }
    });

    // Add general items
    const generalItems = groupedGeneralItems.flatMap((item) => {
      // Split instances by extra status
      const baseItems = item.instances.filter((i) => !i.isExtra);
      const extraItems = item.instances.filter((i) => i.isExtra);

      return [
        ...processInstances(
          baseItems,
          item,
          printMode === 'by-day' ? 'Any Day' : 'General Items',
          days
        ),
        ...processInstances(
          extraItems,
          item,
          printMode === 'by-day' ? 'Any Day' : 'General Items',
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
        root.render(<PrintableView items={itemsByContext} mode={printMode} />);
      });

      // Print the window
      printWindow.print();
    };

    if (printDoc.readyState === 'complete') {
      waitForLoad();
    } else {
      printWindow.addEventListener('load', waitForLoad);
    }

    onClose();
  };

  return (
    <dialog className="modal" open={isOpen}>
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Print Packing List</h3>

        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text">Group by Day</span>
            <input
              type="radio"
              name="print-mode"
              className="radio"
              checked={printMode === 'by-day'}
              onChange={() => setPrintMode('by-day')}
            />
          </label>
        </div>

        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text">Group by Person</span>
            <input
              type="radio"
              name="print-mode"
              className="radio"
              checked={printMode === 'by-person'}
              onChange={() => setPrintMode('by-person')}
            />
          </label>
        </div>

        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </button>
        </div>
      </div>
    </dialog>
  );
};

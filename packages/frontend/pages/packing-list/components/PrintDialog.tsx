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
}

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

            const printItems: PrintItem[] = [];

            // Add base items
            baseItems.forEach((instance) => {
              if (instance.dayIndex === dayGroup.index) {
                printItems.push({
                  name: item.displayName,
                  notes: item.baseItem.notes,
                  context,
                  isExtra: false,
                  quantity: instance.quantity,
                  person: instance.personName,
                });
              }
            });

            // Add extra items
            extraItems.forEach((instance) => {
              if (instance.dayIndex === dayGroup.index) {
                printItems.push({
                  name: item.displayName,
                  notes: item.baseItem.notes,
                  context,
                  isExtra: true,
                  quantity: instance.quantity,
                  person: instance.personName,
                });
              }
            });

            return printItems;
          });
        } else if (group.type === 'person') {
          // Handle person groups in by-day view
          const personGroup = group as PersonGroup;

          return group.items.flatMap((item) => {
            const printItems: PrintItem[] = [];

            // Split instances by extra status
            const baseItems = item.instances.filter((i) => !i.isExtra);
            const extraItems = item.instances.filter((i) => i.isExtra);

            // Process base items
            baseItems.forEach((instance) => {
              if (instance.dayIndex !== undefined) {
                const day = days[instance.dayIndex];
                if (day) {
                  const date = new Date(day.date);
                  const dateStr = format(date, 'MMM d');
                  const context = `Day ${instance.dayIndex + 1} - ${dateStr}${
                    day.location ? ` - ${day.location}` : ''
                  }`;

                  printItems.push({
                    name: item.displayName,
                    notes: item.baseItem.notes,
                    context,
                    isExtra: false,
                    quantity: instance.quantity,
                    person: personGroup.person.name,
                  });
                }
              } else {
                // Items without a specific day go to "Any Day"
                printItems.push({
                  name: item.displayName,
                  notes: item.baseItem.notes,
                  context: 'Any Day',
                  isExtra: false,
                  quantity: instance.quantity,
                  person: personGroup.person.name,
                });
              }
            });

            // Process extra items
            extraItems.forEach((instance) => {
              if (instance.dayIndex !== undefined) {
                const day = days[instance.dayIndex];
                if (day) {
                  const date = new Date(day.date);
                  const dateStr = format(date, 'MMM d');
                  const context = `Day ${instance.dayIndex + 1} - ${dateStr}${
                    day.location ? ` - ${day.location}` : ''
                  }`;

                  printItems.push({
                    name: item.displayName,
                    notes: item.baseItem.notes,
                    context,
                    isExtra: true,
                    quantity: instance.quantity,
                    person: personGroup.person.name,
                  });
                }
              } else {
                // Extra items without a specific day go to "Any Day"
                printItems.push({
                  name: item.displayName,
                  notes: item.baseItem.notes,
                  context: 'Any Day',
                  isExtra: true,
                  quantity: instance.quantity,
                  person: personGroup.person.name,
                });
              }
            });

            return printItems;
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

          // Group instances by day and extra status
          const baseItems = item.instances.filter((i) => !i.isExtra);
          const extraItems = item.instances.filter((i) => i.isExtra);

          // Create print items for base instances
          const baseItemsByDay = baseItems.map((instance): PrintItem => {
            let dayInfo = 'All Days';
            if (instance.dayIndex !== undefined) {
              const day = days[instance.dayIndex];
              if (day) {
                const date = new Date(day.date);
                if (
                  instance.dayStart !== undefined &&
                  instance.dayEnd !== undefined &&
                  instance.dayStart !== instance.dayEnd
                ) {
                  dayInfo = `Days ${instance.dayStart + 1}-${
                    instance.dayEnd + 1
                  }`;
                } else {
                  dayInfo = `Day ${instance.dayIndex + 1} - ${format(
                    date,
                    'MMM d'
                  )}${day.location ? ` (${day.location})` : ''}`;
                }
              }
            }

            return {
              name: item.displayName,
              notes: item.baseItem.notes,
              context,
              isExtra: false,
              quantity: instance.quantity,
              day: dayInfo,
            };
          });

          // Create print items for extra instances
          const extraItemsByDay = extraItems.map((instance): PrintItem => {
            let dayInfo = 'All Days';
            if (instance.dayIndex !== undefined) {
              const day = days[instance.dayIndex];
              if (day) {
                const date = new Date(day.date);
                if (
                  instance.dayStart !== undefined &&
                  instance.dayEnd !== undefined &&
                  instance.dayStart !== instance.dayEnd
                ) {
                  dayInfo = `Days ${instance.dayStart + 1}-${
                    instance.dayEnd + 1
                  }`;
                } else {
                  dayInfo = `Day ${instance.dayIndex + 1} - ${format(
                    date,
                    'MMM d'
                  )}${day.location ? ` (${day.location})` : ''}`;
                }
              }
            }

            return {
              name: item.displayName,
              notes: item.baseItem.notes,
              context,
              isExtra: true,
              quantity: instance.quantity,
              day: dayInfo,
            };
          });

          return [...baseItemsByDay, ...extraItemsByDay];
        });
      }
    });

    // Add general items
    const generalItems = groupedGeneralItems.flatMap((item) => {
      const printItems: PrintItem[] = [];

      // Split instances by extra status
      const baseItems = item.instances.filter((i) => !i.isExtra);
      const extraItems = item.instances.filter((i) => i.isExtra);

      // Add base items
      baseItems.forEach((instance) => {
        printItems.push({
          name: item.displayName,
          notes: item.baseItem.notes,
          context: printMode === 'by-day' ? 'Any Day' : 'General Items',
          isExtra: false,
          quantity: instance.quantity,
          person: instance.personName,
        });
      });

      // Add extra items
      extraItems.forEach((instance) => {
        printItems.push({
          name: item.displayName,
          notes: item.baseItem.notes,
          context: printMode === 'by-day' ? 'Any Day' : 'General Items',
          isExtra: true,
          quantity: instance.quantity,
          person: instance.personName,
        });
      });

      return printItems;
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
